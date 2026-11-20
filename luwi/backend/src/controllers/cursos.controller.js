import mongoose from "mongoose";
import Curso, { NIVELES, ESTADOS_CURSO } from "../models/Curso.js";
import RutaAprendizaje from "../models/RutaAprendizaje.js";
import Competencia from "../models/Competencia.js";
import Empresa from "../models/Empresa.js";
import { unidadEsValida } from "../validators/curso.validator.js";
import { perfilDeSesion, ErrorFormacion, responderError } from "../services/formacion.service.js";

export const esId = (id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id);

// Evita que caracteres como "." o "+" del texto de búsqueda rompan la expresión regular.
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Los cursos creados antes de la entrega 4 no tienen "estado": se tratan como BORRADOR.
export const estadoDe = (curso) => curso.estado ?? "BORRADOR";

// Filtro de MongoDB para un estado (incluye los cursos viejos sin estado en BORRADOR).
const filtroEstado = (estado) =>
  estado === "BORRADOR"
    ? { $or: [{ estado: "BORRADOR" }, { estado: { $exists: false } }] }
    : { estado };

// Unidades vigentes (no retiradas) ordenadas por "orden".
export const unidadesActivas = (curso) =>
  (curso.unidades ?? []).filter((u) => !u.retirada).sort((a, b) => a.orden - b.orden);

// ---------------- Alcance y permisos ----------------
// Un curso sin empresa es GLOBAL (lo ven todas las empresas); con empresa, solo esa empresa.
//   ADMIN (o RRHH antiguo sin empresa): ve y gestiona todos.
//   RRHH con empresa: ve los globales + los de su empresa; solo gestiona los de su empresa.
//   POSTULANTE: no gestiona cursos (su contenido lo ve en /api/mi-formacion).

const gestionaTodo = (perfil) => perfil.rol === "ADMIN" || !perfil.empresa;

export async function perfilGestor(req) {
  const perfil = await perfilDeSesion(req);
  if (perfil.rol === "POSTULANTE") {
    throw new ErrorFormacion(403, "No tienes permiso para gestionar cursos.", "SIN_PERMISO");
  }
  return perfil;
}

const filtroVisibles = (perfil) => (gestionaTodo(perfil) ? {} : { empresa: { $in: [null, perfil.empresa] } });

const puedeVer = (perfil, curso) =>
  gestionaTodo(perfil) || !curso.empresa || String(curso.empresa) === String(perfil.empresa);

export const puedeGestionar = (perfil, curso) =>
  gestionaTodo(perfil) || (curso.empresa && String(curso.empresa) === String(perfil.empresa));

// Carga un curso que el usuario puede modificar. Lanza 404 si no lo puede ver y 403 si solo lo puede ver.
export async function cursoGestionable(req, perfil) {
  if (!esId(req.params.id)) throw new ErrorFormacion(400, "Curso no válido.");
  const curso = await Curso.findById(req.params.id);
  if (!curso || !puedeVer(perfil, curso)) throw new ErrorFormacion(404, "El curso no existe.");
  if (!puedeGestionar(perfil, curso)) {
    throw new ErrorFormacion(403, "Este curso es global o de otra empresa: solo puedes consultarlo.", "SIN_PERMISO");
  }
  return curso;
}

// ---------------- Presentación ----------------

// Mapa cursoId -> [{ _id, nombre }] con las rutas donde aparece cada curso.
async function rutasPorCurso(idsCursos) {
  const rutas = await RutaAprendizaje.find({ cursos: { $in: idsCursos } })
    .select("nombre cursos")
    .lean();

  const mapa = new Map();
  for (const ruta of rutas) {
    for (const cursoId of ruta.cursos) {
      const clave = String(cursoId);
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave).push({ _id: ruta._id, nombre: ruta.nombre });
    }
  }
  return mapa;
}

// Forma en que la API devuelve un curso.
// - En listados ("resumen") no se envía el contenido de las unidades, solo cuántas hay.
// - En el detalle se envían las unidades vigentes ordenadas (y las retiradas si se piden).
// - "editable" le dice a la pantalla si debe mostrar Editar/Publicar/Desactivar.
function presentarCurso(curso, rutas, perfil, { resumen = false, incluirRetiradas = false } = {}) {
  const activas = unidadesActivas(curso);
  const base = {
    ...curso,
    empresa: curso.empresa ?? null,
    alcance: curso.empresa ? "EMPRESA" : "GLOBAL",
    editable: perfil ? Boolean(puedeGestionar(perfil, curso)) : true,
    estado: estadoDe(curso),
    rutas,
    totalUnidades: activas.length,
    unidadesObligatorias: activas.filter((u) => u.obligatoria !== false).length,
  };

  if (resumen) {
    delete base.unidades;
    return base;
  }
  base.unidades = incluirRetiradas
    ? [...(curso.unidades ?? [])].sort((a, b) => a.orden - b.orden)
    : activas;
  return base;
}

async function conRutas(cursos, perfil, opciones) {
  const mapa = await rutasPorCurso(cursos.map((c) => c._id));
  return cursos.map((c) => presentarCurso(c, mapa.get(String(c._id)) ?? [], perfil, opciones));
}

// Otro curso con el mismo título (sin importar mayúsculas)
const tituloRepetido = (titulo, excluirId) =>
  Curso.exists({
    titulo: { $regex: `^${escaparRegex(titulo)}$`, $options: "i" },
    ...(excluirId && { _id: { $ne: excluirId } }),
  });

// Las competencias enviadas deben existir en el catálogo de Naomi y estar ACTIVAS.
async function competenciasInvalidas(ids) {
  if (!ids || ids.length === 0) return false;
  const encontradas = await Competencia.countDocuments({ _id: { $in: ids }, estado: "ACTIVA" });
  return encontradas !== ids.length;
}
const MSG_COMPETENCIAS = "Una o más competencias no existen en el catálogo o están inactivas.";

// ---------------- Endpoints ----------------

// GET /api/cursos?buscar=&nivel=&estado=
export async function listarCursos(req, res) {
  const { buscar, nivel, estado } = req.query;

  try {
    const perfil = await perfilGestor(req);
    const condiciones = [filtroVisibles(perfil)];

    if (typeof buscar === "string" && buscar.trim()) {
      const patron = { $regex: escaparRegex(buscar.trim()), $options: "i" };
      condiciones.push({ $or: [{ titulo: patron }, { competencia: patron }] });
    }
    if (nivel !== undefined) {
      if (!NIVELES.includes(nivel)) return res.status(400).json({ message: "Nivel no válido." });
      condiciones.push({ nivel });
    }
    if (estado !== undefined) {
      if (!ESTADOS_CURSO.includes(estado)) {
        return res.status(400).json({ message: "Estado no válido. Usa BORRADOR, PUBLICADO o INACTIVO." });
      }
      condiciones.push(filtroEstado(estado));
    }

    const cursos = await Curso.find({ $and: condiciones }).sort({ createdAt: -1 }).lean();
    return res.json({ data: await conRutas(cursos, perfil, { resumen: true }) });
  } catch (error) {
    return responderError(res, error, "No se pudieron obtener los cursos.");
  }
}

// GET /api/cursos/:id?incluirRetiradas=true
export async function obtenerCurso(req, res) {
  try {
    const perfil = await perfilGestor(req);
    if (!esId(req.params.id)) return res.status(400).json({ message: "Curso no válido." });

    const curso = await Curso.findById(req.params.id).lean();
    if (!curso || !puedeVer(perfil, curso)) return res.status(404).json({ message: "El curso no existe." });

    const [conDatos] = await conRutas([curso], perfil, {
      incluirRetiradas: req.query.incluirRetiradas === "true",
    });
    return res.json({ data: conDatos });
  } catch (error) {
    return responderError(res, error, "No se pudo obtener el curso.");
  }
}

// POST /api/cursos   (el body ya llega validado por cursoValidator)
// Todo curso nuevo nace en BORRADOR y sin unidades.
// Alcance: RR. HH. -> su empresa (de la sesión). ADMIN -> la empresa que indique, o global.
export async function crearCurso(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { empresa: empresaPedida, ...datos } = req.body;

    let empresa = null;
    if (!gestionaTodo(perfil)) {
      empresa = perfil.empresa;
    } else if (empresaPedida) {
      if (!(await Empresa.exists({ _id: empresaPedida }))) {
        return res.status(400).json({ message: "La empresa seleccionada no existe." });
      }
      empresa = empresaPedida;
    }

    if (await tituloRepetido(datos.titulo)) {
      return res.status(409).json({ message: "Ya existe un curso con ese título." });
    }
    if (await competenciasInvalidas(datos.competencias)) {
      return res.status(400).json({ message: MSG_COMPETENCIAS });
    }

    const curso = await Curso.create({ ...datos, empresa, estado: "BORRADOR", unidades: [] });
    return res.status(201).json({ data: presentarCurso(curso.toObject(), [], perfil) });
  } catch (error) {
    return responderError(res, error, "No se pudo crear el curso.");
  }
}

// PUT /api/cursos/:id   (el body ya llega validado por cursoValidator)
// Solo cambia los datos generales: estado, unidades y alcance no se modifican aquí.
export async function actualizarCurso(req, res) {
  try {
    const perfil = await perfilGestor(req);
    await cursoGestionable(req, perfil);

    const { empresa: _ignorada, ...datos } = req.body;
    if (await tituloRepetido(datos.titulo, req.params.id)) {
      return res.status(409).json({ message: "Ya existe otro curso con ese título." });
    }
    if (await competenciasInvalidas(datos.competencias)) {
      return res.status(400).json({ message: MSG_COMPETENCIAS });
    }

    const curso = await Curso.findByIdAndUpdate(req.params.id, datos, {
      new: true,
      runValidators: true,
    }).lean();

    const [conDatos] = await conRutas([curso], perfil);
    return res.json({ data: conDatos });
  } catch (error) {
    return responderError(res, error, "No se pudo actualizar el curso.");
  }
}

// PATCH /api/cursos/:id/publicar
// Regla: para publicar, el curso debe tener al menos una unidad válida.
// También sirve para volver a publicar un curso INACTIVO.
export async function publicarCurso(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const curso = await cursoGestionable(req, perfil);

    if (estadoDe(curso) === "PUBLICADO") {
      return res.status(409).json({ message: "El curso ya está publicado." });
    }
    if (curso.unidades.filter(unidadEsValida).length === 0) {
      return res.status(409).json({
        message: "No se puede publicar: el curso debe tener al menos una unidad válida.",
      });
    }

    curso.estado = "PUBLICADO";
    curso.fechaPublicacion = new Date();
    await curso.save();

    const [conDatos] = await conRutas([curso.toObject()], perfil);
    return res.json({ message: "Curso publicado correctamente.", data: conDatos });
  } catch (error) {
    return responderError(res, error, "No se pudo publicar el curso.");
  }
}

// PATCH /api/cursos/:id/desactivar
// Pasa el curso a INACTIVO. No se borra nada: unidades, rutas y avance se conservan.
export async function desactivarCurso(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const curso = await cursoGestionable(req, perfil);

    if (estadoDe(curso) === "INACTIVO") {
      return res.status(409).json({ message: "El curso ya está desactivado." });
    }

    curso.estado = "INACTIVO";
    await curso.save();

    const [conDatos] = await conRutas([curso.toObject()], perfil);
    return res.json({ message: "Curso desactivado correctamente.", data: conDatos });
  } catch (error) {
    return responderError(res, error, "No se pudo desactivar el curso.");
  }
}

// DELETE /api/cursos/:id
// Regla: no se puede eliminar un curso que pertenece a alguna ruta de aprendizaje.
// (Desde la entrega 4 lo normal es desactivar; este endpoint se mantiene porque ya funcionaba.)
export async function eliminarCurso(req, res) {
  try {
    const perfil = await perfilGestor(req);
    await cursoGestionable(req, perfil);

    const rutas = await RutaAprendizaje.find({ cursos: req.params.id }).select("nombre").lean();
    if (rutas.length > 0) {
      const nombres = rutas.map((r) => `"${r.nombre}"`).join(", ");
      return res.status(409).json({
        message: `No se puede eliminar: el curso pertenece a ${
          rutas.length === 1 ? "la ruta" : "las rutas"
        } ${nombres}. Quítalo de la ruta primero.`,
        rutas,
      });
    }

    await Curso.findByIdAndDelete(req.params.id);
    return res.json({ message: "Curso eliminado correctamente." });
  } catch (error) {
    return responderError(res, error, "No se pudo eliminar el curso.");
  }
}
