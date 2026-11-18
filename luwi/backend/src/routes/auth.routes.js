import { Router } from "express";

import {
  register,
  login,
  logout,
  getSession,
  activarCuenta,
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";

import {
  registerValidator,
  loginValidator,
  activarCuentaValidator,
} from "../validators/auth.validator.js";

const router = Router();

// REGISTRAR USUARIO
router.post(
  "/register",
  requireAuth,
  validateSchema(registerValidator),
  register,
);

// INICIAR SESIÓN
router.post("/login", validateSchema(loginValidator), login);

// CONSULTAR SESIÓN
router.get("/me", requireAuth, getSession);

// CERRAR SESIÓN
router.post("/logout", logout);

// ACTIVAR CUENTA
router.post(
  "/activar-cuenta",
  validateSchema(activarCuentaValidator),
  activarCuenta,
);

export default router;
