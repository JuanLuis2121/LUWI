import { Router } from "express";

const router = Router();

// GET /api/evaluaciones - Obtener todas las evaluaciones
router.get("/", (req, res) => {
  res.json({ mensaje: "Módulo de Evaluaciones en construcción - GET todas" });
});

// GET /api/evaluaciones/:id - Obtener una evaluación por ID
router.get("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Evaluaciones en construcción - GET evaluación ${req.params.id}` });
});

// POST /api/evaluaciones - Crear una nueva evaluación
router.post("/", (req, res) => {
  res.json({ mensaje: "Módulo de Evaluaciones en construcción - POST crear" });
});

// PUT /api/evaluaciones/:id - Actualizar una evaluación
router.put("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Evaluaciones en construcción - PUT actualizar ${req.params.id}` });
});

// DELETE /api/evaluaciones/:id - Eliminar una evaluación
router.delete("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Evaluaciones en construcción - DELETE ${req.params.id}` });
});

export default router;