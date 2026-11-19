import { z } from "zod";
import mongoose from "mongoose";

export const puestoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(120, "El título no puede superar los 120 caracteres."),

  empresa: z
    .string()
    .refine(
      (id) => mongoose.isObjectIdOrHexString(id),
      "Debes seleccionar una empresa válida.",
    ),

  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria.")
    .max(2000, "La descripción no puede superar los 2000 caracteres."),

  requisitos: z
    .string()
    .trim()
    .min(1, "Los requisitos son obligatorios.")
    .max(2000, "Los requisitos no pueden superar los 2000 caracteres."),
});
