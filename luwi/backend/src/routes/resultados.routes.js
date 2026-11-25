import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  misResultados,
  resultadosPorPostulante,
  resultadosPorCurso,
  resultadosPorProceso,
  detalleIntento,
} from "../controllers/resultados.controller.js";

// Resultados de evaluaciones. Los permisos por rol se aplican en el controlador:
// ADMIN todo; RRHH/ADMIN-EMPRESA solo su empresa; POSTULANTE solo lo suyo.
const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Resultados
 *   description: Resultados de evaluaciones. Nota oficial = la calificación más alta entre los intentos finalizados.
 *
 * /api/resultados/mios:
 *   get:
 *     summary: Resultados del postulante conectado
 *     tags: [Resultados]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: "{ resumen, data: [{ evaluacion, curso, calificacion, estado, fecha, intentos }] }" }
 *       403: { description: Solo postulantes }
 * /api/resultados/postulante/{postulanteId}:
 *   get:
 *     summary: Resultados de un postulante (id del perfil de postulante)
 *     tags: [Resultados]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: postulanteId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ resumen, data }" }
 *       404: { description: No existe o no tienes permiso }
 * /api/resultados/curso/{cursoId}:
 *   get:
 *     summary: Resultados de un curso
 *     tags: [Resultados]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: cursoId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ resumen, data }" }
 *       404: { description: El curso no existe }
 * /api/resultados/proceso/{procesoId}:
 *   get:
 *     summary: Resultados de un proceso de formación (incluye evaluaciones PENDIENTES)
 *     tags: [Resultados]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: procesoId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ resumen, data }" }
 *       404: { description: No existe o no tienes permiso }
 * /api/resultados/intentos/{intentoId}:
 *   get:
 *     summary: Detalle de un intento por pregunta
 *     description: El administrador ve las respuestas correctas; el postulante solo cuando ya no le quedan intentos.
 *     tags: [Resultados]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: intentoId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ data: { calificacion, resultado, respuestas } }" }
 *       404: { description: No existe o no tienes permiso }
 */
router.get("/mios", misResultados);
router.get("/postulante/:postulanteId", resultadosPorPostulante);
router.get("/curso/:cursoId", resultadosPorCurso);
router.get("/proceso/:procesoId", resultadosPorProceso);
router.get("/intentos/:intentoId", detalleIntento);

export default router;
