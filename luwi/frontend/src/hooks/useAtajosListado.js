import { useEffect } from "react";

// ¿El usuario está escribiendo en un campo? (no se le roban las teclas)
const escribiendo = (e) => ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target.isContentEditable;

/**
 * Atajos comunes de los listados:
 * - "/" enfoca el buscador (buscarRef apunta a un contenedor que tiene el <input>)
 * - "N" ejecuta onNuevo
 * - "Esc" ejecuta onEscape (ej. quitar selección)
 */
export default function useAtajosListado({ buscarRef, onNuevo, onEscape }) {
  useEffect(() => {
    const alTeclear = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape" && !escribiendo(e)) onEscape?.();
      if (escribiendo(e)) return;
      if (e.key === "/") {
        e.preventDefault();
        buscarRef?.current?.querySelector("input")?.focus();
      } else if (e.key.toLowerCase() === "n" && onNuevo) {
        e.preventDefault();
        onNuevo();
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [buscarRef, onNuevo, onEscape]);
}
