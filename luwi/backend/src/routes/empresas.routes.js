import { Router } from "express";
import {
  getEmpresas,
  getEmpresa,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
} from "../controllers/empresa.Controller.js";
import { validateSchema } from "../middlewares/validate.milddleware.js";
import { empresaSchema } from "../validators/empresa.validator.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Empresas
 *   description: Gestión de empresas registradas en LUWI
 */

/**
 * @swagger
 * /api/empresas:
 *   get:
 *     summary: Obtener todas las empresas
 *     description: Retorna todas las empresas registradas, incluyendo sus puestos asociados. No devuelve contraseñas.
 *     tags: [Empresas]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas obtenida correctamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al consultar las empresas
 */
router.get("/", requireAuth, getEmpresas);
/**
 * @swagger
 * /api/empresas/{id}:
 *   get:
 *     summary: Obtener una empresa por ID
 *     description: Busca una empresa por su identificador e incluye sus puestos asociados.
 *     tags: [Empresas]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de MongoDB de la empresa
 *     responses:
 *       200:
 *         description: Empresa encontrada correctamente
 *       400:
 *         description: ID de empresa inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Empresa no encontrada
 *       500:
 *         description: Error al consultar la empresa
 */
router.get("/:id", requireAuth, getEmpresa);
/**
 * @swagger
 * /api/empresas:
 *   post:
 *     summary: Registrar una empresa
 *     description: Crea una empresa y cifra su contraseña antes de almacenarla.
 *     tags: [Empresas]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Tecnología LUWI
 *               sector:
 *                 type: string
 *                 example: Tecnología
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: contacto@luwi.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Empresa123*
 *     responses:
 *       201:
 *         description: Empresa creada correctamente
 *       400:
 *         description: Datos obligatorios faltantes o inválidos
 *       401:
 *         description: No autorizado
 *       409:
 *         description: Ya existe una empresa con ese correo
 *       500:
 *         description: Error al crear la empresa
 */
router.post("/", requireAuth, validateSchema(empresaSchema), createEmpresa);
/**
 * @swagger
 * /api/empresas/{id}:
 *   put:
 *     summary: Actualizar una empresa
 *     description: Actualiza los datos de una empresa. Si se envía una contraseña, se cifra antes de guardarla.
 *     tags: [Empresas]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de MongoDB de la empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Tecnología LUWI
 *               sector:
 *                 type: string
 *                 example: Desarrollo de software
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: nuevo@luwi.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NuevaClave123*
 *     responses:
 *       200:
 *         description: Empresa actualizada correctamente
 *       400:
 *         description: ID inválido o datos incorrectos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Empresa no encontrada
 *       409:
 *         description: El correo ya está registrado
 *       500:
 *         description: Error al actualizar la empresa
 */
router.put("/:id", requireAuth, validateSchema(empresaSchema), updateEmpresa);
/**
 * @swagger
 * /api/empresas/{id}:
 *   delete:
 *     summary: Eliminar una empresa
 *     description: Elimina una empresa siempre que no tenga puestos asociados.
 *     tags: [Empresas]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de MongoDB de la empresa
 *     responses:
 *       200:
 *         description: Empresa eliminada correctamente
 *       400:
 *         description: ID de empresa inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Empresa no encontrada
 *       409:
 *         description: No se puede eliminar porque tiene puestos asociados
 *       500:
 *         description: Error al eliminar la empresa
 */
router.delete("/:id", requireAuth, deleteEmpresa);

export default router;
