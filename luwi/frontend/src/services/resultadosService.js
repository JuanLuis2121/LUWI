import { request } from "./api";

// Servicio centralizado de consulta de Resultados de evaluaciones (endpoints de Marlon).

export async function getResultadosPorProceso(procesoId) {
  const json = await request(`/resultados/proceso/${procesoId}`, {
    fallback: "No se pudieron cargar los resultados del proceso",
  });
  return {
    resumen: json.resumen ?? null,
    data: json.data ?? [],
  };
}

export async function getResultadosPorPostulante(postulanteId) {
  const json = await request(`/resultados/postulante/${postulanteId}`, {
    fallback: "No se pudieron cargar los resultados del postulante",
  });
  return {
    resumen: json.resumen ?? null,
    data: json.data ?? [],
  };
}

export async function getResultadosPorCurso(cursoId) {
  const json = await request(`/resultados/curso/${cursoId}`, {
    fallback: "No se pudieron cargar los resultados del curso",
  });
  return {
    resumen: json.resumen ?? null,
    data: json.data ?? [],
  };
}

export async function getDetalleIntento(intentoId) {
  const json = await request(`/resultados/intentos/${intentoId}`, {
    fallback: "No se pudo cargar el detalle del resultado",
  });
  return json.data;
}
