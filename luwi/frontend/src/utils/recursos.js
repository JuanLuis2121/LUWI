// Ayudas para mostrar el contenido de las unidades.

/** Devuelve la URL para incrustar un video de YouTube o Vimeo, o null si no se reconoce. */
export function urlIncrustable(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/").at(0);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") || (u.pathname.startsWith("/embed/") || u.pathname.startsWith("/shorts/") ? u.pathname.split("/").at(2) : null);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).find((p) => /^\d+$/.test(p));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Minutos estimados de lectura (200 palabras por minuto, mínimo 1). */
export function minutosLectura(texto) {
  const palabras = (texto ?? "").trim().split(/\s+/).filter(Boolean).length;
  return palabras ? Math.max(1, Math.round(palabras / 200)) : 0;
}

/** Notas personales por unidad, guardadas en este navegador. */
const claveNota = (asignacionId, unidadId) => `luwi-nota-${asignacionId}-${unidadId}`;

export function leerNota(asignacionId, unidadId) {
  try {
    return localStorage.getItem(claveNota(asignacionId, unidadId)) ?? "";
  } catch {
    return "";
  }
}

export function guardarNota(asignacionId, unidadId, texto) {
  try {
    if (texto.trim()) localStorage.setItem(claveNota(asignacionId, unidadId), texto);
    else localStorage.removeItem(claveNota(asignacionId, unidadId));
    return true;
  } catch {
    return false;
  }
}
