import { request } from "./api";

// Catálogo de competencias (backend de Naomi): solo devuelve las ACTIVAS.
// Forma: { _id, nombre, descripcion, categoria: "TECNICA" | "BLANDA" | "OTRA" }
export async function getCompetencias() {
  const json = await request("/competencias", {
    fallback: "No se pudo cargar el catálogo de competencias",
  });
  return Array.isArray(json) ? json : json.data ?? [];
}

export const CATEGORIAS_COMPETENCIA = {
  TECNICA: "Técnicas",
  BLANDA: "Blandas",
  OTRA: "Otras",
};
