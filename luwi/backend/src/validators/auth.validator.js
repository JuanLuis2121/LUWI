import { z } from "zod";

/* export const registerValidator = z.object({
  username: z
    .string()
    .trim()
    .min(6, "El usuario debe tener mínimo 6 caracteres")
    .max(20, "El usuario no puede superar los 20 caracteres"),

  email: z
    .string()
    .trim()
    .min(1, "Email requerido")
    .pipe(z.email("Email inválido")),

  password: z
    .string()
    .min(8, "La contraseña debe tener mínimo 8 caracteres")
    .max(64, "La contraseña no puede superar los 64 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),

  empresa: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "ID de empresa inválido")
    .optional(),
}); */

export const loginValidator = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email requerido")
    .pipe(z.email("Email inválido")),

  password: z.string().min(1, "La contraseña es requerida"),
});

export const activarCuentaValidator = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Token de activación inválido."),

  password: z
    .string()
    .min(8, "La contraseña debe tener mínimo 8 caracteres.")
    .max(64, "La contraseña no puede superar los 64 caracteres.")
    .regex(/[A-Z]/, "Debe contener una mayúscula.")
    .regex(/[a-z]/, "Debe contener una minúscula.")
    .regex(/[0-9]/, "Debe contener un número."),

  nombreCompleto: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre completo.")
    .max(120, "El nombre no puede superar los 120 caracteres.")
    .optional(),

  telefono: z
    .string()
    .trim()
    .min(1, "Escribe tu teléfono de contacto.")
    .max(30, "El teléfono no puede superar los 30 caracteres.")
    .optional(),
});

export const ROLES_ACTIVABLES = ["ADMIN-EMPRESA", "RRHH", "POSTULANTE"];

export const errorActivacion = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};
