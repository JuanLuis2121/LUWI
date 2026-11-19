import mongoose from "mongoose";
import { z } from "zod";
import Progreso from "../models/Progreso.js";
import Candidato from "../models/Candidato.js";
import {
  ESTADOS,
  calcularCambiosDeAvance,
  resumirProgreso,
} from "../services/progreso.service.js";

const esId = (id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id);

const CAMPOS_CURSO = "titulo competencia nivel duracionHoras enlace";

const avanceSchema = z.object({
  porcentajeAvance: z
    .number({ error: "El avance es obligatorio y debe ser un número." })
    .int("El avance debe ser un número entero.")
    .min(0, "El avance no puede ser menor que 0.")
    .max(100, "El avance no puede ser mayor que 100."),
});

const primerError = (resultado) => resultado.error.issues[0].message;

// GET /api/progreso?candidato=&curso=&estado=
export async function listarProgreso(req, res) {
  const { candidato, curso, estado } = req.query;
  const filtro = {};

  if (candidato !== undefined) {
    if (!esId(candidato)) return res.status(400).json({ message: "Candidato no válido." });
    filtro.candidato = candidato;
  }
  if (curso !== undefined) {
    if (!esId(curso)) return res.status(400).json({ message: "Curso no válido." });
    filtro.curso = curso;
  }
  if (estado !== undefined) {
    if (!Object.values(ESTADOS).includes(estado)) {
      return res.status(400).json({ message: "Estado no válido." });
    }
    filtro.estado = estado;
  }

  try {
    const data = await Progreso.find(filtro)
      .populate("candidato", "nombre correo")
      .populate("curso", CAMPOS_CURSO)
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ data });
  } catch {
    return res.status(500).json({ message: "No se pudo obtener el progreso." });
  }
}

// Carga al candidato y todos sus registros con el curso incluido.
async function cargarDelCandidato(candidatoId) {
  const candidato = await Candidato.findById(candidatoId).select("nombre correo").lean();
  if (!candidato) return null;

  const registros = await Progreso.find({ candidato: candidatoId })
    .populate("curso", CAMPOS_CURSO)
    .sort({ createdAt: 1 })
    .lean();

  return { candidato, registros: registros.filter((r) => r.curso) };
}

// GET /api/progreso/candidato/:candidatoId
// Todo en una llamada: datos del candidato, resumen, cursos asignados y completados.
export async function progresoDelCandidato(req, res) {
  const { candidatoId } = req.params;
  if (!esId(candidatoId)) return res.status(400).json({ message: "Candidato no válido." });

  try {
    const datos = await cargarDelCandidato(candidatoId);
    if (!datos) return res.status(404).json({ message: "El candidato no existe." });

    const { candidato, registros } = datos;
    return res.json({
      data: {
        candidato: { id: String(candidato._id), nombre: candidato.nombre, correo: candidato.correo },
        resumen: resumirProgreso(registros),
        cursosAsignados: registros,
        cursosCompletados: registros.filter((r) => r.estado === ESTADOS.COMPLETADO),
      },
    });
  } catch {
    return res.status(500).json({ message: "No se pudo obtener el progreso del candidato." });
  }
}

// GET /api/progreso/candidato/:candidatoId/asignados
// GET /api/progreso/candidato/:candidatoId/completados
// GET /api/progreso/candidato/:candidatoId/resumen
export const consultaDelCandidato = (tipo) => async (req, res) => {
  const { candidatoId } = req.params;
  if (!esId(candidatoId)) return res.status(400).json({ message: "Candidato no válido." });

  try {
    const datos = await cargarDelCandidato(candidatoId);
    if (!datos) return res.status(404).json({ message: "El candidato no existe." });

    const { registros } = datos;
    if (tipo === "asignados") return res.json({ data: registros });
    if (tipo === "completados") {
      return res.json({ data: registros.filter((r) => r.estado === ESTADOS.COMPLETADO) });
    }
    return res.json({ data: resumirProgreso(registros) });
  } catch {
    return res.status(500).json({ message: "No se pudo obtener el progreso del candidato." });
  }
};

// GET /api/progreso/:id
export async function obtenerProgreso(req, res) {
  if (!esId(req.params.id)) return res.status(400).json({ message: "Registro no válido." });

  try {
    const registro = await Progreso.findById(req.params.id)
      .populate("candidato", "nombre correo")
      .populate("curso", CAMPOS_CURSO)
      .lean();
    if (!registro) return res.status(404).json({ message: "El registro de progreso no existe." });
    return res.json({ data: registro });
  } catch {
    return res.status(500).json({ message: "No se pudo obtener el registro." });
  }
}

// PUT /api/progreso/:id   body: { porcentajeAvance }
// Seguimiento del aprendizaje: actualiza el avance y calcula estado y fechas.
export async function actualizarAvance(req, res) {
  if (!esId(req.params.id)) return res.status(400).json({ message: "Registro no válido." });

  const resultado = avanceSchema.safeParse(req.body ?? {});
  if (!resultado.success) return res.status(400).json({ message: primerError(resultado) });

  try {
    const registro = await Progreso.findById(req.params.id);
    if (!registro) return res.status(404).json({ message: "El registro de progreso no existe." });

    registro.set(calcularCambiosDeAvance(registro, resultado.data.porcentajeAvance));
    await registro.save();
    await registro.populate("curso", CAMPOS_CURSO);
    return res.json({ data: registro });
  } catch {
    return res.status(500).json({ message: "No se pudo actualizar el progreso." });
  }
}
