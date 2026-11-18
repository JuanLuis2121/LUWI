import { request } from "./api";

// Servicio del módulo de Cursos (backend de Marlon).
//
// Forma de un curso:
//   { _id, titulo, descripcion, competencia, competencias, nivel, duracionHoras, enlace,
//     estado, fechaPublicacion, totalUnidades, unidadesObligatorias,
//     rutas: [{ _id, nombre }], unidades: [...], createdAt, updatedAt }
//   nivel:  "básico" | "intermedio" | "avanzado"
//   estado: "BORRADOR" | "PUBLICADO" | "INACTIVO"   (los cursos nuevos nacen en BORRADOR)
//   enlace: opcional desde la entrega 4 (el contenido va en las unidades)
//   rutas:  rutas donde está el curso. Si rutas.length > 0 el backend NO deja eliminarlo.
//   unidades: solo viene en getCurso (en el listado viene totalUnidades).
//   alcance: "GLOBAL" (sin empresa, lo ven todas) | "EMPRESA" (solo esa empresa).
//            Si lo crea RR. HH. queda de su empresa automáticamente (no hay que enviarla).
//   editable: false si el usuario solo puede consultarlo (ej. RR. HH. viendo un curso global):
//             en ese caso conviene ocultar Editar, Publicar, Desactivar y Gestionar unidades.
//
// Rutas: solo aceptan cursos PUBLICADOS y globales o de la misma empresa del puesto.
//
// Forma de una unidad:
//   { _id, titulo, tipo, contenido, recursoUrl, obligatoria, orden }
//   tipo: "TEXTO" (requiere contenido) | "VIDEO" | "ENLACE" (requieren recursoUrl)
//
// Errores: cada función lanza un Error cuyo .message ya viene listo para
// mostrarse al usuario. error.status trae el código HTTP (ej. 409 = regla de negocio).

export const NIVELES = ["básico", "intermedio", "avanzado"];
export const ESTADOS_CURSO = ["BORRADOR", "PUBLICADO", "INACTIVO"];
export const TIPOS_UNIDAD = ["TEXTO", "VIDEO", "ENLACE"];

// ---------------- Cursos ----------------

// filtros opcionales: { buscar: "react", nivel: "básico", estado: "PUBLICADO" }
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

// datos: { titulo, descripcion, competencia, competencias?, nivel, duracionHoras, enlace? }
export async function crearCurso(datos) {
  const json = await request("/cursos", { method: "POST", body: datos, fallback: "No se pudo crear el curso" });
  return json.data;
}

export async function actualizarCurso(id, datos) {
  const json = await request(`/cursos/${id}`, { method: "PUT", body: datos, fallback: "No se pudo actualizar el curso" });
  return json.data;
}

// Exige al menos una unidad válida (si no, 409 con el motivo).
export async function publicarCurso(id) {
  const json = await request(`/cursos/${id}/publicar`, { method: "PATCH", fallback: "No se pudo publicar el curso" });
  return json.data;
}

export async function desactivarCurso(id) {
  const json = await request(`/cursos/${id}/desactivar`, { method: "PATCH", fallback: "No se pudo desactivar el curso" });
  return json.data;
}

export function eliminarCurso(id) {
  return request(`/cursos/${id}`, { method: "DELETE", fallback: "No se pudo eliminar el curso" });
}

// ---------------- Unidades ----------------
// Todas devuelven las unidades vigentes del curso ya ordenadas: { cursoId, estado, unidades }

export async function getUnidades(cursoId) {
  const json = await request(`/cursos/${cursoId}/unidades`, { fallback: "No se pudieron cargar las unidades" });
  return json.data;
}

// datos: { titulo, tipo, contenido?, recursoUrl?, obligatoria }
export async function crearUnidad(cursoId, datos) {
  const json = await request(`/cursos/${cursoId}/unidades`, { method: "POST", body: datos, fallback: "No se pudo agregar la unidad" });
  return json.data;
}

export async function actualizarUnidad(cursoId, unidadId, datos) {
  const json = await request(`/cursos/${cursoId}/unidades/${unidadId}`, { method: "PUT", body: datos, fallback: "No se pudo actualizar la unidad" });
  return json.data;
}

// direccion: "subir" | "bajar"
export async function moverUnidad(cursoId, unidadId, direccion) {
  const json = await request(`/cursos/${cursoId}/unidades/${unidadId}/mover`, { method: "PATCH", body: { direccion }, fallback: "No se pudo cambiar el orden" });
  return json.data;
}

// Retira la unidad (no la borra: se conserva el avance de quien ya la revisó).
export async function retirarUnidad(cursoId, unidadId) {
  const json = await request(`/cursos/${cursoId}/unidades/${unidadId}`, { method: "DELETE", fallback: "No se pudo retirar la unidad" });
  return json.data;
}
