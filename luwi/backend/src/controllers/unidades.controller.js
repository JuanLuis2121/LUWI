import Curso from "../models/Curso.js";
import { esId, estadoDe, unidadesActivas, perfilGestor, cursoGestionable, puedeGestionar } from "./cursos.controller.js";
import { unidadEsValida } from "../validators/curso.validator.js";
import { ErrorFormacion, responderError } from "../services/formacion.service.js";

// Carga el curso (que el usuario pueda gestionar) y, si se pide, la unidad vigente dentro de él.
// Si algo falla lanza ErrorFormacion (400/403/404), que responderError convierte en respuesta.
async function cargar(req, { conUnidad = false } = {}) {
  const perfil = await perfilGestor(req);
  if (conUnidad && !esId(req.params.unidadId)) throw new ErrorFormacion(400, "Unidad no válida.");

  const curso = await cursoGestionable(req, perfil);
  if (!conUnidad) return { curso };

  const unidad = curso.unidades.id(req.params.unidadId);
  if (!unidad || unidad.retirada) throw new ErrorFormacion(404, "La unidad no existe o ya fue retirada.");
  return { curso, unidad };
}

// Respuesta común: las unidades vigentes del curso, ya ordenadas.
const responderUnidades = (res, curso, extra = {}, status = 200) =>
  res.status(status).json({
    ...extra,
    data: {
      cursoId: String(curso._id),
      estado: estadoDe(curso),
      unidades: unidadesActivas(curso.toObject()),
    },
  });

// Reenumera las unidades vigentes 1, 2, 3... para que no queden huecos.
function reenumerar(curso) {
  unidadesActivas(curso).forEach((u, i) => {
    u.orden = i + 1;
  });
}

// GET /api/cursos/:id/unidades
// Basta con poder ver el curso (un RR. HH. también consulta las unidades de los cursos globales).
export async function listarUnidades(req, res) {
  try {
    const perfil = await perfilGestor(req);
    if (!esId(req.params.id)) throw new ErrorFormacion(400, "Curso no válido.");
    const curso = await Curso.findById(req.params.id);
    const visible = curso && (puedeGestionar(perfil, curso) || !curso.empresa);
    if (!visible) throw new ErrorFormacion(404, "El curso no existe.");
    return responderUnidades(res, curso);
  } catch (error) {
    return responderError(res, error, "No se pudieron obtener las unidades.");
  }
}

// POST /api/cursos/:id/unidades   (body validado por unidadValidator)
// La unidad nueva se agrega al final.
export async function crearUnidad(req, res) {
  try {
    const r = await cargar(req);
    const { curso } = r;

    if (estadoDe(curso) === "INACTIVO") {
      return res.status(409).json({ message: "No se pueden agregar unidades a un curso desactivado." });
    }

    const ultimo = unidadesActivas(curso).at(-1)?.orden ?? 0;
    curso.unidades.push({ ...req.body, orden: ultimo + 1 });
    await curso.save();

    const nueva = curso.unidades.at(-1);
    return responderUnidades(res, curso, { message: "Unidad agregada correctamente.", unidadId: String(nueva._id) }, 201);
  } catch (error) {
    return responderError(res, error, "No se pudo agregar la unidad.");
  }
}

// PUT /api/cursos/:id/unidades/:unidadId   (body validado por unidadValidator)
// Se modifica la misma unidad (conserva su _id), así no se pierde el avance de nadie.
export async function actualizarUnidad(req, res) {
  try {
    const r = await cargar(req, { conUnidad: true });
    const { curso, unidad } = r;

    const { titulo, tipo, contenido, recursoUrl, obligatoria } = req.body;
    unidad.set({ titulo, tipo, contenido, recursoUrl, obligatoria });
    await curso.save();

    return responderUnidades(res, curso, { message: "Unidad actualizada correctamente." });
  } catch (error) {
    return responderError(res, error, "No se pudo actualizar la unidad.");
  }
}

// PATCH /api/cursos/:id/unidades/:unidadId/mover   body: { direccion: "subir" | "bajar" }
// Intercambia el orden con la unidad vecina.
export async function moverUnidad(req, res) {
  try {
    const r = await cargar(req, { conUnidad: true });
    const { curso, unidad } = r;

    const activas = unidadesActivas(curso);
    const i = activas.findIndex((u) => String(u._id) === String(unidad._id));
    const j = req.body.direccion === "subir" ? i - 1 : i + 1;

    if (j < 0 || j >= activas.length) {
      return res.status(409).json({
        message: req.body.direccion === "subir"
          ? "La unidad ya es la primera."
          : "La unidad ya es la última.",
      });
    }

    const vecina = activas[j];
    [unidad.orden, vecina.orden] = [vecina.orden, unidad.orden];
    reenumerar(curso);
    await curso.save();

    return responderUnidades(res, curso, { message: "Orden actualizado." });
  } catch (error) {
    return responderError(res, error, "No se pudo cambiar el orden.");
  }
}

// DELETE /api/cursos/:id/unidades/:unidadId
// Retira la unidad: NO se borra, se marca como retirada para conservar el historial de avance.
// Regla: un curso PUBLICADO no puede quedarse sin unidades válidas.
export async function retirarUnidad(req, res) {
  try {
    const r = await cargar(req, { conUnidad: true });
    const { curso, unidad } = r;

    if (estadoDe(curso) === "PUBLICADO") {
      const otrasValidas = curso.unidades.filter(
        (u) => String(u._id) !== String(unidad._id) && unidadEsValida(u)
      );
      if (otrasValidas.length === 0) {
        return res.status(409).json({
          message: "No se puede retirar: es la única unidad válida de un curso publicado. Agrega otra unidad o desactiva el curso primero.",
        });
      }
    }

    unidad.retirada = true;
    unidad.fechaRetiro = new Date();
    reenumerar(curso);
    await curso.save();

    return responderUnidades(res, curso, { message: "Unidad retirada correctamente." });
  } catch (error) {
    return responderError(res, error, "No se pudo retirar la unidad.");
  }
}
