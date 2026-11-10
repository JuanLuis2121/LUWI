const API_URL = import.meta.env.VITE_API_URL;

// Backend de Juan: GET /api/rutas-aprendizaje  ->  { data: [ { _id, nombre, descripcion,
//   puesto: { ..., empresa }, cursos: [...], duracionTotalHoras } ] }
// Requiere las cookies de sesión (JWT), por eso credentials: "include".
export async function getRutas() {
  let response;
  try {
    response = await fetch(`${API_URL}/rutas-aprendizaje`, { credentials: "include" });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || "No se pudieron cargar las rutas");
  }
  return Array.isArray(json.data) ? json.data : [];
}
