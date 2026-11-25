import { Router } from "express";
import {
  getPuestos,
  getPuesto,
  createPuesto,
  updatePuesto,
  deletePuesto,
} from "../controllers/puesto.Controller.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { puestoSchema } from "../validators/puesto.validator.js";
import { requireAuth, requireRol } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

const gestionarPuestos = requireRol("ADMIN-EMPRESA", "RRHH");
/**
 * @swagger
 * tags:
 *   name: Puestos
 *   description: Gestión de puestos laborales
 */

/**
 * @swagger
 * /api/puestos:
 *   get:
 *     summary: Obtener todos los puestos
 *     description: Obtiene la lista de puestos registrados.
 *     tags: [Puestos]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de puestos obtenida correctamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", requireRol("ADMIN", "ADMIN-EMPRESA", "RRHH"), getPuestos);
/**
 * @swagger
 * /api/puestos/{id}:
 *   get:
 *     summary: Obtener un puesto por ID
 *     tags: [Puestos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del puesto
 *     responses:
 *       200:
 *         description: Puesto encontrado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Puesto no encontrado
 */
router.get("/:id", gestionarPuestos, getPuesto);
/**
 * @swagger
 * /api/puestos:
 *   post:
 *     summary: Crear un nuevo puesto
 *     tags: [Puestos]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Desarrollador Backend
 *               empresa:
 *                 type: string
 *                 example: 65f123456789abcdef123456
 *               descripcion:
 *                 type: string
 *                 example: Desarrollo de servicios y APIs
 *     responses:
 *       201:
 *         description: Puesto creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post("/", validateSchema(puestoSchema), gestionarPuestos, createPuesto);
/**
 * @swagger
 * /api/puestos/{id}:
 *   put:
 *     summary: Actualizar un puesto
 *     tags: [Puestos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del puesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Desarrollador Full Stack
 *               empresa:
 *                 type: string
 *                 example: 65f123456789abcdef123456
 *               descripcion:
 *                 type: string
 *                 example: Desarrollo frontend y backend
 *               requisitos:
 *                 type: string
 *                 example: Experiencia en JavaScript y Node.js
 *     responses:
 *       200:
 *         description: Puesto actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Puesto no encontrado
 */
router.put(
  "/:id",
  validateSchema(puestoSchema),
  gestionarPuestos,
  updatePuesto,
);
/**
 * @swagger
 * /api/puestos/{id}:
 *   delete:
 *     summary: Eliminar un puesto
 *     tags: [Puestos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del puesto
 *     responses:
 *       204:
 *         description: Puesto eliminado correctamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Puesto no encontrado
 */
router.delete("/:id", gestionarPuestos, deletePuesto);

export default router;
