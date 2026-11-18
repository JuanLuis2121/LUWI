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

export async function marcarUnidadRevisada(asignacionId, cursoAsignadoId, unidadId) {
  const res = await request(
    `${BASE}/${asignacionId}/cursos/${cursoAsignadoId}/unidades/${unidadId}/revision`,
    { method: "POST", fallback: MENSAJE_ERROR_AVANCE }
  );
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
    if (habilitado) return rutaCurso(asignacion.id, habilitado.id);
  }

  return "/mi-formacion";
}
