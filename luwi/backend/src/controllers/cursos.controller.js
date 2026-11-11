import mongoose from "mongoose";
import Curso, { NIVELES } from "../models/Curso.js";
import RutaAprendizaje from "../models/RutaAprendizaje.js";

const esId = (id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id);

// Evita que caracteres como "." o "+" del texto de búsqueda rompan la expresión regular.
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

// Agrega a cada curso la lista de rutas a las que pertenece.
// El frontend puede usar "rutas.length > 0" para desactivar el botón de eliminar.
async function conRutas(cursos) {
  const mapa = await rutasPorCurso(cursos.map((c) => c._id));
  return cursos.map((c) => ({ ...c, rutas: mapa.get(String(c._id)) ?? [] }));
}

// Otro curso con el mismo título (sin importar mayúsculas)
const tituloRepetido = (titulo, excluirId) =>
  Curso.exists({
    titulo: { $regex: `^${escaparRegex(titulo)}$`, $options: "i" },
    ...(excluirId && { _id: { $ne: excluirId } }),
  });

// GET /api/cursos?buscar=&nivel=
export async function listarCursos(req, res) {
  const { buscar, nivel } = req.query;
  const filtro = {};

  if (typeof buscar === "string" && buscar.trim()) {
    const patron = { $regex: escaparRegex(buscar.trim()), $options: "i" };
    filtro.$or = [{ titulo: patron }, { competencia: patron }];
  }
  if (nivel !== undefined) {
    if (!NIVELES.includes(nivel)) return res.status(400).json({ message: "Nivel no válido." });
    filtro.nivel = nivel;
  }

  try {
    const cursos = await Curso.find(filtro).sort({ createdAt: -1 }).lean();
    return res.json({ data: await conRutas(cursos) });
  } catch {
    return res.status(500).json({ message: "No se pudieron obtener los cursos." });
  }
}

// GET /api/cursos/:id
export async function obtenerCurso(req, res) {
  if (!esId(req.params.id)) return res.status(400).json({ message: "Curso no válido." });

  try {
    const curso = await Curso.findById(req.params.id).lean();
    if (!curso) return res.status(404).json({ message: "El curso no existe." });
    const [conDatos] = await conRutas([curso]);
    return res.json({ data: conDatos });
  } catch {
    return res.status(500).json({ message: "No se pudo obtener el curso." });
  }
}

// POST /api/cursos   (el body ya llega validado por cursoValidator)
export async function crearCurso(req, res) {
  try {
    if (await tituloRepetido(req.body.titulo)) {
      return res.status(409).json({ message: "Ya existe un curso con ese título." });
    }
    const curso = await Curso.create(req.body);
    return res.status(201).json({ data: { ...curso.toObject(), rutas: [] } });
  } catch {
    return res.status(500).json({ message: "No se pudo crear el curso." });
  }
}

// PUT /api/cursos/:id   (el body ya llega validado por cursoValidator)
export async function actualizarCurso(req, res) {
  if (!esId(req.params.id)) return res.status(400).json({ message: "Curso no válido." });

  try {
    if (await tituloRepetido(req.body.titulo, req.params.id)) {
      return res.status(409).json({ message: "Ya existe otro curso con ese título." });
    }
    const curso = await Curso.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!curso) return res.status(404).json({ message: "El curso no existe." });

    const [conDatos] = await conRutas([curso]);
    return res.json({ data: conDatos });
  } catch {
    return res.status(500).json({ message: "No se pudo actualizar el curso." });
  }
}

// DELETE /api/cursos/:id
// Regla: no se puede eliminar un curso que pertenece a alguna ruta de aprendizaje.
export async function eliminarCurso(req, res) {
  if (!esId(req.params.id)) return res.status(400).json({ message: "Curso no válido." });

  try {
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

    const eliminado = await Curso.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ message: "El curso no existe." });
    return res.json({ message: "Curso eliminado correctamente." });
  } catch {
    return res.status(500).json({ message: "No se pudo eliminar el curso." });
  }
}
