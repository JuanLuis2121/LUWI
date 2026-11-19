import { Router } from "express";
import {
  getCandidatos,
  getCandidato,
  createCandidato,
  updateCandidato,
  deleteCandidato,
} from "../controllers/candidato.Controller.js";

import { requireAuth, requireRRHH } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRRHH);

router.get("/", getCandidatos);
router.get("/:id", getCandidato);
router.post("/", createCandidato);
router.put("/:id", updateCandidato);
router.delete("/:id", deleteCandidato);

export default router;
