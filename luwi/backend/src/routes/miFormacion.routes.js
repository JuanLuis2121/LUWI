import { Router } from "express";
import { requireAuth, requireRol } from "../middlewares/auth.middleware.js";
import {
  getMiFormacion,
  getCursoAsignado,
  postRevisionUnidad,
  putUltimaConsulta,
} from "../controllers/miFormacion.controller.js";

const router = Router();

// Solo el postulante consulta su propia formación
router.use(requireAuth, requireRol("POSTULANTE"));

/**
 * @swagger
 * tags:
 *   name: Mi formación
 *   description: Ruta de formación del postulante que inició sesión (solo rol POSTULANTE)
 */

/**
 * @swagger
 * /api/mi-formacion:
 *   get:
 *     summary: Resumen de la formación del postulante
 *     description: >
 *       Devuelve los datos del postulante, la empresa, el puesto, el proceso vigente
 *       y la asignación ACTIVA con el avance de cada curso. Solo cuentan las
 *       unidades obligatorias revisadas.
 *     tags: [Mi formación]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "{ data: { postulante, empresa, puesto, proceso, asignacion } }"
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no es POSTULANTE
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", getMiFormacion);

/**
 * @swagger
 * /api/mi-formacion/{asignacionId}/cursos/{cursoAsignadoId}:
 *   get:
 *     summary: Contenido de un curso asignado
 *     description: Devuelve el resumen del curso, sus unidades (con "revisada"), la última unidad consultada en este curso y el porcentaje general.
 *     tags: [Mi formación]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: asignacionId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cursoAsignadoId
 *         required: true
 *         schema: { type: string }
 *         description: _id del curso dentro de AsignacionRuta.cursos
 *     responses:
 *       200:
 *         description: "{ data: { asignacionId, curso, unidades, ultimaUnidadId, porcentajeGeneral } }"
 *       403:
 *         description: PROCESO_SUSPENDIDO o CURSO_BLOQUEADO
 *       404:
 *         description: NO_ENCONTRADO o SIN_PROCESO
 */
router.get("/:asignacionId/cursos/:cursoAsignadoId", getCursoAsignado);

/**
 * @swagger
 * /api/mi-formacion/{asignacionId}/cursos/{cursoAsignadoId}/unidades/{unidadId}/revision:
 *   post:
 *     summary: Marcar una unidad como revisada
 *     description: Idempotente. Marcar dos veces la misma unidad no duplica el avance. Devuelve lo mismo que el GET del curso.
 *     tags: [Mi formación]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: asignacionId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cursoAsignadoId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: unidadId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ data: { asignacionId, curso, unidades, ultimaUnidadId, porcentajeGeneral } }"
 *       403:
 *         description: PROCESO_SUSPENDIDO o CURSO_BLOQUEADO
 *       404:
 *         description: NO_ENCONTRADO o SIN_PROCESO
 */
router.post(
  "/:asignacionId/cursos/:cursoAsignadoId/unidades/:unidadId/revision",
  postRevisionUnidad
);

/**
 * @swagger
 * /api/mi-formacion/{asignacionId}/ultima-consulta:
 *   put:
 *     summary: Guardar la última unidad consultada
 *     description: Guarda dónde se quedó el postulante. NO cuenta como unidad revisada.
 *     tags: [Mi formación]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: asignacionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cursoAsignadoId, unidadId]
 *             properties:
 *               cursoAsignadoId: { type: string }
 *               unidadId: { type: string }
 *     responses:
 *       200:
 *         description: "{ data: { cursoAsignadoId, unidadId } }"
 *       403:
 *         description: PROCESO_SUSPENDIDO o CURSO_BLOQUEADO
 *       404:
 *         description: NO_ENCONTRADO o SIN_PROCESO
 */
router.put("/:asignacionId/ultima-consulta", putUltimaConsulta);

export default router;
