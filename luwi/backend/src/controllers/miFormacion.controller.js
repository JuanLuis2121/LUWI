import ProgresoUnidad from "../models/ProgresoUnidad.js";
import UltimaConsulta from "../models/UltimaConsulta.js";
import Curso from "../models/Curso.js";
import {
  esId,
  ErrorFormacion,
  responderError,
  contextoPostulante,
  verificarCursoDelPostulante,
  avanceDeAsignacion,
  ultimaConsultaValida,
} from "../services/formacion.service.js";

const mismo = (a, b) => a != null && b != null && String(a) === String(b);

// Unidades vigentes de un curso, ordenadas, marcando cuáles revisó el postulante.
function unidadesParaPostulante(unidades, revisadas) {
  return unidades
    .filter((u) => !u.retirada)
    .sort((a, b) => a.orden - b.orden)
    .map((u) => ({
      _id: String(u._id),
      titulo: u.titulo,
      tipo: u.tipo,
      contenido: u.contenido ?? "",
      recursoUrl: u.recursoUrl ?? null,
      obligatoria: u.obligatoria !== false,
      orden: u.orden,
      revisada: revisadas.has(String(u._id)),
    }));
}

// GET /api/mi-formacion
// Resumen para Inicio y Mi formación: datos del postulante, ruta, avance y cursos.
// De los cursos solo se envía el resumen (título, duración, acceso, avance), nunca el contenido.
export async function obtenerMiFormacion(req, res) {
  try {
    const { proceso, asignacion } = await contextoPostulante(req);

    const base = {
      usuario: { nombre: req.user.username, correo: req.user.email },
      empresa: proceso?.empresa ? { id: String(proceso.empresa._id), nombre: proceso.empresa.nombre } : null,
      puesto: proceso?.puesto ? { id: String(proceso.puesto._id), titulo: proceso.puesto.titulo } : null,
      proceso: proceso ? { id: String(proceso._id), estado: proceso.estado } : null,
      asignacion: null,
    };
    if (!asignacion) return res.json({ data: base });

    const { avance, unidadesPorCurso, revisadas } = await avanceDeAsignacion(asignacion);
    const ultima = proceso.estado === "SUSPENDIDO" ? null : await ultimaConsultaValida(asignacion, unidadesPorCurso);
    const porId = new Map(asignacion.cursos.map((c) => [String(c._id), c]));

    base.asignacion = {
      id: String(asignacion._id),
      ruta: { nombre: asignacion.estructura?.nombre, descripcion: asignacion.estructura?.descripcion ?? "" },
      porcentaje: avance.porcentajeGeneral,
      cursosHabilitados: avance.cursosHabilitados,
      totalCursos: avance.totalCursos,
      // Para decidir entre "Comenzar formación" y "Continuar formación"
      tieneAvance: revisadas.size > 0 || ultima !== null,
      ultimaConsulta: ultima,
      cursos: avance.cursos.map((c) => {
        const ca = porId.get(c.cursoAsignadoId);
        return {
          cursoAsignadoId: c.cursoAsignadoId,
          titulo: ca.titulo,
          duracionHoras: ca.duracionHoras,
          nivel: ca.nivel ?? null,
          orden: ca.orden,
          acceso: ca.acceso,
          estado: c.estado,
          porcentaje: c.porcentaje,
          totalObligatorias: c.totalObligatorias,
          revisadasObligatorias: c.revisadasObligatorias,
          totalUnidades: (unidadesPorCurso.get(c.cursoId) ?? []).filter((u) => !u.retirada).length,
        };
      }),
    };
    return res.json({ data: base });
  } catch (error) {
    return responderError(res, error, "No se pudo obtener tu formación.");
  }
}

// GET /api/mi-formacion/:asignacionId/cursos/:cursoAsignadoId
// Contenido de un curso HABILITADO. Si está bloqueado responde 403 CURSO_BLOQUEADO con solo el título.
// Consultar NO marca nada como revisado.
export async function obtenerCursoAsignado(req, res) {
  try {
    const { asignacion, cursoAsignado, proceso } = await verificarCursoDelPostulante(req);
    const { avance, unidadesPorCurso, revisadas } = await avanceDeAsignacion(asignacion);

    const unidades = unidadesParaPostulante(unidadesPorCurso.get(String(cursoAsignado.curso)) ?? [], revisadas);
    const resumen = avance.cursos.find((c) => c.cursoAsignadoId === String(cursoAsignado._id));
    const ultima = proceso.estado === "SUSPENDIDO" ? null : await ultimaConsultaValida(asignacion, unidadesPorCurso);

    return res.json({
      data: {
        asignacionId: String(asignacion._id),
        curso: {
          cursoAsignadoId: String(cursoAsignado._id),
          titulo: cursoAsignado.titulo,
          duracionHoras: cursoAsignado.duracionHoras,
          nivel: cursoAsignado.nivel ?? null,
          orden: cursoAsignado.orden,
          acceso: cursoAsignado.acceso,
          estado: resumen.estado,
          porcentaje: resumen.porcentaje,
          totalObligatorias: resumen.totalObligatorias,
          revisadasObligatorias: resumen.revisadasObligatorias,
        },
        unidades,
        // Unidad donde se quedó en ESTE curso (para abrirla al entrar)
        ultimaUnidadId: ultima && ultima.cursoAsignadoId === String(cursoAsignado._id) ? ultima.unidadId : null,
        porcentajeGeneral: avance.porcentajeGeneral,
      },
    });
  } catch (error) {
    return responderError(res, error, "No se pudo obtener el curso.");
  }
}

// Busca en qué curso de la asignación está una unidad (la URL de revisión no trae el curso).
async function ubicarUnidad(asignacion, unidadId) {
  const cursos = await Curso.find({ _id: { $in: asignacion.cursos.map((c) => c.curso) } })
    .select("unidades")
    .lean();
  for (const curso of cursos) {
    const unidad = (curso.unidades ?? []).find((u) => mismo(u._id, unidadId) && !u.retirada);
    if (unidad) {
      const cursoAsignado = asignacion.cursos.find((c) => mismo(c.curso, curso._id));
      return { unidad, cursoAsignado };
    }
  }
  return null;
}

// PUT /api/mi-formacion/:asignacionId/unidades/:unidadId/revision
// Marca la unidad como revisada UNA sola vez (repetir no aumenta el porcentaje)
// y devuelve el avance actualizado.
export async function marcarRevisada(req, res) {
  try {
    const { asignacionId, unidadId } = req.params;
    if (!esId(asignacionId) || !esId(unidadId)) {
      throw new ErrorFormacion(404, "No encontramos esa unidad en tu formación.", "NO_ENCONTRADO");
    }

    const { proceso, asignacion, candidatoId } = await contextoPostulante(req);
    if (!proceso) throw new ErrorFormacion(404, "No tienes un proceso de formación vigente.", "SIN_PROCESO");
    if (!asignacion || !mismo(asignacion._id, asignacionId)) {
      throw new ErrorFormacion(404, "No encontramos esa unidad en tu formación.", "NO_ENCONTRADO");
    }
    if (proceso.estado === "SUSPENDIDO") {
      throw new ErrorFormacion(403, "Tu proceso de formación está suspendido. Contacta a Recursos Humanos.", "PROCESO_SUSPENDIDO");
    }

    const ubicada = await ubicarUnidad(asignacion, unidadId);
    if (!ubicada) throw new ErrorFormacion(404, "No encontramos esa unidad en tu formación.", "NO_ENCONTRADO");
    if (ubicada.cursoAsignado.acceso !== "HABILITADO") {
      throw new ErrorFormacion(403, "Pendiente de habilitación por Recursos Humanos.", "CURSO_BLOQUEADO");
    }

    // upsert + $setOnInsert: si ya existía, no cambia nada (ni la fecha de la primera revisión).
    const r = await ProgresoUnidad.updateOne(
      { asignacion: asignacion._id, unidad: ubicada.unidad._id },
      {
        $setOnInsert: {
          asignacion: asignacion._id,
          proceso: proceso._id,
          cursoAsignadoId: ubicada.cursoAsignado._id,
          unidad: ubicada.unidad._id,
          postulante: candidatoId,
          fechaRevision: new Date(),
        },
      },
      { upsert: true }
    );

    const { avance } = await avanceDeAsignacion(asignacion);
    const curso = avance.cursos.find((c) => c.cursoAsignadoId === String(ubicada.cursoAsignado._id));
    return res.json({
      message: r.upsertedCount ? "Unidad marcada como revisada." : "La unidad ya estaba revisada.",
      data: {
        unidadId: String(ubicada.unidad._id),
        nuevaRevision: r.upsertedCount === 1,
        curso,
        porcentajeGeneral: avance.porcentajeGeneral,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      // Dos solicitudes a la vez: la otra ya la registró. Se responde el avance igual.
      return res.status(409).json({ message: "La unidad ya estaba revisada. Vuelve a cargar tu avance." });
    }
    return responderError(res, error, "No pudimos guardar tu avance. Inténtalo nuevamente.");
  }
}

// PUT /api/mi-formacion/:asignacionId/ultima-consulta   body: { cursoAsignadoId, unidadId }
// Guarda en qué unidad se quedó el postulante ("Continuar formación"). NO cuenta como revisada.
export async function guardarUltimaConsulta(req, res) {
  try {
    const { cursoAsignadoId, unidadId } = req.body ?? {};
    req.params.cursoAsignadoId = typeof cursoAsignadoId === "string" ? cursoAsignadoId : "";
    if (!esId(unidadId)) throw new ErrorFormacion(400, "Indica una unidad válida.", "DATOS_INVALIDOS");

    const { asignacion, cursoAsignado, candidatoId } = await verificarCursoDelPostulante(req);

    const curso = await Curso.findById(cursoAsignado.curso).select("unidades").lean();
    const unidad = (curso?.unidades ?? []).find((u) => mismo(u._id, unidadId) && !u.retirada);
    if (!unidad) throw new ErrorFormacion(404, "No encontramos esa unidad en el curso.", "NO_ENCONTRADO");

    await UltimaConsulta.findOneAndUpdate(
      { asignacion: asignacion._id },
      { postulante: candidatoId, cursoAsignadoId: cursoAsignado._id, unidad: unidad._id, fecha: new Date() },
      { upsert: true, runValidators: true }
    );

    return res.json({ data: { cursoAsignadoId: String(cursoAsignado._id), unidadId: String(unidad._id) } });
  } catch (error) {
    return responderError(res, error, "No se pudo guardar tu posición.");
  }
}
