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

const router = Router();

router.use(requireAuth, requireRol("ADMIN", "ADMIN-EMPRESA", "RRHH"));

router.get("/opciones", obtenerOpciones);
router.get("/", listarRutas);
router.get("/:id", obtenerRuta);
router.post("/", crearRuta);
router.put("/:id", actualizarRuta);
router.delete("/:id", eliminarRuta);

export default router;
