import { Router } from "express";
import { requireAuth, requireRol } from "../middlewares/auth.middleware.js";
import {
  obtenerMiFormacion,
  obtenerCursoAsignado,
  marcarRevisada,
  guardarUltimaConsulta,
} from "../controllers/miFormacion.controller.js";
import {
  listarMisEvaluaciones,
  iniciarIntento,
  enviarRespuestas,
} from "../controllers/miEvaluaciones.controller.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { enviarRespuestasValidator } from "../validators/evaluacion.validator.js";

// Formación del postulante. El controlador verifica que el usuario sea POSTULANTE,
// que la asignación sea suya, que el proceso esté activo y que el curso esté habilitado.
const router = Router();

router.use(requireAuth, requireRol("POSTULANTE")); // Todas las rutas requieren autenticación y rol POSTULANTE

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

// ---------------- Evaluaciones del postulante (entrega 5) ----------------

/**
 * @swagger
 * /api/mi-formacion/{asignacionId}/cursos/{cursoAsignadoId}/evaluaciones:
 *   get:
 *     summary: Evaluaciones publicadas del curso
 *     description: Incluye intentos usados y restantes (máx. 2), nota oficial (la más alta) y si puede presentarla. Para presentarla debe tener revisados todos los contenidos obligatorios del curso.
 *     tags: [Mi formación]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: asignacionId, required: true, schema: { type: string } }
 *       - { in: path, name: cursoAsignadoId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: "{ data: { cursoAsignadoId, contenidosRevisados, unidadesObligatorias, evaluaciones } }" }
 *       403: { description: "CURSO_BLOQUEADO o PROCESO_SUSPENDIDO" }
 * /api/mi-formacion/{asignacionId}/cursos/{cursoAsignadoId}/evaluaciones/{evaluacionId}/intentos:
 *   post:
 *     summary: Iniciar un intento (o continuar el que está en curso)
 *     description: Devuelve las preguntas SIN respuestas correctas. Requiere contenidos revisados, evaluación publicada y que queden intentos.
 *     tags: [Mi formación]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: asignacionId, required: true, schema: { type: string } }
 *       - { in: path, name: cursoAsignadoId, required: true, schema: { type: string } }
 *       - { in: path, name: evaluacionId, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: "Intento creado: { data: { intento, intentosRestantes, evaluacion } }" }
 *       200: { description: Ya había un intento en curso; se devuelve ese }
 *       409: { description: "CONTENIDOS_PENDIENTES, EVALUACION_NO_DISPONIBLE o SIN_INTENTOS" }
 * /api/mi-formacion/{asignacionId}/cursos/{cursoAsignadoId}/evaluaciones/{evaluacionId}/intentos/{intentoId}:
 *   put:
 *     summary: Enviar respuestas y calificar
 *     description: Se califica en el servidor. Deben responderse todas las preguntas (si falta alguna no se gasta el intento). Las respuestas correctas solo se muestran cuando ya no quedan intentos.
 *     tags: [Mi formación]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: asignacionId, required: true, schema: { type: string } }
 *       - { in: path, name: cursoAsignadoId, required: true, schema: { type: string } }
 *       - { in: path, name: evaluacionId, required: true, schema: { type: string } }
 *       - { in: path, name: intentoId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               respuestas:
 *                 type: array
 *                 items: { type: object, properties: { pregunta: { type: string }, respuesta: { type: string } } }
 *     responses:
 *       200: { description: "{ data: { intento, calificacion, resultado, intentosRestantes, notaOficial, detalle } }" }
 *       400: { description: "FALTAN_RESPUESTAS, PREGUNTA_INVALIDA, RESPUESTA_INVALIDA o RESPUESTA_DUPLICADA" }
 *       409: { description: "INTENTO_FINALIZADO" }
 */
router.get("/:asignacionId/cursos/:cursoAsignadoId/evaluaciones", listarMisEvaluaciones);
router.post("/:asignacionId/cursos/:cursoAsignadoId/evaluaciones/:evaluacionId/intentos", iniciarIntento);
router.put(
  "/:asignacionId/cursos/:cursoAsignadoId/evaluaciones/:evaluacionId/intentos/:intentoId",
  validateSchema(enviarRespuestasValidator),
  enviarRespuestas,
);

export default router;
