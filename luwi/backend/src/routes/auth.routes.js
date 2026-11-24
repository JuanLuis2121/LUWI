import { Router } from "express";

import {
  login,
  logout,
  getSession,
  activarCuenta,
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";

import {
  loginValidator,
  activarCuentaValidator,
} from "../validators/auth.validator.js";

const router = Router();

// REGISTRAR USUARIO
/* router.post(
  "/register",
  requireAuth,
  validateSchema(registerValidator),
  register,
); */

// INICIAR SESIÓN
router.post("/login", validateSchema(loginValidator), login);

// ACTIVAR CUENTA: El enlace de invitación trae el token de activación.
router.post(
  "/activar-cuenta",
  validateSchema(activarCuentaValidator),
  activarCuenta,
);

// CONSULTAR SESIÓN: Cualquier usuario con una sesión válida puede consultar su sesión.
router.get("/me", requireAuth, getSession);

// CERRAR SESIÓN: Cualquier usuario con una sesión válida puede cerrarla.
router.post("/logout", requireAuth, logout);

export default router;
