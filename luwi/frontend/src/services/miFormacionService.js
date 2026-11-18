import { request } from "./api";

export async function getProcesosFormacion() {
  const json = await request("/procesos-formacion", { fallback: "No se pudieron cargar los postulantes." });
  return Array.isArray(json.data) ? json.data : [];
}

export async function getMiFormacion() {
  const json = await request("/mi-formacion", { fallback: "No se pudo cargar tu formación." });
  return json.data;
}

export async function getCursoFormacion(asignacionId, cursoAsignadoId) {
  const json = await request(`/mi-formacion/${asignacionId}/cursos/${cursoAsignadoId}`, {
    fallback: "No se pudo cargar el curso.",
  });
  return json.data;
}

export async function marcarUnidadRevisada(asignacionId, unidadId) {
  const json = await request(`/mi-formacion/${asignacionId}/unidades/${unidadId}/revision`, {
    method: "PUT",
    fallback: "No se pudo guardar el avance de la unidad.",
  });
  return json.data;
}

export async function guardarUltimaConsulta(asignacionId, cursoAsignadoId, unidadId) {
  const json = await request(`/mi-formacion/${asignacionId}/ultima-consulta`, {
    method: "PUT",
    body: { cursoAsignadoId, unidadId },
    fallback: "No se pudo guardar tu última unidad consultada.",
  });
  return json.data;
}

export async function getProgresoProceso(procesoId) {
  const json = await request(`/procesos-formacion/${procesoId}/progreso`, {
    fallback: "No se pudo cargar el progreso del proceso.",
  });
  return json.data;
}
