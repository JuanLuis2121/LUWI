import { request } from "./api";

// Formación asignada a un postulante.
//   Asignación y accesos: endpoints de Naomi.
//   Columna Avance: progreso de Marlon.
// Cada función lanza un Error con .message listo para mostrar y .status con el código HTTP.
//
// Forma de la asignación (Naomi):
//   { _id, proceso, ruta, estructura: { nombre, descripcion }, duracionTotalHoras, estado,
//     cursos: [{ _id (= cursoAsignadoId), titulo, duracionHoras, nivel, competencia,
//                orden, acceso: "HABILITADO" | "BLOQUEADO", fechaCambioAcceso }] }

// Ruta asignada al proceso, o null si todavía no tiene (no es un error).
export async function getAsignacion(procesoId) {
  const json = await request(`/procesos-formacion/${procesoId}/asignacion`, {
    fallback: "No se pudo cargar la ruta asignada",
  });
  return json.asignacion ?? null;
}

// Proceso (postulante, empresa, puesto, estado) y avance por curso (Marlon).
// data: { proceso: { id, estado, postulante, empresa, puesto }, asignacion: null | {
//   id, ruta: { id, nombre }, porcentaje, cursosHabilitados, totalCursos,
//   cursos: [{ cursoAsignadoId, titulo, orden, duracionHoras, acceso, estado, porcentaje,
//              totalObligatorias, revisadasObligatorias }] } }
export async function getFormacionProceso(procesoId) {
  const json = await request(`/procesos-formacion/${procesoId}/progreso`, {
    fallback: "No se pudo cargar la formación del postulante",
  });
  return json.data;
}

// Asigna una ruta al proceso. Todos los cursos quedan BLOQUEADOS.
// Si ya tenía otra ruta sin avance, la reemplaza (la anterior queda de historial);
// si ya hay avance, el backend responde 409.
export async function asignarRuta(procesoId, rutaId) {
  const json = await request(`/procesos-formacion/${procesoId}/asignacion`, {
    method: "POST",
    body: { rutaId },
    fallback: "No se pudo asignar la ruta",
  });
  return json.asignacion;
}

// acceso: "HABILITADO" | "BLOQUEADO". Devuelve la asignación actualizada.
export async function cambiarAccesoCurso(asignacionId, cursoAsignadoId, acceso) {
  const json = await request(
    `/asignaciones/${asignacionId}/cursos/${cursoAsignadoId}/acceso`,
    { method: "PATCH", body: { acceso }, fallback: "No se pudo cambiar el acceso del curso" }
  );
  return json.asignacion;
}
