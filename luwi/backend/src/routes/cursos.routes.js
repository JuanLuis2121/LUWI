import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import {
  cursoValidator,
  unidadValidator,
  moverUnidadValidator,
} from "../validators/curso.validator.js";
import {
  listarCursos,
  obtenerCurso,
  crearCurso,
  actualizarCurso,
  publicarCurso,
  desactivarCurso,
  eliminarCurso,
} from "../controllers/cursos.controller.js";
import {
  listarUnidades,
  crearUnidad,
  actualizarUnidad,
  moverUnidad,
  retirarUnidad,
} from "../controllers/unidades.controller.js";

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: Cursos
 *     description: Gestión de cursos (BORRADOR, PUBLICADO, INACTIVO)
 *   - name: Unidades
 *     description: Contenido de cada curso (TEXTO, VIDEO, ENLACE)
 *
 * components:
 *   schemas:
 *     CursoEntrada:
 *       type: object
 *       required: [titulo, descripcion, competencia, nivel, duracionHoras]
 *       properties:
 *         titulo: { type: string, minLength: 3, maxLength: 120, example: "Introducción a React" }
 *         descripcion: { type: string, minLength: 10, maxLength: 2000, example: "Fundamentos de React para el puesto." }
 *         competencia: { type: string, example: "React" }
 *         competencias:
 *           type: array
 *           description: Ids del catálogo GET /api/competencias (deben existir y estar ACTIVAS)
 *           items: { type: string, example: "6740a1f2c9e77a0012ab34cd" }
 *         nivel: { type: string, enum: ["básico", "intermedio", "avanzado"] }
 *         duracionHoras: { type: number, minimum: 0.5, maximum: 500, example: 8 }
 *         enlace: { type: string, description: "Opcional desde la entrega 4", example: "https://react.dev" }
 *         empresa: { type: string, description: "Solo ADMIN. RR. HH. siempre crea cursos de su propia empresa (se toma de la sesión). Sin empresa = curso GLOBAL." }
 *     UnidadEntrada:
 *       type: object
 *       required: [titulo, tipo]
 *       properties:
 *         titulo: { type: string, minLength: 3, maxLength: 150, example: "Qué es JSX" }
 *         tipo: { type: string, enum: [TEXTO, VIDEO, ENLACE] }
 *         contenido: { type: string, description: "Obligatorio (mín. 10 caracteres) si tipo = TEXTO" }
 *         recursoUrl: { type: string, description: "URL http(s) obligatoria si tipo = VIDEO o ENLACE", example: "https://youtu.be/abc" }
 *         obligatoria: { type: boolean, default: true, description: "Solo las obligatorias cuentan para el avance" }
 */

/**
 * @swagger
 * /api/cursos:
 *   get:
 *     summary: Listar cursos
 *     description: Sin el contenido de las unidades; incluye totalUnidades, unidadesObligatorias, rutas, alcance (GLOBAL o EMPRESA) y editable. RR. HH. ve los globales y los de su empresa; ADMIN ve todos; POSTULANTE no tiene acceso (403).
 *     tags: [Cursos]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: query, name: buscar, schema: { type: string }, description: "Busca en título y competencia" }
 *       - { in: query, name: nivel, schema: { type: string, enum: ["básico", "intermedio", "avanzado"] } }
 *       - { in: query, name: estado, schema: { type: string, enum: [BORRADOR, PUBLICADO, INACTIVO] } }
 *     responses:
 *       200: { description: "{ data: [cursos] }" }
 *       400: { description: Filtro no válido }
 *       401: { description: Sin sesión }
 *   post:
 *     summary: Crear curso
 *     description: Todo curso nuevo nace en BORRADOR y sin unidades.
 *     tags: [Cursos]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: "#/components/schemas/CursoEntrada" } } }
 *     responses:
 *       201: { description: "{ data: curso }" }
 *       400: { description: Datos inválidos o competencia fuera del catálogo }
 *       409: { description: Ya existe un curso con ese título }
 */
router.get("/", listarCursos);
router.post("/", validateSchema(cursoValidator), crearCurso);

/**
 * @swagger
 * /api/cursos/{id}:
 *   get:
 *     summary: Obtener un curso con sus unidades
 *     tags: [Cursos]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: incluirRetiradas, schema: { type: boolean }, description: "true para ver también las unidades retiradas" }
 *     responses:
 *       200: { description: "{ data: curso }" }
 *       404: { description: El curso no existe }
 *   put:
 *     summary: Editar datos generales del curso
 *     description: No cambia el estado ni las unidades (tienen sus propios endpoints).
 *     tags: [Cursos]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: "#/components/schemas/CursoEntrada" } } }
 *     responses:
 *       200: { description: "{ data: curso }" }
 *       400: { description: Datos inválidos }
 *       404: { description: El curso no existe }
 *       409: { description: Ya existe otro curso con ese título }
 *   delete:
 *     summary: Eliminar curso
 *     description: Se mantiene porque ya funcionaba; lo recomendado desde la entrega 4 es desactivar. No permite eliminar cursos que están en una ruta.
 *     tags: [Cursos]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Curso eliminado }
 *       404: { description: El curso no existe }
 *       409: { description: El curso pertenece a una ruta }
 */
router.get("/:id", obtenerCurso);
router.put("/:id", validateSchema(cursoValidator), actualizarCurso);
router.delete("/:id", eliminarCurso);

/**
 * @swagger
 * /api/cursos/{id}/publicar:
 *   patch:
 *     summary: Publicar curso
 *     description: Exige al menos una unidad válida. También vuelve a publicar un curso INACTIVO.
 *     tags: [Cursos]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ message, data: curso } con estado PUBLICADO" }
 *       404: { description: El curso no existe }
 *       409: { description: Ya está publicado o no tiene unidades válidas }
 * /api/cursos/{id}/desactivar:
 *   patch:
 *     summary: Desactivar curso
 *     description: Pasa a INACTIVO sin borrar unidades, rutas ni avance.
 *     tags: [Cursos]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ message, data: curso } con estado INACTIVO" }
 *       404: { description: El curso no existe }
 *       409: { description: Ya estaba desactivado }
 */
router.patch("/:id/publicar", publicarCurso);
router.patch("/:id/desactivar", desactivarCurso);

/**
 * @swagger
 * /api/cursos/{id}/unidades:
 *   get:
 *     summary: Listar unidades vigentes del curso (ordenadas)
 *     tags: [Unidades]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ data: { cursoId, estado, unidades } }" }
 *       404: { description: El curso no existe }
 *   post:
 *     summary: Agregar unidad (al final)
 *     tags: [Unidades]
 *     security: [{ cookieAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: "#/components/schemas/UnidadEntrada" } } }
 *     responses:
 *       201: { description: "{ message, unidadId, data: { cursoId, estado, unidades } }" }
 *       400: { description: Datos inválidos para el tipo de unidad }
 *       409: { description: El curso está desactivado }
 */
router.get("/:id/unidades", listarUnidades);
router.post("/:id/unidades", validateSchema(unidadValidator), crearUnidad);

/**
 * @swagger
 * /api/cursos/{id}/unidades/{unidadId}:
 *   put:
 *     summary: Editar unidad
 *     description: Conserva el _id de la unidad, así no se pierde el avance de quien ya la revisó.
 *     tags: [Unidades]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: unidadId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: "#/components/schemas/UnidadEntrada" } } }
 *     responses:
 *       200: { description: "{ message, data: { cursoId, estado, unidades } }" }
 *       400: { description: Datos inválidos }
 *       404: { description: La unidad no existe o fue retirada }
 *   delete:
 *     summary: Retirar unidad
 *     description: No la borra (se marca retirada) para conservar el historial. Un curso PUBLICADO no puede quedarse sin unidades válidas.
 *     tags: [Unidades]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: unidadId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: "{ message, data: { cursoId, estado, unidades } }" }
 *       404: { description: La unidad no existe o ya fue retirada }
 *       409: { description: Es la única unidad válida de un curso publicado }
 * /api/cursos/{id}/unidades/{unidadId}/mover:
 *   patch:
 *     summary: Subir o bajar una unidad
 *     tags: [Unidades]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: unidadId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { direccion: { type: string, enum: [subir, bajar] } } }
 *     responses:
 *       200: { description: "{ message, data: { cursoId, estado, unidades } }" }
 *       409: { description: Ya es la primera o la última }
 */
router.put(
  "/:id/unidades/:unidadId",
  validateSchema(unidadValidator),
  actualizarUnidad,
);
router.patch(
  "/:id/unidades/:unidadId/mover",
  validateSchema(moverUnidadValidator),
  moverUnidad,
);
router.delete("/:id/unidades/:unidadId", retirarUnidad);

export default router;
