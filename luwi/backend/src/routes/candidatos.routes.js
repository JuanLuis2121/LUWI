import { Router } from "express";
import {
  getCandidatos,
  getCandidato,
  createCandidato,
  updateCandidato,
  deleteCandidato,
} from "../controllers/candidato.Controller.js";

import { requireAuth, requireRol } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRol("RRHH")); // Solo RRHH puede acceder a estas rutas

router.get("/", getCandidatos);
router.get("/:id", getCandidato);
router.post("/", createCandidato);
router.put("/:id", updateCandidato);
router.delete("/:id", deleteCandidato);

export default router;
