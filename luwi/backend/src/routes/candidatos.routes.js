import { Router } from "express";
import {
  getCandidatos,
  getCandidato,
  createCandidato,
  updateCandidato,
  deleteCandidato,
} from "../controllers/candidato.Controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

const requireRRHH = (req, res, next) => {
  if (req.user.role !== "rrhh") {
    return res.status(403).json({
      message: "Acceso exclusivo para Recursos Humanos.",
    });
  }

  next();
};

router.use(requireAuth, requireRRHH);

router.get("/", getCandidatos);
router.get("/:id", getCandidato);
router.post("/", createCandidato);
router.put("/:id", updateCandidato);
router.delete("/:id", deleteCandidato);

export default router;
