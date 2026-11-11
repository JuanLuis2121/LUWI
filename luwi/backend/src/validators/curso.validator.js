import { z } from "zod";
import { NIVELES } from "../models/Curso.js";

// Acepta "basico" o "Básico" y lo guarda siempre como "básico".
const normalizarNivel = (valor) =>
  typeof valor === "string"
    ? valor.trim().toLowerCase().replace("basico", "básico")
    : valor;

const esEnlaceWeb = (valor) => {
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const cursoValidator = z.object({
  titulo: z
    .string({ error: "El título es obligatorio." })
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(120, "El título no puede superar los 120 caracteres."),

  descripcion: z
    .string({ error: "La descripción es obligatoria." })
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres.")
    .max(2000, "La descripción no puede superar los 2000 caracteres."),

  competencia: z
    .string({ error: "La competencia es obligatoria." })
    .trim()
    .min(2, "La competencia debe tener al menos 2 caracteres.")
    .max(60, "La competencia no puede superar los 60 caracteres."),

  nivel: z.preprocess(
    normalizarNivel,
    z.enum(NIVELES, { error: "El nivel debe ser básico, intermedio o avanzado." })
  ),

  // Los formularios suelen enviar números como texto ("12"): se convierten.
  duracionHoras: z.preprocess(
    (v) => (v === "" || v === null ? undefined : Number(v)),
    z
      .number({ error: "La duración es obligatoria y debe ser un número." })
      .min(0.5, "La duración debe ser de al menos 0.5 horas.")
      .max(500, "La duración no puede superar las 500 horas.")
  ),

  enlace: z
    .string({ error: "El enlace es obligatorio." })
    .trim()
    .max(500, "El enlace no puede superar los 500 caracteres.")
    .refine(esEnlaceWeb, "El enlace debe ser una URL válida que empiece con http:// o https://."),
});
