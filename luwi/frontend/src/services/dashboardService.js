// TODO (Marlon): reemplazar por GET /api/dashboard/resumen cuando exista el endpoint.
// Los datos de ejemplo tienen la misma forma que usará el backend:
//   { empresas, puestos, cursos, rutas, recientes: [{ id, tipo, nombre, fecha }] }
//   tipo: "empresa" | "puesto" | "curso" | "ruta"   fecha: ISO string
const hace = (min) => new Date(Date.now() - min * 60000).toISOString();

export async function getResumen() {
  return {
    empresas: 12,
    puestos: 34,
    cursos: 48,
    rutas: 9,
    recientes: [
      { id: 1, tipo: "curso", nombre: "React desde cero", fecha: hace(25) },
      { id: 2, tipo: "puesto", nombre: "Desarrollador Frontend", fecha: hace(95) },
      { id: 3, tipo: "empresa", nombre: "Tecnova S.R.L.", fecha: hace(60 * 5) },
      { id: 4, tipo: "ruta", nombre: "Analista de Datos", fecha: hace(60 * 26) },
      { id: 5, tipo: "curso", nombre: "SQL para principiantes", fecha: hace(60 * 50) },
    ],
  };
}
