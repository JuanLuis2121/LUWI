import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  listarProgreso,
  progresoDelCandidato,
  consultaDelCandidato,
  obtenerProgreso,
  actualizarAvance,
} from "../controllers/progreso.controller.js";

const router = Router();

router.use(requireAuth);

// Consultas por candidato (van antes de "/:id" para que no se confundan)
router.get("/candidato/:candidatoId", progresoDelCandidato);
router.get("/candidato/:candidatoId/asignados", consultaDelCandidato("asignados"));
router.get("/candidato/:candidatoId/completados", consultaDelCandidato("completados"));
router.get("/candidato/:candidatoId/resumen", consultaDelCandidato("resumen"));

router.get("/", listarProgreso);
router.get("/:id", obtenerProgreso);

// Seguimiento: actualizar el porcentaje de avance de un curso asignado
router.put("/:id", actualizarAvance);

// Asignar / desasignar cursos (POST, DELETE) y las evaluaciones los trabaja Dominic.
router.post("/", (req, res) => {
  res.json({ mensaje: "Asignación de cursos en construcción (Dominic)" });
});

router.delete("/:id", (req, res) => {
  res.json({ mensaje: "Desasignación de cursos en construcción (Dominic)" });
});

export default router;
