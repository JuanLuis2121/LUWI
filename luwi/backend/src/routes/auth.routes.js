import { Router } from "express";
import {
  register,
  login,
  me,
  logout,
} from "../controllers/auth.controller.js";
import { validateSchema } from "../middlewares/validate.milddleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  registerValidator,
  loginValidator,
} from "../validators/auth.validator.js";

const router = Router();

//Registrar usuario
router.post("/register", validateSchema(registerValidator), register);

//Loguear usuario
router.post("/login", validateSchema(loginValidator), login);

//Usuario de la sesión actual (para recuperar la sesión al recargar)
router.get("/me", requireAuth, me);

//Cerrar sesión
router.post("/logout", logout);

export default router;
