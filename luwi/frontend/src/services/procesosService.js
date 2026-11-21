import { request } from "./api";

// Pipeline de postulantes y procesos de formación.
//
// Forma de cada proceso:
//   { id, estado: "ACTIVO" | "SUSPENDIDO" | "FINALIZADO", etapa: "POR_ASIGNAR" | "EN_FORMACION" | "LISTO",
//     fechaInicio, fechaSuspension, fechaFinalizacion, actualizadoEn,
//     postulante: { id, nombre, correo, telefono, habilidades, puestosAplicados: [{ id, titulo }],
//                   cuenta: "PENDIENTE" | "ACTIVA" | "DESACTIVADA" | "SIN_CUENTA" },
//     puesto: { id, titulo }, empresa: { id, nombre },
//     asignacion: null | { id, ruta: { id, nombre }, porcentaje, cursosHabilitados, totalCursos, duracionHoras } }

export async function getPipeline() {
  const json = await request("/procesos-formacion", {
    fallback: "No se pudo cargar el pipeline de postulantes",
  });
  return {
    procesos: json.data?.procesos ?? [],
    candidatosSinProceso: json.data?.candidatosSinProceso ?? [],
  };
}

export async function iniciarProceso(candidatoId, puestoId) {
  const json = await request("/procesos-formacion", {
    method: "POST",
    body: { candidatoId, puestoId },
    fallback: "No se pudo iniciar el proceso",
  });
  return json.data;
}

// estado: "ACTIVO" | "SUSPENDIDO" | "FINALIZADO". Devuelve el proceso actualizado.
export async function cambiarEstadoProceso(procesoId, estado) {
  const json = await request(`/procesos-formacion/${procesoId}/estado`, {
    method: "PATCH",
    body: { estado },
    fallback: "No se pudo cambiar el estado del proceso",
  });
  return json.data;
}

// Alta de postulante (solo RR. HH.). El backend crea la cuenta y envía la invitación por correo.
export async function crearPostulante({ nombre, correo, telefono, habilidades, puestosAplicados }) {
  const json = await request("/candidatos", {
    method: "POST",
    body: { nombre, correo, telefono, habilidades, puestosAplicados },
    fallback: "No se pudo registrar el postulante",
  });
  return { candidato: json.candidato, correoEnviado: json.correoEnviado !== false, mensaje: json.message };
}
