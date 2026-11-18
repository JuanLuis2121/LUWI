import { request } from "./api";

export async function getProcesosFormacion() {
  const json = await request("/procesos-formacion", {
    fallback: "No se pudieron cargar los postulantes.",
  });
  return Array.isArray(json.data) ? json.data : [];
}
