import { Router } from "express";
import { requireAuth, requireRol } from "../middlewares/auth.middleware.js";
import {
  listarRutas,
  obtenerRuta,
  crearRuta,
  actualizarRuta,
  eliminarRuta,
  obtenerOpciones,
} from "../controllers/rutasAprendizaje.controller.js";

import { adminORRHH as gestionarRutas } from "../middlewares/permisos.middleware.js";
const router = Router();

router.use(requireAuth, gestionarRutas);

router.get("/opciones", obtenerOpciones);
router.get("/", listarRutas);
router.get("/:id", obtenerRuta);
router.post("/", crearRuta);
router.put("/:id", actualizarRuta);
router.delete("/:id", eliminarRuta);

export default router;
