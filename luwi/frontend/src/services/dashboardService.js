import { request } from "./api";

// GET /api/dashboard/resumen
// Respuesta: { empresas, puestos, cursos, rutas, recientes: [{ id, tipo, nombre, fecha }] }
//   tipo: "empresa" | "puesto" | "curso" | "ruta"   fecha: ISO string
export const getResumen = () =>
  request("/dashboard/resumen", { fallback: "No se pudo cargar el resumen" });
