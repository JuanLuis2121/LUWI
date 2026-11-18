import { Router } from "express";
import {
  crearAsignacion,
  getAsignacion,
  cambiarAcceso,
} from "../controllers/asignaciones.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  cargarContexto,
  requireRol,
} from "../middlewares/contexto.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Asignaciones
 *   description: Asignación de rutas y habilitación de cursos por postulante
 */

/**
 * @swagger
 * /api/procesos-formacion/{procesoId}/asignacion:
 *   post:
 *     summary: Asignar una ruta a un proceso de formación
 *     description: Copia la ruta con todos sus cursos BLOQUEADOS. Reemplaza la ruta anterior solo si no tiene avance.
 *     tags: [Asignaciones]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: procesoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rutaId:
 *                 type: string
 *                 example: 65f123456789abcdef123456
 *     responses:
 *       201:
 *         description: Ruta asignada correctamente
 *       400:
 *         description: Ruta incompatible, cursos no disponibles o datos inválidos
 *       403:
 *         description: El proceso es de otra empresa
 *       404:
 *         description: Proceso o ruta no encontrados
 *       409:
 *         description: Ruta ya asignada, proceso no activo o con avance
 */
router.post(
  "/procesos-formacion/:procesoId/asignacion",
  requireAuth,
  cargarContexto,
  requireRol("ADMIN", "RRHH"),
  crearAsignacion,
);

/**
 * @swagger
 * /api/procesos-formacion/{procesoId}/asignacion:
 *   get:
 *     summary: Consultar la ruta asignada a un proceso
 *     description: "Devuelve { asignacion: null } si todavía no tiene ruta."
 *     tags: [Asignaciones]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: procesoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asignación consultada correctamente
 *       403:
 *         description: El proceso es de otra empresa
 *       404:
 *         description: Proceso no encontrado
 */
router.get(
  "/procesos-formacion/:procesoId/asignacion",
  requireAuth,
  cargarContexto,
  requireRol("ADMIN", "RRHH"),
  getAsignacion,
);

/**
 * @swagger
 * /api/asignaciones/{asignacionId}/cursos/{cursoAsignadoId}/acceso:
 *   patch:
 *     summary: Habilitar o bloquear un curso de la asignación
 *     description: "Bloquear un curso conserva el avance del postulante. Cada cambio queda en el historial."
 *     tags: [Asignaciones]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: asignacionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: cursoAsignadoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               acceso:
 *                 type: string
 *                 enum: [HABILITADO, BLOQUEADO]
 *     responses:
 *       200:
 *         description: Acceso actualizado correctamente
 *       400:
 *         description: Acceso o ID inválido
 *       403:
 *         description: La asignación es de otra empresa
 *       404:
 *         description: Asignación o curso no encontrados
 *       409:
 *         description: Asignación reemplazada o proceso no activo
 */
router.patch(
  "/asignaciones/:asignacionId/cursos/:cursoAsignadoId/acceso",
  requireAuth,
  cargarContexto,
  requireRol("ADMIN", "RRHH"),
  cambiarAcceso,
);

export default router;