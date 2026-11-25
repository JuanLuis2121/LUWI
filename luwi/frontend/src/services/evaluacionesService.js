import { request } from "./api";

// Servicio centralizado del módulo de Evaluaciones y Preguntas (endpoints de Marlon).

export const ESTADOS_EVALUACION = ["BORRADOR", "PUBLICADA", "INACTIVA"];
export const TIPOS_PREGUNTA = {
  SELECCION_MULTIPLE: "SELECCION_MULTIPLE",
  VERDADERO_FALSO: "VERDADERO_FALSO",
};

// ---------------- Evaluaciones ----------------

// filtros opcionales: { curso, estado }
export async function getEvaluaciones(filtros = {}) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  const json = await request(`/evaluaciones${params ? `?${params}` : ""}`, {
    fallback: "No se pudieron cargar las evaluaciones",
  });
  return json.data ?? [];
}

export async function getEvaluacion(id) {
  const json = await request(`/evaluaciones/${id}`, {
    fallback: "No se pudo cargar la evaluación",
  });
  return json.data;
}

// datos: { curso, titulo, descripcion?, puntajeMinimoAprobar? }
export async function crearEvaluacion(datos) {
  const json = await request("/evaluaciones", {
    method: "POST",
    body: datos,
    fallback: "No se pudo crear la evaluación",
  });
  return json.data;
}

// datos: { titulo, descripcion?, puntajeMinimoAprobar? }
export async function actualizarEvaluacion(id, datos) {
  const json = await request(`/evaluaciones/${id}`, {
    method: "PUT",
    body: datos,
    fallback: "No se pudo actualizar la evaluación",
  });
  return json.data;
}

export async function publicarEvaluacion(id) {
  const json = await request(`/evaluaciones/${id}/publicar`, {
    method: "PATCH",
    fallback: "No se pudo publicar la evaluación",
  });
  return json.data;
}

export async function desactivarEvaluacion(id) {
  const json = await request(`/evaluaciones/${id}/desactivar`, {
    method: "PATCH",
    fallback: "No se pudo desactivar la evaluación",
  });
  return json.data;
}

// ---------------- Preguntas ----------------

export async function getPreguntas(evaluacionId) {
  const json = await request(`/evaluaciones/${evaluacionId}/preguntas`, {
    fallback: "No se pudieron cargar las preguntas",
  });
  return json.data;
}

// datos: { pregunta, tipo, opciones?, respuestaCorrecta, puntos }
export async function crearPregunta(evaluacionId, datos) {
  const json = await request(`/evaluaciones/${evaluacionId}/preguntas`, {
    method: "POST",
    body: datos,
    fallback: "No se pudo agregar la pregunta",
  });
  return json.data;
}

export async function actualizarPregunta(evaluacionId, preguntaId, datos) {
  const json = await request(`/evaluaciones/${evaluacionId}/preguntas/${preguntaId}`, {
    method: "PUT",
    body: datos,
    fallback: "No se pudo actualizar la pregunta",
  });
  return json.data;
}

export async function retirarPregunta(evaluacionId, preguntaId) {
  const json = await request(`/evaluaciones/${evaluacionId}/preguntas/${preguntaId}`, {
    method: "DELETE",
    fallback: "No se pudo retirar la pregunta",
  });
  return json.data;
}
