import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { obtenerResumen } from "../controllers/dashboard.resumen.controller.js";

const router = Router();

router.use(requireAuth);

// GET /api/dashboard/resumen - Cantidades de cada módulo y últimos registros
router.get("/resumen", obtenerResumen);

export default router;
