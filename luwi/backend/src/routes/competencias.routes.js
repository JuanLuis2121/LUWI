import { Router } from "express";
import { getCompetencias } from "../controllers/competencias.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Competencias
 *   description: Catálogo de competencias para puestos y cursos
 */

/**
 * @swagger
 * /api/competencias:
 *   get:
 *     summary: Obtener el catálogo de competencias
 *     description: Devuelve las competencias activas, ordenadas por categoría y nombre.
 *     tags: [Competencias]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: categoria
 *         required: false
 *         schema:
 *           type: string
 *           enum: [TECNICA, BLANDA, OTRA]
 *         description: Filtra por categoría
 *     responses:
 *       200:
 *         description: Lista de competencias obtenida correctamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", requireAuth, getCompetencias);

export default router;