import { Router } from "express";
import { generarPlan } from "../controllers/ia.controller.js";

const router = Router();

// Generar plan de capacitación personalizado
router.post("/generar-plan", generarPlan);

export default router;
