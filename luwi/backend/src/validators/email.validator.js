import { z } from "zod";

export const invitarUsuarioValidator = z
  .object({
    correo: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  })
  .strict();
