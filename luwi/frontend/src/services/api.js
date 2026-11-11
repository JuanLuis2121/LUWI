// Cliente común para hablar con el backend de LUWI.
// Envía las cookies de sesión (JWT) y convierte los errores del servidor en Error con mensaje legible.
const API_URL = import.meta.env.VITE_API_URL;

const mensajeDeError = (data, fallback) => {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  return fallback;
};

export async function request(path, { method = "GET", body, fallback = "Ocurrió un error" } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(mensajeDeError(data, fallback));
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
