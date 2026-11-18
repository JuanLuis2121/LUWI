import Candidato from "../models/Candidato.js";
import ProcesoFormacion from "../models/ProcesoFormacion.js";
import AsignacionRuta from "../models/AsignacionRuta.js";
import Curso from "../models/Curso.js";
import ProgresoUnidad from "../models/ProgresoUnidad.js";
import UltimaConsulta from "../models/UltimaConsulta.js";
// Se importan para que populate("empresa") y populate("puesto") funcionen
import "../models/Empresa.js";
import "../models/Puesto.js";

// Error "esperado" del módulo: el controller lo convierte en
// res.status(status).json({ message, codigo }).
export class FormacionError extends Error {
  constructor(status, codigo, message) {
    super(message);
    this.name = "FormacionError";
    this.status = status;
    this.codigo = codigo;
  }
}

export const MENSAJE_SUSPENDIDO =
  "Tu proceso de formación está suspendido. Contacta a Recursos Humanos.";
export const MENSAJE_BLOQUEADO =
  "Pendiente de habilitación por Recursos Humanos.";

const noEncontrado = (message = "No encontramos lo que buscas.") =>
  new FormacionError(404, "NO_ENCONTRADO", message);

const esIdValido = (id) =>
  typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);

const mismoId = (a, b) => a != null && b != null && String(a) === String(b);

const porcentaje = (parte, total) =>
  total > 0 ? Math.round((parte / total) * 100) : 0;

const esObligatoria = (unidad) => unidad.obligatoria !== false;

// ---------------------------------------------------------------------------
// Carga de datos
// ---------------------------------------------------------------------------

async function cargarCandidato(user) {
  if (user.candidato) {
    const candidato = await Candidato.findById(user.candidato).lean();
    if (candidato) return candidato;
  }
  return Candidato.findOne({ usuario: user._id }).lean();
}

// Candidato + proceso vigente (ACTIVO o SUSPENDIDO) más reciente
export async function cargarProceso(user) {
  const candidato = await cargarCandidato(user);
  if (!candidato) return { candidato: null, proceso: null };

  const proceso = await ProcesoFormacion.findOne({
    candidato: candidato._id,
    estado: { $in: ["ACTIVO", "SUSPENDIDO"] },
  })
    .sort({ createdAt: -1 })
    .populate("empresa", "nombre")
    .populate("puesto", "titulo")
    .lean();

  return { candidato, proceso };
}

// Map cursoAsignadoId -> unidades del Curso actual, ordenadas por "orden"
async function cargarUnidadesPorCurso(asignacion) {
  const cursos = await Curso.find({
    _id: { $in: asignacion.cursos.map((c) => c.curso) },
  })
    .select("unidades")
    .lean();

  const porCurso = new Map(
    cursos.map((curso) => [
      String(curso._id),
      [...(curso.unidades ?? [])].sort((a, b) => a.orden - b.orden),
    ])
  );

  return new Map(
    asignacion.cursos.map((c) => [
      String(c._id),
      porCurso.get(String(c.curso)) ?? [],
    ])
  );
}

// Ids (string) de las unidades revisadas en la asignación
async function cargarRevisadas(asignacionId) {
  const progresos = await ProgresoUnidad.find({ asignacion: asignacionId })
    .select("unidad")
    .lean();
  return new Set(progresos.map((p) => String(p.unidad)));
}

// ---------------------------------------------------------------------------
// Cálculo del avance
// ---------------------------------------------------------------------------

// Devuelve la última consulta solo si su curso sigue HABILITADO y la unidad existe
function validarUltimaConsulta(ultima, asignacion, unidadesPorCurso) {
  if (!ultima) return null;

  const curso = asignacion.cursos.find((c) =>
    mismoId(c._id, ultima.cursoAsignadoId)
  );
  if (!curso || curso.acceso !== "HABILITADO") return null;

  const unidades = unidadesPorCurso.get(String(curso._id)) ?? [];
  if (!unidades.some((u) => mismoId(u._id, ultima.unidad))) return null;

  return {
    cursoAsignadoId: String(curso._id),
    unidadId: String(ultima.unidad),
  };
}

function resumenCurso(cursoAsignado, unidades, revisadas, ultimaCursoId) {
  const obligatorias = unidades.filter(esObligatoria);
  const revisadasObligatorias = obligatorias.filter((u) =>
    revisadas.has(String(u._id))
  ).length;
  const algunaRevisada = unidades.some((u) => revisadas.has(String(u._id)));

  let estado;
  if (cursoAsignado.acceso !== "HABILITADO") estado = "BLOQUEADO";
  else if (
    obligatorias.length > 0 &&
    revisadasObligatorias === obligatorias.length
  )
    estado = "REVISADO";
  else if (algunaRevisada || mismoId(cursoAsignado._id, ultimaCursoId))
    estado = "EN_CURSO";
  else estado = "SIN_INICIAR";

  return {
    id: String(cursoAsignado._id),
    titulo: cursoAsignado.titulo,
    duracionHoras: cursoAsignado.duracionHoras,
    nivel: cursoAsignado.nivel ?? null,
    orden: cursoAsignado.orden,
    acceso: cursoAsignado.acceso,
    estado,
    totalUnidades: unidades.length,
    unidadesObligatorias: obligatorias.length,
    revisadasObligatorias,
    porcentaje: porcentaje(revisadasObligatorias, obligatorias.length),
  };
}

// Resumen de todos los cursos + porcentaje general de la ruta
function calcularAvance(asignacion, unidadesPorCurso, revisadas, ultimaValida) {
  const cursos = [...asignacion.cursos]
    .sort((a, b) => a.orden - b.orden)
    .map((c) =>
      resumenCurso(
        c,
        unidadesPorCurso.get(String(c._id)) ?? [],
        revisadas,
        ultimaValida?.cursoAsignadoId
      )
    );

  const totalObligatorias = cursos.reduce(
    (suma, c) => suma + c.unidadesObligatorias,
    0
  );
  const totalRevisadas = cursos.reduce(
    (suma, c) => suma + c.revisadasObligatorias,
    0
  );

  return {
    cursos,
    porcentajeGeneral: porcentaje(totalRevisadas, totalObligatorias),
  };
}

// ---------------------------------------------------------------------------
// GET /api/mi-formacion
// ---------------------------------------------------------------------------

export async function obtenerMiFormacion(user) {
  const { candidato, proceso } = await cargarProceso(user);

  const respuesta = {
    postulante: {
      nombre: candidato?.nombre ?? user.username,
      correo: candidato?.correo ?? user.email,
    },
    empresa: proceso?.empresa
      ? { id: String(proceso.empresa._id), nombre: proceso.empresa.nombre }
      : null,
    puesto: proceso?.puesto
      ? { id: String(proceso.puesto._id), titulo: proceso.puesto.titulo }
      : null,
    proceso: proceso ? { id: String(proceso._id), estado: proceso.estado } : null,
    asignacion: null,
  };

  if (!proceso) return respuesta;

  const asignacion = await AsignacionRuta.findOne({
    proceso: proceso._id,
    estado: "ACTIVA",
  }).lean();
  if (!asignacion) return respuesta;

  const [unidadesPorCurso, revisadas, ultima] = await Promise.all([
    cargarUnidadesPorCurso(asignacion),
    cargarRevisadas(asignacion._id),
    UltimaConsulta.findOne({ asignacion: asignacion._id }).lean(),
  ]);

  const ultimaValida = validarUltimaConsulta(
    ultima,
    asignacion,
    unidadesPorCurso
  );
  const { cursos, porcentajeGeneral } = calcularAvance(
    asignacion,
    unidadesPorCurso,
    revisadas,
    ultimaValida
  );
  const ultimaConsulta = proceso.estado === "SUSPENDIDO" ? null : ultimaValida;

  respuesta.asignacion = {
    id: String(asignacion._id),
    ruta: {
      nombre: asignacion.estructura?.nombre ?? "",
      descripcion: asignacion.estructura?.descripcion ?? "",
    },
    porcentaje: porcentajeGeneral,
    cursosHabilitados: cursos.filter((c) => c.acceso === "HABILITADO").length,
    totalCursos: cursos.length,
    tieneAvance: revisadas.size > 0 || ultimaConsulta !== null,
    cursos,
    ultimaConsulta,
  };

  return respuesta;
}

// ---------------------------------------------------------------------------
// Autorización común de los endpoints de un curso
// ---------------------------------------------------------------------------

async function autorizarCurso(user, asignacionId, cursoAsignadoId, unidadId) {
  if (
    !esIdValido(asignacionId) ||
    !esIdValido(String(cursoAsignadoId ?? "")) ||
    (unidadId !== undefined && !esIdValido(unidadId))
  ) {
    throw noEncontrado();
  }

  const { candidato, proceso } = await cargarProceso(user);
  if (!proceso) {
    throw new FormacionError(
      404,
      "SIN_PROCESO",
      "No tienes un proceso de formación vigente."
    );
  }

  if (proceso.estado === "SUSPENDIDO") {
    throw new FormacionError(403, "PROCESO_SUSPENDIDO", MENSAJE_SUSPENDIDO);
  }

  const asignacion = await AsignacionRuta.findOne({
    _id: asignacionId,
    proceso: proceso._id,
    estado: "ACTIVA",
  }).lean();
  if (!asignacion) throw noEncontrado("No encontramos esa ruta de formación.");

  const cursoAsignado = asignacion.cursos.find((c) =>
    mismoId(c._id, cursoAsignadoId)
  );
  if (!cursoAsignado) throw noEncontrado("No encontramos ese curso.");

  if (cursoAsignado.acceso !== "HABILITADO") {
    throw new FormacionError(403, "CURSO_BLOQUEADO", MENSAJE_BLOQUEADO);
  }

  const unidadesPorCurso = await cargarUnidadesPorCurso(asignacion);
  const unidades = unidadesPorCurso.get(String(cursoAsignado._id)) ?? [];

  let unidad = null;
  if (unidadId !== undefined) {
    unidad = unidades.find((u) => mismoId(u._id, unidadId));
    if (!unidad) throw noEncontrado("No encontramos esa unidad.");
  }

  return {
    candidato,
    proceso,
    asignacion,
    cursoAsignado,
    unidadesPorCurso,
    unidades,
    unidad,
  };
}

// Respuesta común de GET del curso y POST de revisión
async function detalleCurso(ctx) {
  const { asignacion, cursoAsignado, unidadesPorCurso, unidades } = ctx;

  const [revisadas, ultima] = await Promise.all([
    cargarRevisadas(asignacion._id),
    UltimaConsulta.findOne({ asignacion: asignacion._id }).lean(),
  ]);

  const ultimaValida = validarUltimaConsulta(
    ultima,
    asignacion,
    unidadesPorCurso
  );
  const { cursos, porcentajeGeneral } = calcularAvance(
    asignacion,
    unidadesPorCurso,
    revisadas,
    ultimaValida
  );

  return {
    asignacionId: String(asignacion._id),
    curso: cursos.find((c) => mismoId(c.id, cursoAsignado._id)),
    unidades: unidades.map((u) => ({
      id: String(u._id),
      titulo: u.titulo,
      contenido: u.contenido ?? "",
      recursoUrl: u.recursoUrl || null,
      obligatoria: esObligatoria(u),
      orden: u.orden,
      revisada: revisadas.has(String(u._id)),
    })),
    ultimaUnidadId: mismoId(ultimaValida?.cursoAsignadoId, cursoAsignado._id)
      ? ultimaValida.unidadId
      : null,
    porcentajeGeneral,
  };
}

// ---------------------------------------------------------------------------
// Endpoints de un curso
// ---------------------------------------------------------------------------

export async function obtenerCurso(user, asignacionId, cursoAsignadoId) {
  const ctx = await autorizarCurso(user, asignacionId, cursoAsignadoId);
  return detalleCurso(ctx);
}

// Idempotente: marcar dos veces la misma unidad no duplica el avance
export async function marcarUnidadRevisada(
  user,
  asignacionId,
  cursoAsignadoId,
  unidadId
) {
  const ctx = await autorizarCurso(
    user,
    asignacionId,
    cursoAsignadoId,
    unidadId
  );

  try {
    await ProgresoUnidad.updateOne(
      { asignacion: ctx.asignacion._id, unidad: ctx.unidad._id },
      {
        $setOnInsert: {
          proceso: ctx.proceso._id,
          cursoAsignadoId: ctx.cursoAsignado._id,
          postulante: ctx.candidato._id,
          fechaRevision: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (error) {
    // Dos clics simultáneos: el índice único ya tiene el registro
    if (error?.code !== 11000) throw error;
  }

  return detalleCurso(ctx);
}

// Guarda dónde se quedó el postulante. NO cuenta como unidad revisada.
export async function guardarUltimaConsulta(user, asignacionId, body = {}) {
  const { cursoAsignadoId, unidadId } = body ?? {};
  const ctx = await autorizarCurso(
    user,
    asignacionId,
    cursoAsignadoId,
    String(unidadId ?? "")
  );

  const datos = {
    postulante: ctx.candidato._id,
    cursoAsignadoId: ctx.cursoAsignado._id,
    unidad: ctx.unidad._id,
    fecha: new Date(),
  };

  try {
    await UltimaConsulta.findOneAndUpdate(
      { asignacion: ctx.asignacion._id },
      { $set: datos },
      { upsert: true, returnDocument: "after" }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    // Otra petición la creó al mismo tiempo: se actualiza la existente
    await UltimaConsulta.updateOne(
      { asignacion: ctx.asignacion._id },
      { $set: datos }
    );
  }

  return {
    cursoAsignadoId: String(ctx.cursoAsignado._id),
    unidadId: String(ctx.unidad._id),
  };
}
