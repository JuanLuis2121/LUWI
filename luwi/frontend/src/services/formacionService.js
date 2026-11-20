import { request } from "./api";

// Formación del postulante que inició sesión (/api/mi-formacion).
// El backend responde { data }; aquí se devuelve directamente data.

export const MENSAJE_ERROR_AVANCE =
  "No pudimos guardar tu avance. Inténtalo nuevamente.";

const BASE = "/mi-formacion";

export async function getMiFormacion() {
  const res = await request(BASE, {
    fallback: "No pudimos cargar tu formación.",
  });
  return res.data;
}

export async function getCursoAsignado(asignacionId, cursoAsignadoId) {
  const res = await request(
    `${BASE}/${asignacionId}/cursos/${cursoAsignadoId}`,
    { fallback: "No pudimos cargar el curso." }
  );
  return res.data;
}

// API de Marlon: PUT /mi-formacion/:asignacionId/unidades/:unidadId/revision
// Devuelve { unidadId, nuevaRevision, curso, porcentajeGeneral }, donde "curso" es solo el
// avance del curso (cursoAsignadoId, estado, totalObligatorias, revisadasObligatorias, porcentaje).
// Marcar de nuevo una unidad revisada responde 200 con nuevaRevision: false; si llegan dos
// marcas a la vez, la segunda responde 409 ("La unidad ya estaba revisada").
export async function marcarUnidadRevisada(asignacionId, unidadId) {
  const res = await request(`${BASE}/${asignacionId}/unidades/${unidadId}/revision`, {
    method: "PUT",
    fallback: MENSAJE_ERROR_AVANCE,
  });
  return res.data;
}

export async function guardarUltimaConsulta(asignacionId, { cursoAsignadoId, unidadId }) {
  const res = await request(`${BASE}/${asignacionId}/ultima-consulta`, {
    method: "PUT",
    body: { cursoAsignadoId, unidadId },
    fallback: MENSAJE_ERROR_AVANCE,
  });
  return res.data;
}

const rutaCurso = (asignacionId, cursoAsignadoId) =>
  `/mi-formacion/${asignacionId}/cursos/${cursoAsignadoId}`;

/**
 * A dónde lleva el botón "Comenzar / Continuar formación":
 * - si hay última consulta, al curso de esa consulta;
 * - si no hay avance y existe un curso habilitado, al primero habilitado;
 * - en cualquier otro caso, a /mi-formacion.
 */
export function destinoFormacion(asignacion) {
  if (!asignacion) return "/mi-formacion";

  if (asignacion.ultimaConsulta) {
    return rutaCurso(asignacion.id, asignacion.ultimaConsulta.cursoAsignadoId);
  }

  if (!asignacion.tieneAvance) {
    const habilitado = asignacion.cursos?.find((c) => c.acceso === "HABILITADO");
    if (habilitado) return rutaCurso(asignacion.id, habilitado.cursoAsignadoId);
  }

  return "/mi-formacion";
}
