import { Router } from "express";

const router = Router();

// GET /api/progreso - Obtener todos los registros de progreso
router.get("/", (req, res) => {
  res.json({ mensaje: "Módulo de Progreso en construcción - GET todos" });
});

// GET /api/progreso/:id - Obtener un registro de progreso por ID
router.get("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Progreso en construcción - GET progreso ${req.params.id}` });
});

// POST /api/progreso - Crear un nuevo registro de progreso
router.post("/", (req, res) => {
  res.json({ mensaje: "Módulo de Progreso en construcción - POST crear" });
});

// PUT /api/progreso/:id - Actualizar un registro de progreso
router.put("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Progreso en construcción - PUT actualizar ${req.params.id}` });
});

// DELETE /api/progreso/:id - Eliminar un registro de progreso
router.delete("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Progreso en construcción - DELETE ${req.params.id}` });
});

export default router;