// Realización de evaluaciones por el postulante (entrega 5, parte C).
// Rutas dentro de /api/mi-formacion. Reutiliza las validaciones de mi-formación:
// sesión POSTULANTE, dueño de la asignación, proceso no suspendido y curso habilitado.
import Evaluacion from "../models/Evaluacion.js";
import IntentoEvaluacion, { MAX_INTENTOS } from "../models/IntentoEvaluacion.js";
import {
  esId,
  ErrorFormacion,
  responderError,
  verificarCursoDelPostulante,
  avanceDeAsignacion,
} from "../services/formacion.service.js";

const mismo = (a, b) => a != null && b != null && String(a) === String(b);

const preguntasVigentes = (ev) =>
  (ev.preguntas ?? []).filter((p) => !p.retirada).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

function responder(res, error, mensaje500) {
  if (error?.name === "ValidationError") {
    const primero = Object.values(error.errors)[0];
    return res.status(400).json({ message: primero?.message ?? "Datos no válidos." });
  }
  return responderError(res, error, mensaje500);
}

// ¿Revisó todas las unidades obligatorias del curso? (requisito para presentar la evaluación)
async function contenidosRevisados(asignacion, cursoAsignado) {
  const { avance } = await avanceDeAsignacion(asignacion);
  const c = avance.cursos.find((x) => x.cursoAsignadoId === String(cursoAsignado._id));
  if (!c) return { revisados: false, total: 0, hechas: 0 };
  return {
    revisados: c.totalObligatorias === 0 || c.revisadasObligatorias === c.totalObligatorias,
    total: c.totalObligatorias,
    hechas: c.revisadasObligatorias,
  };
}

// Intentos del postulante en una evaluación de su asignación, y la nota oficial
// (la calificación más alta entre los FINALIZADOS).
async function resumenIntentos(asignacionId, evaluacionId, candidatoId) {
  const intentos = await IntentoEvaluacion.find({
    asignacion: asignacionId,
    evaluacion: evaluacionId,
    postulante: candidatoId,
  })
    .sort({ numeroIntento: 1 })
    .lean();

  const finalizados = intentos.filter((i) => i.estado === "FINALIZADO");
  const mejor = finalizados.reduce((m, i) => (!m || i.calificacion > m.calificacion ? i : m), null);
  const enCurso = intentos.find((i) => i.estado === "EN_CURSO") ?? null;

  return {
    intentos,
    enCurso,
    usados: intentos.length,
    restantes: Math.max(0, MAX_INTENTOS - intentos.length),
    oficial: mejor
      ? { calificacion: mejor.calificacion, resultado: mejor.resultado, fecha: mejor.fechaFinalizacion, numeroIntento: mejor.numeroIntento }
      : null,
  };
}

const intentoBreve = (i) => ({
  intentoId: String(i._id),
  numeroIntento: i.numeroIntento,
  estado: i.estado,
  calificacion: i.calificacion ?? null,
  resultado: i.resultado ?? null,
  fechaInicio: i.fechaInicio,
  fechaFinalizacion: i.fechaFinalizacion ?? null,
});

// Evaluación para presentar: sin respuestas correctas ni preguntas retiradas (método de Naomi).
function evaluacionParaPostulante(ev) {
  const obj = ev.paraPostulante();
  return {
    _id: obj._id,
    titulo: obj.titulo,
    descripcion: obj.descripcion ?? "",
    puntajeMinimoAprobar: obj.puntajeMinimoAprobar,
    puntajeTotal: obj.puntajeTotal,
    preguntas: obj.preguntas
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((p) => ({ _id: p._id, pregunta: p.pregunta, tipo: p.tipo, opciones: p.opciones, puntos: p.puntos })),
  };
}

// Carga una evaluación PUBLICADA del curso asignado.
async function evaluacionDelCurso(evaluacionId, cursoAsignado, { exigirPublicada = true } = {}) {
  if (!esId(evaluacionId)) throw new ErrorFormacion(404, "La evaluación no existe.", "NO_ENCONTRADO");
  const ev = await Evaluacion.findById(evaluacionId);
  if (!ev || !mismo(ev.curso, cursoAsignado.curso)) {
    throw new ErrorFormacion(404, "La evaluación no existe en este curso.", "NO_ENCONTRADO");
  }
  if (exigirPublicada && ev.estado !== "PUBLICADA") {
    throw new ErrorFormacion(409, "Esta evaluación no está disponible.", "EVALUACION_NO_DISPONIBLE");
  }
  return ev;
}

// ======================================================================

// GET /api/mi-formacion/:asignacionId/cursos/:cursoAsignadoId/evaluaciones
// Evaluaciones publicadas del curso, con intentos usados, nota oficial y si puede presentarla.
export async function listarMisEvaluaciones(req, res) {
  try {
    const { asignacion, cursoAsignado, candidatoId } = await verificarCursoDelPostulante(req);
    const contenidos = await contenidosRevisados(asignacion, cursoAsignado);
    const evaluaciones = await Evaluacion.find({ curso: cursoAsignado.curso, estado: "PUBLICADA" })
      .sort({ createdAt: 1 });

    const data = [];
    for (const ev of evaluaciones) {
      const r = await resumenIntentos(asignacion._id, ev._id, candidatoId);
      let motivo = null;
      if (!contenidos.revisados) motivo = "Primero revisa todos los contenidos obligatorios del curso.";
      else if (!r.enCurso && r.restantes === 0) motivo = "Ya usaste tus intentos.";

      data.push({
        evaluacionId: String(ev._id),
        titulo: ev.titulo,
        descripcion: ev.descripcion ?? "",
        totalPreguntas: preguntasVigentes(ev).length,
        puntajeTotal: ev.puntajeTotal,
        puntajeMinimoAprobar: ev.puntajeMinimoAprobar,
        intentosUsados: r.usados,
        intentosRestantes: r.restantes,
        maxIntentos: MAX_INTENTOS,
        intentoEnCurso: r.enCurso ? String(r.enCurso._id) : null,
        notaOficial: r.oficial,
        disponible: motivo === null,
        motivo,
      });
    }

    return res.json({
      data: {
        cursoAsignadoId: String(cursoAsignado._id),
        contenidosRevisados: contenidos.revisados,
        unidadesObligatorias: { total: contenidos.total, revisadas: contenidos.hechas },
        evaluaciones: data,
      },
    });
  } catch (error) {
    return responder(res, error, "No se pudieron obtener las evaluaciones del curso.");
  }
}

// POST /api/mi-formacion/:asignacionId/cursos/:cursoAsignadoId/evaluaciones/:evaluacionId/intentos
// Inicia un intento. Si ya hay uno EN_CURSO lo devuelve (no crea otro). Máximo 2 intentos.
export async function iniciarIntento(req, res) {
  try {
    const { asignacion, cursoAsignado, candidatoId, proceso } = await verificarCursoDelPostulante(req);
    const ev = await evaluacionDelCurso(req.params.evaluacionId, cursoAsignado);

    const contenidos = await contenidosRevisados(asignacion, cursoAsignado);
    if (!contenidos.revisados) {
      throw new ErrorFormacion(409, "Primero revisa todos los contenidos obligatorios del curso.", "CONTENIDOS_PENDIENTES", {
        unidadesObligatorias: { total: contenidos.total, revisadas: contenidos.hechas },
      });
    }

    const r = await resumenIntentos(asignacion._id, ev._id, candidatoId);
    // intentosUsados cuenta también el intento que se devuelve (el que está en curso).
    const responderIntento = (intento, status, message, intentosUsados) =>
      res.status(status).json({
        message,
        data: {
          intento: intentoBreve(intento),
          intentosRestantes: Math.max(0, MAX_INTENTOS - intentosUsados),
          evaluacion: evaluacionParaPostulante(ev),
        },
      });

    if (r.enCurso) return responderIntento(r.enCurso, 200, "Continúas tu intento en curso.", r.usados);
    if (r.restantes === 0) {
      throw new ErrorFormacion(409, `Ya usaste tus ${MAX_INTENTOS} intentos para esta evaluación.`, "SIN_INTENTOS", {
        notaOficial: r.oficial,
      });
    }

    let intento;
    try {
      intento = await IntentoEvaluacion.create({
        evaluacion: ev._id,
        curso: cursoAsignado.curso,
        asignacion: asignacion._id,
        cursoAsignadoId: cursoAsignado._id,
        proceso: proceso._id,
        postulante: candidatoId,
        empresa: asignacion.empresa ?? proceso.empresa?._id ?? proceso.empresa,
        numeroIntento: r.usados + 1,
        estado: "EN_CURSO",
      });
    } catch (e) {
      // Doble clic en "Iniciar": la otra solicitud ya creó el intento. Se devuelve ese.
      if (e?.code === 11000) {
        const existente = await IntentoEvaluacion.findOne({
          asignacion: asignacion._id, evaluacion: ev._id, postulante: candidatoId, estado: "EN_CURSO",
        }).lean();
        if (existente) return responderIntento(existente, 200, "Continúas tu intento en curso.", r.usados + 1);
      }
      throw e;
    }

    return responderIntento(intento.toObject(), 201, "Intento iniciado.", r.usados + 1);
  } catch (error) {
    return responder(res, error, "No se pudo iniciar la evaluación.");
  }
}

// PUT /api/mi-formacion/:asignacionId/cursos/:cursoAsignadoId/evaluaciones/:evaluacionId/intentos/:intentoId
// body: { respuestas: [{ pregunta, respuesta }] }
// Califica con las respuestas correctas guardadas en el servidor y finaliza el intento.
export async function enviarRespuestas(req, res) {
  try {
    const { asignacion, cursoAsignado, candidatoId } = await verificarCursoDelPostulante(req);
    // No se exige PUBLICADA: si la desactivaron mientras respondía, puede terminar su intento.
    const ev = await evaluacionDelCurso(req.params.evaluacionId, cursoAsignado, { exigirPublicada: false });

    const { intentoId } = req.params;
    if (!esId(intentoId)) throw new ErrorFormacion(404, "El intento no existe.", "NO_ENCONTRADO");
    const intento = await IntentoEvaluacion.findOne({
      _id: intentoId,
      asignacion: asignacion._id,
      evaluacion: ev._id,
      postulante: candidatoId,
    });
    if (!intento) throw new ErrorFormacion(404, "El intento no existe.", "NO_ENCONTRADO");
    if (intento.estado === "FINALIZADO") {
      throw new ErrorFormacion(409, "Este intento ya fue enviado.", "INTENTO_FINALIZADO");
    }

    // ---- validar respuestas contra las preguntas vigentes de la evaluación ----
    const vigentes = preguntasVigentes(ev);
    const porId = new Map(vigentes.map((p) => [String(p._id), p]));
    const vistas = new Set();
    const calificadas = [];

    for (const { pregunta, respuesta } of req.body.respuestas) {
      const p = porId.get(String(pregunta));
      if (!p) throw new ErrorFormacion(400, "Enviaste una respuesta para una pregunta que no existe en esta evaluación.", "PREGUNTA_INVALIDA");
      if (vistas.has(String(pregunta))) throw new ErrorFormacion(400, "Enviaste dos respuestas para la misma pregunta.", "RESPUESTA_DUPLICADA");
      vistas.add(String(pregunta));

      // La respuesta debe ser una de las opciones (sin importar mayúsculas)
      const opcion = p.opciones.find((o) => o.toLowerCase() === String(respuesta).trim().toLowerCase());
      if (!opcion) {
        throw new ErrorFormacion(400, `La respuesta "${respuesta}" no es una opción válida de la pregunta "${p.pregunta}".`, "RESPUESTA_INVALIDA");
      }

      const esCorrecta = opcion === p.respuestaCorrecta;
      calificadas.push({ pregunta: p._id, respuesta: opcion, esCorrecta, puntosObtenidos: esCorrecta ? p.puntos ?? 1 : 0 });
    }

    const faltan = vigentes.filter((p) => !vistas.has(String(p._id)));
    if (faltan.length > 0) {
      // No se guarda nada: el intento sigue EN_CURSO y no se gasta.
      throw new ErrorFormacion(400, `Faltan ${faltan.length} pregunta(s) por responder.`, "FALTAN_RESPUESTAS", {
        preguntasSinResponder: faltan.map((p) => String(p._id)),
      });
    }

    // ---- calificar (el modelo calcula calificacion y resultado al FINALIZAR) ----
    intento.respuestas = calificadas;
    intento.puntajeObtenido = calificadas.reduce((t, r) => t + r.puntosObtenidos, 0);
    intento.puntajeTotal = vigentes.reduce((t, p) => t + (p.puntos ?? 1), 0);
    intento.puntajeMinimoAprobar = ev.puntajeMinimoAprobar;
    intento.estado = "FINALIZADO";
    intento.fechaFinalizacion = new Date();
    await intento.save();

    const r = await resumenIntentos(asignacion._id, ev._id, candidatoId);
    const mostrarCorrectas = r.restantes === 0; // solo cuando ya no le quedan intentos

    return res.json({
      message: intento.resultado === "APROBADO" ? "¡Aprobaste la evaluación!" : "Evaluación enviada.",
      data: {
        intento: intentoBreve(intento.toObject()),
        puntajeObtenido: intento.puntajeObtenido,
        puntajeTotal: intento.puntajeTotal,
        puntajeMinimoAprobar: intento.puntajeMinimoAprobar,
        calificacion: intento.calificacion,
        resultado: intento.resultado,
        intentosRestantes: r.restantes,
        notaOficial: r.oficial,
        detalle: vigentes.map((p) => {
          const c = calificadas.find((x) => mismo(x.pregunta, p._id));
          return {
            preguntaId: String(p._id),
            pregunta: p.pregunta,
            respuesta: c.respuesta,
            esCorrecta: c.esCorrecta,
            puntos: p.puntos ?? 1,
            puntosObtenidos: c.puntosObtenidos,
            ...(mostrarCorrectas && { respuestaCorrecta: p.respuestaCorrecta }),
          };
        }),
      },
    });
  } catch (error) {
    return responder(res, error, "No se pudieron guardar tus respuestas. Inténtalo nuevamente.");
  }
}
