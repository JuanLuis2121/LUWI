import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  obtenerMiFormacion,
  obtenerCursoAsignado,
  marcarRevisada,
  guardarUltimaConsulta,
} from "../controllers/miFormacion.controller.js";

// Formación del postulante. El controlador verifica que el usuario sea POSTULANTE,
// que la asignación sea suya, que el proceso esté activo y que el curso esté habilitado.
const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Mi formación
 *   description: Formación del postulante (solo rol POSTULANTE)
 */

/**
 * @swagger
 * /api/mi-formacion:
 *   get:
 *     summary: Resumen de la formación del postulante
 *     description: Empresa, puesto, ruta, porcentaje de avance, cursos habilitados y la lista de cursos (sin contenido). tieneAvance indica si mostrar "Continuar formación".
 *     tags: [Mi formación]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: "{ data: { usuario, empresa, puesto, proceso, asignacion } } (asignacion es null si no hay ruta asignada)" }
 *       403: { description: "SOLO_POSTULANTES o CUENTA_DESACTIVADA" }
 *       404: { description: "SIN_PERFIL" }
 */
router.get("/", obtenerMiFormacion);

/**
 * @swagger
 * /api/mi-formacion/{asignacionId}/cursos/{cursoAsignadoId}:
 *   get:
 *     summary: Contenido de un curso habilitado
 *     description: Consultar NO marca la unidad como revisada. Si el curso está bloqueado responde 403 con solo el título.
 *     tags: [Mi formación]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: asignacionId, required: true, schema: { type: string } }
 *       - { in: path, name: cursoAsignadoId, required: true, schema: { type: string }, description: "_id del curso dentro de AsignacionRuta.cursos" }
 *     responses:
 *       200: { description: "{ data: { asignacionId, curso, unidades, ultimaUnidadId, porcentajeGeneral } }" }
 *       403: { description: "CURSO_BLOQUEADO (incluye curso.titulo) o PROCESO_SUSPENDIDO" }
 *       404: { description: "NO_ENCONTRADO o SIN_PROCESO" }
 */
router.get("/:asignacionId/cursos/:cursoAsignadoId", obtenerCursoAsignado);

/**
 * @swagger
 * /api/mi-formacion/{asignacionId}/unidades/{unidadId}/revision:
 *   put:
 *     summary: Marcar unidad como revisada
 *     description: Registra la revisión una sola vez; repetir la solicitud no aumenta el porcentaje. Devuelve el avance actualizado.
 *     tags: [Mi formación]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: asignacionId, required: true, schema: { type: string } }
 *       - { in: path, name: unidadId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: "{ message, data: { unidadId, nuevaRevision, curso, porcentajeGeneral } }" }
 *       403: { description: "CURSO_BLOQUEADO o PROCESO_SUSPENDIDO" }
 *       404: { description: "NO_ENCONTRADO" }
 */
router.put("/:asignacionId/unidades/:unidadId/revision", marcarRevisada);

/**
 * @swagger
 * /api/mi-formacion/{asignacionId}/ultima-consulta:
 *   put:
 *     summary: Guardar la última unidad consultada (Continuar formación)
 *     description: Un solo registro por asignación. NO cuenta como revisada.
 *     tags: [Mi formación]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: asignacionId, required: true, schema: { type: string } }]
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
 *       200: { description: "{ data: { cursoAsignadoId, unidadId } }" }
 *       400: { description: Unidad no válida }
 *       403: { description: "CURSO_BLOQUEADO o PROCESO_SUSPENDIDO" }
 *       404: { description: "NO_ENCONTRADO" }
 */
router.put("/:asignacionId/ultima-consulta", guardarUltimaConsulta);

export default router;
