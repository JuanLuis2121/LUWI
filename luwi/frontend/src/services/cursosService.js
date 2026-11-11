import { request } from "./api";

// Servicio del módulo de Cursos (backend de Marlon) — listo para las pantallas de Deliani.
//
// Forma de un curso:
//   { _id, titulo, descripcion, competencia, nivel, duracionHoras, enlace,
//     rutas: [{ _id, nombre }], createdAt, updatedAt }
//   nivel: "básico" | "intermedio" | "avanzado"
//   rutas: rutas de aprendizaje donde está el curso. Si rutas.length > 0
//          el backend NO deja eliminarlo (conviene desactivar el botón).
//
// Errores: cada función lanza un Error cuyo .message ya viene listo para
// mostrarse al usuario (ej. "El enlace debe ser una URL válida...").

export const NIVELES = ["básico", "intermedio", "avanzado"];

// filtros opcionales: { buscar: "react", nivel: "básico" }
export async function getCursos(filtros = {}) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  const json = await request(`/cursos${params ? `?${params}` : ""}`, {
    fallback: "No se pudieron cargar los cursos",
  });
  return json.data ?? [];
}

export async function getCurso(id) {
  const json = await request(`/cursos/${id}`, { fallback: "No se pudo cargar el curso" });
  return json.data;
}

// datos: { titulo, descripcion, competencia, nivel, duracionHoras, enlace }
export async function crearCurso(datos) {
  const json = await request("/cursos", { method: "POST", body: datos, fallback: "No se pudo crear el curso" });
  return json.data;
}

export async function actualizarCurso(id, datos) {
  const json = await request(`/cursos/${id}`, { method: "PUT", body: datos, fallback: "No se pudo actualizar el curso" });
  return json.data;
}

export function eliminarCurso(id) {
  return request(`/cursos/${id}`, { method: "DELETE", fallback: "No se pudo eliminar el curso" });
}
