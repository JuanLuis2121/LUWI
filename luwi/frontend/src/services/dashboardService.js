import { request } from "./api";

// GET /api/dashboard/resumen?empresa=&puesto=&estado=
// Respuesta (entrega 5 de Marlon):
//   { empresas, puestos, cursos, rutas, recientes,
//     postulantes, procesos, cursosAsignados, progreso, evaluaciones, filtros }
export const getResumen = (filtros = {}) => {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return request(`/dashboard/resumen${params ? `?${params}` : ""}`, {
    fallback: "No se pudo cargar el resumen",
  });
};
