import { z } from "zod";

export const registerValidator = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Usuario requerido")
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
});

export const loginValidator = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email requerido")
    .pipe(z.email("Email inválido")),

  password: z.string().min(1, "La contraseña es requerida"),
});
