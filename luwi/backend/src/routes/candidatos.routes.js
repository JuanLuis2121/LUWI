import { Router } from "express";

const router = Router();

// GET /api/candidatos - Obtener todos los candidatos
router.get("/", (req, res) => {
  res.json({ mensaje: "Módulo de Candidatos en construcción - GET todos" });
});

// GET /api/candidatos/:id - Obtener un candidato por ID
router.get("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Candidatos en construcción - GET candidato ${req.params.id}` });
});

// POST /api/candidatos - Crear un nuevo candidato
router.post("/", (req, res) => {
  res.json({ mensaje: "Módulo de Candidatos en construcción - POST crear" });
});

// PUT /api/candidatos/:id - Actualizar un candidato
router.put("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Candidatos en construcción - PUT actualizar ${req.params.id}` });
});

// DELETE /api/candidatos/:id - Eliminar un candidato
router.delete("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Candidatos en construcción - DELETE ${req.params.id}` });
});

export default router;