import { z } from "zod";
import Empresa from "../models/Empresa.js";

export const empresaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(120, "El nombre no puede superar los 120 caracteres."),

  sector: z
    .string()
    .trim()
    .max(100, "El sector no puede superar los 100 caracteres.")
    .optional(),

  correo: z
    .string()
    .trim()
    .email("Debes proporcionar un correo electrónico válido.")
    .transform((correo) => correo.toLowerCase()),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(128, "La contraseña no puede superar los 128 caracteres."),
});
