// Administración de evaluaciones y preguntas (entrega 5, partes A y B).
// Lo usan RRHH, ADMIN-EMPRESA y ADMIN. El postulante realiza las evaluaciones
// desde /api/mi-formacion (miEvaluaciones.controller.js).
import Evaluacion, { ESTADOS_EVALUACION } from "../models/Evaluacion.js";
import IntentoEvaluacion from "../models/IntentoEvaluacion.js";
import Curso from "../models/Curso.js";
import { esId, ErrorFormacion, responderError } from "../services/formacion.service.js";
import { perfilGestor, puedeVer, puedeGestionar, filtroVisibles } from "./cursos.controller.js";

// Los errores de validación del modelo (ej. "La respuesta correcta debe ser una de las opciones")
// se devuelven como 400 con el primer mensaje, en vez de un 500.
function responder(res, error, mensaje500) {
  if (error?.name === "ValidationError") {
    const primero = Object.values(error.errors)[0];
    return res.status(400).json({ message: primero?.message ?? "Datos no válidos." });
  }
  return responderError(res, error, mensaje500);
}

const preguntasVigentes = (ev) =>
  (ev.preguntas ?? []).filter((p) => !p.retirada).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

const puntajeTotal = (ev) => preguntasVigentes(ev).reduce((t, p) => t + (p.puntos ?? 1), 0);

// Forma en que la API devuelve una evaluación al administrador.
// resumen = true: sin el contenido de las preguntas (para listados).
function presentar(ev, curso, perfil, { resumen = false, incluirRetiradas = false, intentos = 0 } = {}) {
  const obj = typeof ev.toObject === "function" ? ev.toObject() : { ...ev };
  const vigentes = preguntasVigentes(obj);
  const base = {
    _id: obj._id,
    titulo: obj.titulo,
    descripcion: obj.descripcion ?? "",
    estado: obj.estado,
    puntajeMinimoAprobar: obj.puntajeMinimoAprobar,
    curso: curso ? { _id: curso._id, titulo: curso.titulo, estado: curso.estado ?? "BORRADOR" } : { _id: obj.curso },
    totalPreguntas: vigentes.length,
    puntajeTotal: puntajeTotal(obj),
    intentosRegistrados: intentos,
    editable: curso ? Boolean(puedeGestionar(perfil, curso)) : false,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
  if (resumen) return base;
  base.preguntas = incluirRetiradas
    ? [...obj.preguntas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    : vigentes;
  return base;
}

// Carga la evaluación y su curso, comprobando permisos.
//   soloVer: basta con poder ver el curso (los globales se pueden consultar).
//   si no: hay que poder gestionar el curso (de su empresa, o ADMIN).
async function cargarEvaluacion(req, perfil, { soloVer = false } = {}) {
  if (!esId(req.params.id)) throw new ErrorFormacion(400, "Evaluación no válida.");
  const ev = await Evaluacion.findById(req.params.id);
  if (!ev) throw new ErrorFormacion(404, "La evaluación no existe.");

  const curso = await Curso.findById(ev.curso).select("titulo estado empresa").lean();
  if (!curso || !puedeVer(perfil, curso)) throw new ErrorFormacion(404, "La evaluación no existe.");
  if (!soloVer && !puedeGestionar(perfil, curso)) {
    throw new ErrorFormacion(403, "Esta evaluación es de un curso global o de otra empresa: solo puedes consultarla.", "SIN_PERMISO");
  }
  return { ev, curso };
}

// Respuesta común de las operaciones sobre preguntas.
const responderPreguntas = (res, ev, extra = {}, status = 200) =>
  res.status(status).json({
    ...extra,
    data: {
      evaluacionId: String(ev._id),
      estado: ev.estado,
      totalPreguntas: preguntasVigentes(ev).length,
      puntajeTotal: puntajeTotal(ev),
      preguntas: preguntasVigentes(ev.toObject()),
    },
  });

// ======================= EVALUACIONES =======================

// GET /api/evaluaciones?curso=&estado=
export async function listarEvaluaciones(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { curso, estado } = req.query;
    const filtro = {};

    if (estado !== undefined) {
      if (!ESTADOS_EVALUACION.includes(estado)) {
        throw new ErrorFormacion(400, "Estado no válido. Usa BORRADOR, PUBLICADA o INACTIVA.");
      }
      filtro.estado = estado;
    }

    // Solo evaluaciones de cursos que el usuario puede ver (globales + de su empresa, o todos si es ADMIN)
    const cursosVisibles = await Curso.find(filtroVisibles(perfil)).select("titulo estado empresa").lean();
    const porId = new Map(cursosVisibles.map((c) => [String(c._id), c]));

    if (curso !== undefined) {
      if (!esId(curso) || !porId.has(String(curso))) throw new ErrorFormacion(404, "El curso no existe.");
      filtro.curso = curso;
    } else {
      filtro.curso = { $in: cursosVisibles.map((c) => c._id) };
    }

    const evaluaciones = await Evaluacion.find(filtro).sort({ createdAt: -1 }).lean();
    const conteos = await IntentoEvaluacion.aggregate([
      { $match: { evaluacion: { $in: evaluaciones.map((e) => e._id) } } },
      { $group: { _id: "$evaluacion", n: { $sum: 1 } } },
    ]);
    const intentosPor = new Map(conteos.map((c) => [String(c._id), c.n]));

    return res.json({
      data: evaluaciones.map((e) =>
        presentar(e, porId.get(String(e.curso)), perfil, { resumen: true, intentos: intentosPor.get(String(e._id)) ?? 0 })
      ),
    });
  } catch (error) {
    return responder(res, error, "No se pudieron obtener las evaluaciones.");
  }
}

// GET /api/evaluaciones/:id?incluirRetiradas=true
// Incluye las respuestas correctas: es la vista del administrador.
export async function obtenerEvaluacion(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { ev, curso } = await cargarEvaluacion(req, perfil, { soloVer: true });
    const intentos = await IntentoEvaluacion.countDocuments({ evaluacion: ev._id });
    return res.json({
      data: presentar(ev, curso, perfil, { incluirRetiradas: req.query.incluirRetiradas === "true", intentos }),
    });
  } catch (error) {
    return responder(res, error, "No se pudo obtener la evaluación.");
  }
}

// POST /api/evaluaciones   body: { curso, titulo, descripcion?, puntajeMinimoAprobar? }
// Toda evaluación nueva nace en BORRADOR y sin preguntas.
export async function crearEvaluacion(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const curso = await Curso.findById(req.body.curso).select("titulo estado empresa").lean();
    if (!curso || !puedeVer(perfil, curso)) throw new ErrorFormacion(404, "El curso seleccionado no existe.");
    if (!puedeGestionar(perfil, curso)) {
      throw new ErrorFormacion(403, "Solo puedes crear evaluaciones para cursos de tu empresa.", "SIN_PERMISO");
    }

    const ev = await Evaluacion.create({
      curso: curso._id,
      titulo: req.body.titulo,
      descripcion: req.body.descripcion ?? "",
      ...(req.body.puntajeMinimoAprobar !== undefined && { puntajeMinimoAprobar: req.body.puntajeMinimoAprobar }),
      estado: "BORRADOR",
      preguntas: [],
      creadoPor: perfil._id,
    });
    return res.status(201).json({ message: "Evaluación creada correctamente.", data: presentar(ev, curso, perfil) });
  } catch (error) {
    return responder(res, error, "No se pudo crear la evaluación.");
  }
}

// PUT /api/evaluaciones/:id   body: { titulo, descripcion?, puntajeMinimoAprobar? }
// El curso no se cambia: los intentos ya guardados dependen de él.
export async function actualizarEvaluacion(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { ev, curso } = await cargarEvaluacion(req, perfil);

    ev.titulo = req.body.titulo;
    ev.descripcion = req.body.descripcion ?? "";
    if (req.body.puntajeMinimoAprobar !== undefined) ev.puntajeMinimoAprobar = req.body.puntajeMinimoAprobar;
    await ev.save();

    return res.json({ message: "Evaluación actualizada correctamente.", data: presentar(ev, curso, perfil) });
  } catch (error) {
    return responder(res, error, "No se pudo actualizar la evaluación.");
  }
}

// PATCH /api/evaluaciones/:id/publicar
// Exige al menos una pregunta vigente. También reactiva una evaluación INACTIVA.
export async function publicarEvaluacion(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { ev, curso } = await cargarEvaluacion(req, perfil);

    if (ev.estado === "PUBLICADA") throw new ErrorFormacion(409, "La evaluación ya está publicada.");
    if (preguntasVigentes(ev).length === 0) {
      throw new ErrorFormacion(409, "No se puede publicar una evaluación sin preguntas válidas.");
    }

    ev.estado = "PUBLICADA";
    await ev.save();
    return res.json({ message: "Evaluación publicada correctamente.", data: presentar(ev, curso, perfil) });
  } catch (error) {
    return responder(res, error, "No se pudo publicar la evaluación.");
  }
}

// PATCH /api/evaluaciones/:id/desactivar
// Pasa a INACTIVA: ya no se puede iniciar. Los intentos y resultados se conservan.
export async function desactivarEvaluacion(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { ev, curso } = await cargarEvaluacion(req, perfil);

    if (ev.estado === "INACTIVA") throw new ErrorFormacion(409, "La evaluación ya está desactivada.");
    ev.estado = "INACTIVA";
    await ev.save();
    return res.json({ message: "Evaluación desactivada correctamente.", data: presentar(ev, curso, perfil) });
  } catch (error) {
    return responder(res, error, "No se pudo desactivar la evaluación.");
  }
}

// ======================= PREGUNTAS =======================

// GET /api/evaluaciones/:id/preguntas
export async function listarPreguntas(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { ev } = await cargarEvaluacion(req, perfil, { soloVer: true });
    return responderPreguntas(res, ev);
  } catch (error) {
    return responder(res, error, "No se pudieron obtener las preguntas.");
  }
}

// POST /api/evaluaciones/:id/preguntas   (body validado por preguntaValidator)
// La pregunta nueva se agrega al final.
export async function crearPregunta(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { ev } = await cargarEvaluacion(req, perfil);
    if (ev.estado === "INACTIVA") {
      throw new ErrorFormacion(409, "No se pueden agregar preguntas a una evaluación desactivada.");
    }

    const ultimo = preguntasVigentes(ev).at(-1)?.orden ?? 0;
    const { pregunta, tipo, opciones, respuestaCorrecta, puntos } = req.body;
    ev.preguntas.push({ pregunta, tipo, opciones, respuestaCorrecta, puntos, orden: ultimo + 1 });
    await ev.save();

    const nueva = ev.preguntas.at(-1);
    return responderPreguntas(res, ev, { message: "Pregunta agregada correctamente.", preguntaId: String(nueva._id) }, 201);
  } catch (error) {
    return responder(res, error, "No se pudo agregar la pregunta.");
  }
}

// Busca una pregunta vigente dentro de la evaluación.
function preguntaVigente(ev, preguntaId) {
  if (!esId(preguntaId)) throw new ErrorFormacion(400, "Pregunta no válida.");
  const p = ev.preguntas.id(preguntaId);
  if (!p || p.retirada) throw new ErrorFormacion(404, "La pregunta no existe o ya fue retirada.");
  return p;
}

// PUT /api/evaluaciones/:id/preguntas/:preguntaId   (body validado por preguntaValidator)
// Se modifica la misma pregunta (conserva su _id): los intentos guardados siguen apuntando a ella.
export async function actualizarPregunta(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { ev } = await cargarEvaluacion(req, perfil);
    const p = preguntaVigente(ev, req.params.preguntaId);

    const { pregunta, tipo, opciones, respuestaCorrecta, puntos } = req.body;
    p.set({ pregunta, tipo, opciones, respuestaCorrecta, puntos });
    await ev.save();

    return responderPreguntas(res, ev, { message: "Pregunta actualizada correctamente." });
  } catch (error) {
    return responder(res, error, "No se pudo actualizar la pregunta.");
  }
}

// DELETE /api/evaluaciones/:id/preguntas/:preguntaId
// Retira la pregunta (no se borra). Una evaluación PUBLICADA no puede quedarse sin preguntas.
export async function retirarPregunta(req, res) {
  try {
    const perfil = await perfilGestor(req);
    const { ev } = await cargarEvaluacion(req, perfil);
    const p = preguntaVigente(ev, req.params.preguntaId);

    if (ev.estado === "PUBLICADA" && preguntasVigentes(ev).length === 1) {
      throw new ErrorFormacion(
        409,
        "No se puede retirar: es la única pregunta de una evaluación publicada. Agrega otra o desactiva la evaluación primero."
      );
    }

    p.retirada = true;
    p.fechaRetiro = new Date();
    preguntasVigentes(ev).forEach((q, i) => (q.orden = i + 1)); // sin huecos en el orden
    await ev.save();

    return responderPreguntas(res, ev, { message: "Pregunta retirada correctamente." });
  } catch (error) {
    return responder(res, error, "No se pudo retirar la pregunta.");
  }
}
