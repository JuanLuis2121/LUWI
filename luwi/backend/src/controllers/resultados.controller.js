// Consulta de resultados de evaluaciones (entrega 5, parte D).
//   ADMIN: todo.
//   RRHH / ADMIN-EMPRESA: solo resultados de su empresa (el intento guarda "empresa").
//   POSTULANTE: solo los suyos.
// Nota oficial de cada evaluación = la calificación más alta entre sus intentos FINALIZADOS.
import Evaluacion from "../models/Evaluacion.js";
import IntentoEvaluacion, { MAX_INTENTOS } from "../models/IntentoEvaluacion.js";
import ProcesoFormacion from "../models/ProcesoFormacion.js";
import AsignacionRuta from "../models/AsignacionRuta.js";
import Candidato from "../models/Candidato.js";
import Curso from "../models/Curso.js";
import { esId, ErrorFormacion, responderError, perfilDeSesion } from "../services/formacion.service.js";

const mismo = (a, b) => a != null && b != null && String(a) === String(b);

// Alcance del usuario sobre los intentos.
async function alcance(req) {
  const perfil = await perfilDeSesion(req);
  if (perfil.role === "ADMIN") return { perfil, filtro: {} };
  if (perfil.role === "POSTULANTE") {
    const candidatoId =
      perfil.candidato ?? (await Candidato.findOne({ usuario: perfil._id }).select("_id").lean())?._id;
    if (!candidatoId) throw new ErrorFormacion(404, "No encontramos tu perfil de postulante.", "SIN_PERFIL");
    return { perfil, candidatoId, filtro: { postulante: candidatoId } };
  }
  // RRHH y ADMIN-EMPRESA
  const empresa = perfil.empresa?._id ?? perfil.empresa;
  if (!empresa) throw new ErrorFormacion(403, "Tu cuenta no tiene una empresa asociada.", "SIN_EMPRESA");
  return { perfil, empresa, filtro: { empresa } };
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

// Agrupa los intentos por (asignación + evaluación) y calcula la nota oficial.
async function agruparResultados(filtro) {
  const intentos = await IntentoEvaluacion.find(filtro)
    .populate("evaluacion", "titulo puntajeMinimoAprobar")
    .populate("curso", "titulo")
    .populate("postulante", "nombre correo")
    .sort({ numeroIntento: 1 })
    .lean();

  const grupos = new Map();
  for (const i of intentos) {
    const clave = `${i.asignacion}|${i.evaluacion?._id ?? i.evaluacion}`;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(i);
  }

  return [...grupos.values()]
    .map((lista) => {
      const primero = lista[0];
      const finalizados = lista.filter((i) => i.estado === "FINALIZADO");
      const mejor = finalizados.reduce((m, i) => (!m || i.calificacion > m.calificacion ? i : m), null);
      return {
        evaluacion: { id: String(primero.evaluacion?._id ?? primero.evaluacion), titulo: primero.evaluacion?.titulo ?? "(evaluación eliminada)" },
        curso: { id: String(primero.curso?._id ?? primero.curso), titulo: primero.curso?.titulo ?? "(curso eliminado)" },
        postulante: primero.postulante
          ? { id: String(primero.postulante._id), nombre: primero.postulante.nombre, correo: primero.postulante.correo }
          : null,
        procesoId: String(primero.proceso),
        asignacionId: String(primero.asignacion),
        calificacion: mejor ? mejor.calificacion : null,
        estado: mejor ? mejor.resultado : "EN_CURSO",
        fecha: mejor ? mejor.fechaFinalizacion : null,
        puntajeMinimoAprobar: mejor?.puntajeMinimoAprobar ?? primero.evaluacion?.puntajeMinimoAprobar ?? null,
        intentosUsados: lista.length,
        intentosRestantes: Math.max(0, MAX_INTENTOS - lista.length),
        intentos: lista.map(intentoBreve),
      };
    })
    .sort((a, b) => new Date(b.fecha ?? 0) - new Date(a.fecha ?? 0));
}

// Resumen numérico de una lista de resultados.
function resumir(resultados) {
  const calificados = resultados.filter((r) => typeof r.calificacion === "number");
  return {
    total: resultados.length,
    aprobados: resultados.filter((r) => r.estado === "APROBADO").length,
    reprobados: resultados.filter((r) => r.estado === "REPROBADO").length,
    enCurso: resultados.filter((r) => r.estado === "EN_CURSO").length,
    pendientes: resultados.filter((r) => r.estado === "PENDIENTE").length,
    promedio: calificados.length
      ? Math.round((calificados.reduce((t, r) => t + r.calificacion, 0) / calificados.length) * 100) / 100
      : null,
  };
}

// ======================================================================

// GET /api/resultados/mios   (POSTULANTE)
export async function misResultados(req, res) {
  try {
    const { perfil, filtro } = await alcance(req);
    if (perfil.role !== "POSTULANTE") throw new ErrorFormacion(403, "Esta consulta es solo para postulantes.", "SOLO_POSTULANTES");
    const data = await agruparResultados(filtro);
    return res.json({ resumen: resumir(data), data });
  } catch (error) {
    return responderError(res, error, "No se pudieron obtener tus resultados.");
  }
}

// GET /api/resultados/postulante/:postulanteId   (id del perfil Candidato)
export async function resultadosPorPostulante(req, res) {
  try {
    const { postulanteId } = req.params;
    if (!esId(postulanteId)) throw new ErrorFormacion(404, "El postulante no existe.", "NO_ENCONTRADO");
    const { perfil, filtro, candidatoId } = await alcance(req);
    if (perfil.role === "POSTULANTE" && !mismo(candidatoId, postulanteId)) {
      throw new ErrorFormacion(404, "El postulante no existe.", "NO_ENCONTRADO");
    }
    const data = await agruparResultados({ ...filtro, postulante: postulanteId });
    return res.json({ resumen: resumir(data), data });
  } catch (error) {
    return responderError(res, error, "No se pudieron obtener los resultados del postulante.");
  }
}

// GET /api/resultados/curso/:cursoId
export async function resultadosPorCurso(req, res) {
  try {
    const { cursoId } = req.params;
    if (!esId(cursoId)) throw new ErrorFormacion(404, "El curso no existe.", "NO_ENCONTRADO");
    const { filtro } = await alcance(req);
    if (!(await Curso.exists({ _id: cursoId }))) throw new ErrorFormacion(404, "El curso no existe.", "NO_ENCONTRADO");
    const data = await agruparResultados({ ...filtro, curso: cursoId });
    return res.json({ resumen: resumir(data), data });
  } catch (error) {
    return responderError(res, error, "No se pudieron obtener los resultados del curso.");
  }
}

// GET /api/resultados/proceso/:procesoId
// Además de las evaluaciones presentadas, lista como PENDIENTE las evaluaciones publicadas
// de los cursos asignados que todavía no ha presentado.
export async function resultadosPorProceso(req, res) {
  try {
    const { procesoId } = req.params;
    if (!esId(procesoId)) throw new ErrorFormacion(404, "El proceso no existe.", "NO_ENCONTRADO");
    const { perfil, empresa, candidatoId, filtro } = await alcance(req);

    const proceso = await ProcesoFormacion.findById(procesoId).populate("candidato", "nombre correo").lean();
    const permitido =
      proceso &&
      (perfil.role === "ADMIN" ||
        (empresa && mismo(empresa, proceso.empresa)) ||
        (candidatoId && mismo(candidatoId, proceso.candidato?._id ?? proceso.candidato)));
    if (!permitido) throw new ErrorFormacion(404, "El proceso no existe.", "NO_ENCONTRADO");

    const data = await agruparResultados({ ...filtro, proceso: procesoId });

    // Evaluaciones publicadas de los cursos de la asignación activa que aún no ha presentado
    const asignacion = await AsignacionRuta.findOne({ proceso: procesoId, estado: "ACTIVA" }).lean();
    if (asignacion) {
      const presentadas = new Set(data.filter((r) => r.asignacionId === String(asignacion._id)).map((r) => r.evaluacion.id));
      const evaluaciones = await Evaluacion.find({
        curso: { $in: asignacion.cursos.map((c) => c.curso) },
        estado: "PUBLICADA",
      })
        .select("titulo curso puntajeMinimoAprobar")
        .lean();
      for (const ev of evaluaciones) {
        if (presentadas.has(String(ev._id))) continue;
        const ca = asignacion.cursos.find((c) => mismo(c.curso, ev.curso));
        data.push({
          evaluacion: { id: String(ev._id), titulo: ev.titulo },
          curso: { id: String(ev.curso), titulo: ca?.titulo ?? "" },
          postulante: proceso.candidato
            ? { id: String(proceso.candidato._id), nombre: proceso.candidato.nombre, correo: proceso.candidato.correo }
            : null,
          procesoId: String(proceso._id),
          asignacionId: String(asignacion._id),
          calificacion: null,
          estado: "PENDIENTE",
          fecha: null,
          puntajeMinimoAprobar: ev.puntajeMinimoAprobar,
          intentosUsados: 0,
          intentosRestantes: MAX_INTENTOS,
          intentos: [],
        });
      }
    }

    return res.json({ resumen: resumir(data), data });
  } catch (error) {
    return responderError(res, error, "No se pudieron obtener los resultados del proceso.");
  }
}

// GET /api/resultados/intentos/:intentoId
// Detalle por pregunta. El administrador ve la respuesta correcta; el postulante
// solo cuando ya no le quedan intentos en esa evaluación.
export async function detalleIntento(req, res) {
  try {
    const { intentoId } = req.params;
    if (!esId(intentoId)) throw new ErrorFormacion(404, "El resultado no existe.", "NO_ENCONTRADO");
    const { perfil, filtro } = await alcance(req);

    const intento = await IntentoEvaluacion.findOne({ _id: intentoId, ...filtro })
      .populate("curso", "titulo")
      .populate("postulante", "nombre correo")
      .lean();
    if (!intento) throw new ErrorFormacion(404, "El resultado no existe.", "NO_ENCONTRADO");

    const ev = await Evaluacion.findById(intento.evaluacion).lean();
    const preguntas = new Map((ev?.preguntas ?? []).map((p) => [String(p._id), p]));

    let mostrarCorrectas = perfil.role !== "POSTULANTE";
    if (!mostrarCorrectas) {
      const usados = await IntentoEvaluacion.countDocuments({
        asignacion: intento.asignacion, evaluacion: intento.evaluacion, postulante: intento.postulante,
      });
      mostrarCorrectas = usados >= MAX_INTENTOS && intento.estado === "FINALIZADO";
    }

    return res.json({
      data: {
        ...intentoBreve(intento),
        evaluacion: { id: String(intento.evaluacion), titulo: ev?.titulo ?? "(evaluación eliminada)" },
        curso: { id: String(intento.curso?._id ?? intento.curso), titulo: intento.curso?.titulo ?? "" },
        postulante: intento.postulante
          ? { id: String(intento.postulante._id), nombre: intento.postulante.nombre, correo: intento.postulante.correo }
          : null,
        puntajeObtenido: intento.puntajeObtenido,
        puntajeTotal: intento.puntajeTotal,
        puntajeMinimoAprobar: intento.puntajeMinimoAprobar,
        respuestas: intento.respuestas.map((r) => {
          const p = preguntas.get(String(r.pregunta));
          return {
            preguntaId: String(r.pregunta),
            pregunta: p?.pregunta ?? "(pregunta no disponible)",
            respuesta: r.respuesta,
            esCorrecta: r.esCorrecta,
            puntosObtenidos: r.puntosObtenidos,
            puntos: p?.puntos ?? null,
            ...(mostrarCorrectas && p && { respuestaCorrecta: p.respuestaCorrecta }),
          };
        }),
      },
    });
  } catch (error) {
    return responderError(res, error, "No se pudo obtener el detalle del resultado.");
  }
}
