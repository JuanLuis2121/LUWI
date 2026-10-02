import { Router } from "express";

const router = Router();

// GET /api/empresas - Obtener todas las empresas
router.get("/", (req, res) => {
  res.json({ mensaje: "Módulo de Empresas en construcción - GET todas" });
});

// GET /api/empresas/:id - Obtener una empresa por ID
router.get("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Empresas en construcción - GET empresa ${req.params.id}` });
});

// POST /api/empresas - Crear una nueva empresa
router.post("/", (req, res) => {
  res.json({ mensaje: "Módulo de Empresas en construcción - POST crear" });
});

// PUT /api/empresas/:id - Actualizar una empresa
router.put("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Empresas en construcción - PUT actualizar ${req.params.id}` });
});

// DELETE /api/empresas/:id - Eliminar una empresa
router.delete("/:id", (req, res) => {
  res.json({ mensaje: `Módulo de Empresas en construcción - DELETE ${req.params.id}` });
});

export default router;