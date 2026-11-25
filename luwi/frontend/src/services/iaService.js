import { request } from "./api";

// Servicio centralizado de Recomendaciones de Formación con IA para Recursos Humanos (endpoint de Wallan).
// Regla de negocio: la IA SOLO devuelve sugerencias validadas con su explicación; nunca asigna rutas ni cursos automáticamente.

function normalizarLista(json) {
  const raw =
    json?.recomendaciones ??
    json?.data?.recomendaciones ??
    json?.cursos ??
    json?.data?.cursos ??
    (Array.isArray(json?.data) ? json.data : null) ??
    (Array.isArray(json) ? json : []);

  if (!Array.isArray(raw)) return [];

  return raw.map((item, idx) => ({
    cursoId: String(item.cursoId ?? item.curso?._id ?? item.curso?.id ?? item._id ?? item.id ?? `rec-${idx}`),
    titulo: item.titulo ?? item.curso?.titulo ?? item.nombre ?? "Curso recomendado",
    competencia: item.competencia ?? item.curso?.competencia ?? "",
    nivel: item.nivel ?? item.curso?.nivel ?? "",
    duracionHoras: item.duracionHoras ?? item.curso?.duracionHoras ?? null,
    explicacion:
      item.explicacion ??
      item.motivo ??
      item.razon ??
      item.justificacion ??
      item.descripcion ??
      "Recomendado según las competencias requeridas para el puesto.",
    prioridad: item.prioridad ?? null,
  }));
}

// Solicita recomendaciones de cursos para un puesto o un proceso de formación concreto.
export async function solicitarRecomendacionesIA({ puestoId, procesoId, candidatoId } = {}) {
  const body = {};
  if (puestoId) body.puestoId = puestoId;
  if (procesoId) body.procesoId = procesoId;
  if (candidatoId) body.candidatoId = candidatoId;

  const json = await request("/ia/recomendaciones", {
    method: "POST",
    body,
    fallback: "El servicio de IA no respondió. Intenta nuevamente en unos momentos.",
  });

  return {
    message: json?.message ?? "",
    resumen: json?.resumen ?? json?.data?.resumen ?? "",
    recomendaciones: normalizarLista(json),
  };
}
