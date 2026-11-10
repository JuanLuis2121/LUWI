// TODO (Marlon): reemplazar por GET /api/dashboard/resumen cuando exista el endpoint.
// Mientras tanto devuelve datos de ejemplo con la misma forma que usará el backend.
export async function getResumen() {
  return { empresas: 12, puestos: 34, cursos: 48, rutas: 9 };
}
