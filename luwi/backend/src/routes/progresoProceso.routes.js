import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { obtenerProgresoProceso } from "../controllers/progresoProceso.controller.js";

// Se monta en /api/procesos-formacion. Naomi monta sus rutas de asignación en el mismo prefijo
// con otro router; Express permite varios routers en el mismo prefijo sin chocar.
const router = Router();

/**
 * @swagger
 * /api/procesos-formacion/{procesoId}/progreso:
 *   get:
 *     summary: Progreso de un proceso de formación
 *     description: >
 *       Avance real para la ficha del postulante. ADMIN ve cualquiera; RRHH solo los de su empresa;
 *       el POSTULANTE solo el suyo. Si no tiene permiso responde 404 para no revelar procesos ajenos.
 *     tags: [Mi formación]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: procesoId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ data: { proceso, asignacion } } (asignacion es null si no hay ruta asignada)" }
 *       404: { description: "NO_ENCONTRADO" }
 */
router.get("/:procesoId/progreso", requireAuth, obtenerProgresoProceso);

export default router;
