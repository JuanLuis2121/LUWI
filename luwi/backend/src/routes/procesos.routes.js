import { Router } from "express";
import { requireAuth, requireRol } from "../middlewares/auth.middleware.js";
import {
  listarPipeline,
  crearProceso,
  cambiarEstadoProceso,
} from "../controllers/procesos.controller.js";

// Se monta en /api/procesos-formacion junto al router de progreso (Marlon).
// Express permite varios routers en el mismo prefijo: aquí solo están "/" y "/:id/estado".
const router = Router();
const gestionarProcesos = requireRol("ADMIN", "ADMIN-EMPRESA", "RRHH");

/**
 * @swagger
 * /api/procesos-formacion:
 *   get:
 *     summary: Pipeline de postulantes
 *     description: >
 *       Procesos de formación con su etapa (POR_ASIGNAR, EN_FORMACION, LISTO), la ruta activa
 *       y su avance, más los postulantes que todavía no tienen proceso.
 *       ADMIN-EMPRESA y RRHH solo ven su empresa.
 *     tags: [Procesos de formación]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: "{ data: { procesos: [...], candidatosSinProceso: [...] } }" }
 *   post:
 *     summary: Iniciar un proceso de formación
 *     tags: [Procesos de formación]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [candidatoId, puestoId]
 *             properties:
 *               candidatoId: { type: string }
 *               puestoId: { type: string }
 *     responses:
 *       201: { description: "Proceso creado" }
 *       409: { description: "Ya existe un proceso vigente para ese puesto" }
 */
router.get("/", requireAuth, gestionarProcesos, listarPipeline);
router.post("/", requireAuth, gestionarProcesos, crearProceso);

/**
 * @swagger
 * /api/procesos-formacion/{procesoId}/estado:
 *   patch:
 *     summary: Suspender, reactivar o finalizar un proceso
 *     tags: [Procesos de formación]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: procesoId, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado: { type: string, enum: [ACTIVO, SUSPENDIDO, FINALIZADO] }
 *     responses:
 *       200: { description: "Proceso actualizado" }
 *       409: { description: "Cambio de estado no permitido" }
 */
router.patch(
  "/:procesoId/estado",
  requireAuth,
  gestionarProcesos,
  cambiarEstadoProceso,
);

export default router;
