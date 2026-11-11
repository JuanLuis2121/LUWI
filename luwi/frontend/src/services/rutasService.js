import axios from "axios";

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

// Cliente Axios (usado por rutasService). La sesión funciona con cookies.
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const errMsg = (err, fallback) => {
  const d = err?.response?.data;
  if (typeof d?.message === "string") return d.message;
  if (typeof d?.error === "string") return d.error;
  if (Array.isArray(d?.error) && d.error[0]) return d.error[0].message ?? String(d.error[0]);
  if (!err?.response) return "No se pudo conectar con el servidor";
  return fallback;
};