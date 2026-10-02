import { Router } from "express";

const router = Router();

// GET /api/cursos - Obtener todos los cursos
router.get("/", (req, res) => {
  res.json({ mensaje: "Módulo de Cursos en construcción - GET todos" });
});

// GET /api/cursos/:id - Obtener un curso por ID
router.get("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Cursos en construcción - GET curso ${req.params.id}` });
});

// POST /api/cursos - Crear un nuevo curso
router.post("/", (req, res) => {
  res.json({ mensaje: "Módulo de Cursos en construcción - POST crear" });
});

// PUT /api/cursos/:id - Actualizar un curso
router.put("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Cursos en construcción - PUT actualizar ${req.params.id}` });
});

// DELETE /api/cursos/:id - Eliminar un curso
router.delete("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Cursos en construcción - DELETE ${req.params.id}` });
});

export default router;