import { Router } from "express";
import {
  getCandidatos,
  getCandidato,
  createCandidato,
  updateCandidato,
  deleteCandidato,
} from "../controllers/candidato.Controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  adminORRHH as puedeGestionarCandidatos,
  soloAdminEmpresa,
} from "../middlewares/permisos.middleware.js";

const router = Router();

router.use(requireAuth, puedeGestionarCandidatos);

router.get("/", soloAdminEmpresa, getCandidatos);
router.get("/:id", soloAdminEmpresa, getCandidato);
router.post("/", createCandidato);
router.put("/:id", updateCandidato);
router.delete("/:id", deleteCandidato);

export default router;
