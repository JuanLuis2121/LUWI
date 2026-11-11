import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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