const API_URL = import.meta.env.VITE_API_URL;

const getErrorMessage = (data, fallback) => {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;

  if (Array.isArray(data?.error) && data.error.length > 0) {
    const first = data.error[0];
    if (typeof first === "string") return first;
    if (typeof first?.message === "string") return first.message;
  }

  return fallback;
};

async function post(path, body, fallback) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallback));
  }

  return data;
}

export const registerUser = (payload) =>
  post("/auth/register", payload, "Error al registrar usuario");

// La API de Wala responde { message, user: { id, nombre, email, rol, empresa } },
// con rol en minúsculas ("admin" | "empresa" | "rrhh" | "postulante").
export async function loginUser(payload) {
  const data = await post("/auth/login", payload, "Error al iniciar sesión");
  return data.user;
}

// Usuario de la sesión actual (cookie). Devuelve null si no hay sesión.
export async function getSessionUser() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export const logoutUser = () =>
  post("/auth/logout", {}, "Error al cerrar sesión");