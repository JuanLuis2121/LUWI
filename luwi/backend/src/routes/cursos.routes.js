import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.milddleware.js";
import { cursoValidator } from "../validators/curso.validator.js";
import {
  listarCursos,
  obtenerCurso,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
} from "../controllers/cursos.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listarCursos); // GET /api/cursos?buscar=&nivel=
router.get("/:id", obtenerCurso); // GET /api/cursos/:id
router.post("/", validateSchema(cursoValidator), crearCurso); // POST /api/cursos
router.put("/:id", validateSchema(cursoValidator), actualizarCurso); // PUT /api/cursos/:id
router.delete("/:id", eliminarCurso); // DELETE /api/cursos/:id

export default router;
