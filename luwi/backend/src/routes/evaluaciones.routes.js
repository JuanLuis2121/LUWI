import { Router } from "express";
import { requireAuth, requireRol } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import {
  crearEvaluacionValidator,
  editarEvaluacionValidator,
  preguntaValidator,
} from "../validators/evaluacion.validator.js";
import {
  listarEvaluaciones,
  obtenerEvaluacion,
  crearEvaluacion,
  actualizarEvaluacion,
  publicarEvaluacion,
  desactivarEvaluacion,
  listarPreguntas,
  crearPregunta,
  actualizarPregunta,
  retirarPregunta,
} from "../controllers/evaluaciones.controller.js";

import { adminAdminEmpresaORRHH as todosPuedenGestionar } from "../middlewares/permisos.middleware.js";
// Administración de evaluaciones (entrega 5). El postulante las realiza desde /api/mi-formacion.
// Permisos por curso en el controlador: RRHH/ADMIN-EMPRESA gestionan las de cursos de su empresa;
// ADMIN gestiona todas; los cursos globales solo los gestiona ADMIN.
const router = Router();

router.use(requireAuth, todosPuedenGestionar); // Todas las rutas requieren autenticación y rol ADMIN, ADMIN-EMPRESA o RRHH

/**
 * @swagger
 * tags:
 *   - name: Evaluaciones
 *     description: Administración de evaluaciones y preguntas (ADMIN, ADMIN-EMPRESA, RRHH)
 *
 * components:
 *   schemas:
 *     EvaluacionEntrada:
 *       type: object
 *       required: [curso, titulo]
 *       properties:
 *         curso: { type: string, description: "Id del curso (solo al crear)" }
 *         titulo: { type: string, minLength: 3, maxLength: 150, example: "Evaluación final de React" }
 *         descripcion: { type: string, maxLength: 1000 }
 *         puntajeMinimoAprobar: { type: number, minimum: 0, maximum: 100, default: 70, description: "Porcentaje para aprobar" }
 *     PreguntaEntrada:
 *       type: object
 *       required: [pregunta, tipo, respuestaCorrecta]
 *       properties:
 *         pregunta: { type: string, description: "Enunciado", example: "¿Qué es JSX?" }
 *         tipo: { type: string, enum: [SELECCION_MULTIPLE, VERDADERO_FALSO] }
 *         opciones: { type: array, items: { type: string }, description: "2 a 6 opciones (solo SELECCION_MULTIPLE; en VERDADERO_FALSO se llenan solas)" }
 *         respuestaCorrecta: { type: string, description: "Debe ser una de las opciones (Verdadero/Falso en VF)" }
 *         puntos: { type: number, minimum: 0.1, maximum: 100, default: 1 }
 */

/**
 * @swagger
 * /api/evaluaciones:
 *   get:
 *     summary: Listar evaluaciones (sin el contenido de las preguntas)
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: query, name: curso, schema: { type: string } }
 *       - { in: query, name: estado, schema: { type: string, enum: [BORRADOR, PUBLICADA, INACTIVA] } }
 *     responses:
 *       200: { description: "{ data: [evaluaciones con totalPreguntas, puntajeTotal, intentosRegistrados, editable] }" }
 *   post:
 *     summary: Crear evaluación (nace en BORRADOR)
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: "#/components/schemas/EvaluacionEntrada" } } } }
 *     responses:
 *       201: { description: "{ message, data: evaluacion }" }
 *       400: { description: Datos inválidos }
 *       403: { description: El curso es global o de otra empresa }
 *       404: { description: El curso no existe }
 */
router.get("/", listarEvaluaciones);
router.post("/", validateSchema(crearEvaluacionValidator), crearEvaluacion);

/**
 * @swagger
 * /api/evaluaciones/{id}:
 *   get:
 *     summary: Obtener una evaluación con sus preguntas (incluye respuestas correctas)
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: incluirRetiradas, schema: { type: boolean } }
 *     responses:
 *       200: { description: "{ data: evaluacion }" }
 *       404: { description: La evaluación no existe }
 *   put:
 *     summary: Editar título, descripción y porcentaje para aprobar
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: "#/components/schemas/EvaluacionEntrada" } } } }
 *     responses:
 *       200: { description: "{ message, data: evaluacion }" }
 *       403: { description: Sin permiso sobre el curso }
 * /api/evaluaciones/{id}/publicar:
 *   patch:
 *     summary: Publicar (o reactivar) una evaluación
 *     description: Exige al menos una pregunta vigente.
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Evaluación publicada }
 *       409: { description: Ya publicada o sin preguntas válidas }
 * /api/evaluaciones/{id}/desactivar:
 *   patch:
 *     summary: Desactivar una evaluación (no se puede iniciar; los resultados se conservan)
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Evaluación desactivada }
 *       409: { description: Ya estaba desactivada }
 */
router.get("/:id", obtenerEvaluacion);
router.put(
  "/:id",
  validateSchema(editarEvaluacionValidator),
  actualizarEvaluacion,
);
router.patch("/:id/publicar", publicarEvaluacion);
router.patch("/:id/desactivar", desactivarEvaluacion);

/**
 * @swagger
 * /api/evaluaciones/{id}/preguntas:
 *   get:
 *     summary: Listar preguntas vigentes (con respuesta correcta)
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ data: { evaluacionId, estado, totalPreguntas, puntajeTotal, preguntas } }" }
 *   post:
 *     summary: Agregar pregunta (al final)
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: "#/components/schemas/PreguntaEntrada" } } } }
 *     responses:
 *       201: { description: "{ message, preguntaId, data }" }
 *       400: { description: Pregunta inválida }
 *       409: { description: La evaluación está desactivada }
 * /api/evaluaciones/{id}/preguntas/{preguntaId}:
 *   put:
 *     summary: Editar pregunta (conserva su _id)
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: preguntaId, required: true, schema: { type: string } }
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: "#/components/schemas/PreguntaEntrada" } } } }
 *     responses:
 *       200: { description: Pregunta actualizada }
 *       404: { description: La pregunta no existe o fue retirada }
 *   delete:
 *     summary: Retirar pregunta (no se borra)
 *     tags: [Evaluaciones]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: preguntaId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Pregunta retirada }
 *       409: { description: Es la única pregunta de una evaluación publicada }
 */
router.get("/:id/preguntas", listarPreguntas);
router.post("/:id/preguntas", validateSchema(preguntaValidator), crearPregunta);
router.put(
  "/:id/preguntas/:preguntaId",
  validateSchema(preguntaValidator),
  actualizarPregunta,
);
router.delete("/:id/preguntas/:preguntaId", retirarPregunta);

export default router;
