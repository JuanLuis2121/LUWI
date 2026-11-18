import { z } from "zod";
import mongoose from "mongoose";
import { NIVELES, TIPOS_UNIDAD } from "../models/Curso.js";

// Acepta "basico" o "Básico" y lo guarda siempre como "básico".
const normalizarNivel = (valor) =>
  typeof valor === "string"
    ? valor.trim().toLowerCase().replace("basico", "básico")
    : valor;

export const esEnlaceWeb = (valor) => {
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// "" o null se tratan como "no enviado"
const vacioAUndefined = (v) => (v === "" || v === null ? undefined : v);

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

  // Ids del catálogo de competencias (opcional mientras se migra desde "competencia").
  competencias: z
    .array(
      z.string().refine(
        (id) => mongoose.isObjectIdOrHexString(id),
        "Una de las competencias seleccionadas no es válida."
      ),
      { error: "Las competencias deben enviarse como una lista." }
    )
    .max(20, "No se pueden asignar más de 20 competencias a un curso.")
    .refine((ids) => new Set(ids).size === ids.length, "No repitas competencias.")
    .optional(),

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

  // Solo lo usa un ADMIN para crear un curso de una empresa concreta.
  // Para RR. HH. se ignora: su empresa se toma de la sesión.
  empresa: z.preprocess(
    vacioAUndefined,
    z
      .string()
      .refine((id) => mongoose.isObjectIdOrHexString(id), "La empresa seleccionada no es válida.")
      .optional()
  ),

  // Opcional desde la entrega 4 (el contenido va en las unidades).
  enlace: z.preprocess(
    vacioAUndefined,
    z
      .string()
      .trim()
      .max(500, "El enlace no puede superar los 500 caracteres.")
      .refine(esEnlaceWeb, "El enlace debe ser una URL válida que empiece con http:// o https://.")
      .optional()
  ),
});

// ---------- Unidades ----------

export const unidadValidator = z
  .object({
    titulo: z
      .string({ error: "El título de la unidad es obligatorio." })
      .trim()
      .min(3, "El título de la unidad debe tener al menos 3 caracteres.")
      .max(150, "El título de la unidad no puede superar los 150 caracteres."),

    tipo: z.preprocess(
      (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
      z.enum(TIPOS_UNIDAD, { error: "El tipo de unidad debe ser TEXTO, VIDEO o ENLACE." })
    ),

    contenido: z.preprocess(
      (v) => (v === null || v === undefined ? "" : v),
      z.string().trim().max(20000, "El contenido no puede superar los 20000 caracteres.")
    ),

    recursoUrl: z.preprocess(
      vacioAUndefined,
      z.string().trim().max(500, "La URL no puede superar los 500 caracteres.").optional()
    ),

    obligatoria: z.boolean({ error: "Indica si la unidad es obligatoria (true o false)." }).default(true),
  })
  .superRefine((u, ctx) => {
    if (u.tipo === "TEXTO" && u.contenido.length < 10) {
      ctx.addIssue({
        code: "custom",
        path: ["contenido"],
        message: "Una unidad de tipo TEXTO debe tener un contenido de al menos 10 caracteres.",
      });
    }
    if ((u.tipo === "VIDEO" || u.tipo === "ENLACE") && !(u.recursoUrl && esEnlaceWeb(u.recursoUrl))) {
      ctx.addIssue({
        code: "custom",
        path: ["recursoUrl"],
        message: `Una unidad de tipo ${u.tipo} debe tener una URL válida que empiece con http:// o https://.`,
      });
    }
  });

// Una unidad guardada es válida para publicar si cumple las mismas reglas.
export const unidadEsValida = (unidad) =>
  !unidad.retirada &&
  unidadValidator.safeParse({
    titulo: unidad.titulo,
    tipo: unidad.tipo,
    contenido: unidad.contenido,
    recursoUrl: unidad.recursoUrl,
    obligatoria: unidad.obligatoria,
  }).success;

export const moverUnidadValidator = z.object({
  direccion: z.enum(["subir", "bajar"], { error: "La dirección debe ser \"subir\" o \"bajar\"." }),
});
