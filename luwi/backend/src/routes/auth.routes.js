import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import { validateSchema } from "../middlewares/validate.milddleware.js";
import {
  registerValidator,
  loginValidator,
} from "../validators/auth.validator.js";

const router = Router();

//Registrar usuario
router.post("/register", validateSchema(registerValidator), register);

//Loguear usuario
router.post("/login", validateSchema(loginValidator), login);

export default router;
