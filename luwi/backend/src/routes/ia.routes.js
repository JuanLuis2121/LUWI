import { Router } from "express";
import { generarPlan } from "../controllers/ia.controller.js";
import { requireAuth, requireRol } from "../middlewares/auth.middleware.js";

const router = Router();

// Generar plan de capacitación personalizado
router.post(
  "/generar-plan",
  requireAuth,
  requireRol("POSTULANTE"),
  generarPlan,
);

export default router;
