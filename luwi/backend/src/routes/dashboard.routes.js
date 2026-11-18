import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { obtenerResumen } from "../controllers/dashboard.resumen.controller.js";

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Resumen del panel administrativo
 */

/**
 * @swagger
 * /api/dashboard/resumen:
 *   get:
 *     summary: Cantidades y actividad reciente del panel
 *     description: ADMIN ve todo; RRHH solo su empresa, sus puestos y sus rutas. El rol POSTULANTE no tiene acceso.
 *     tags: [Dashboard]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: "{ empresas, puestos, cursos, rutas, recientes: [{ id, tipo, nombre, fecha }] }" }
 *       403: { description: El usuario es POSTULANTE }
 */
router.get("/resumen", obtenerResumen);

export default router;
