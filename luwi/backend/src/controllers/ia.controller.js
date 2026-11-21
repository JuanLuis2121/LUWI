import mongoose from "mongoose";
import Candidato from "../models/Candidato.js";
import ProcesoFormacion from "../models/ProcesoFormacion.js";
import AsignacionRuta from "../models/AsignacionRuta.js";
import ProgresoUnidad from "../models/ProgresoUnidad.js";
import Puesto from "../models/Puesto.js";
import { generarPlanCapacitacion } from "../services/ia.service.js";

export const generarPlan = async (req, res) => {
  const { procesoId } = req.body ?? {};

  if (
    typeof procesoId !== "string" ||
    !mongoose.isObjectIdOrHexString(procesoId)
  ) {
    return res.status(400).json({ message: "Indica un proceso válido." });
  }

  try {
    const candidato = await Candidato.findOne({ usuario: req.user._id })
      .select("habilidades")
      .lean();

    if (!candidato) {
      return res.status(404).json({
        message: "No encontramos un perfil de postulante asociado a tu cuenta.",
      });
    }

    const proceso = await ProcesoFormacion.findOne({
      _id: procesoId,
      candidato: candidato._id,
    })
      .select("puesto empresa estado")
      .lean();

    if (!proceso) {
      return res
        .status(404)
        .json({ message: "Proceso de formación no encontrado." });
    }

    if (proceso.estado !== "ACTIVO") {
      return res
        .status(409)
        .json({ message: "El proceso de formación no está activo." });
    }

    const [asignacion, puesto] = await Promise.all([
      AsignacionRuta.findOne({
        proceso: proceso._id,
        empresa: proceso.empresa,
        estado: "ACTIVA",
      })
        .select("estructura.nombre cursos")
        .lean(),
      Puesto.findOne({ _id: proceso.puesto, empresa: proceso.empresa })
        .select("titulo requisitos")
        .lean(),
    ]);

    if (!asignacion || !puesto) {
      return res.status(409).json({
        message:
          "El proceso necesita un puesto y una ruta asignada para generar el plan.",
      });
    }

    const revisiones = await ProgresoUnidad.find({
      asignacion: asignacion._id,
      proceso: proceso._id,
      postulante: candidato._id,
    })
      .select("cursoAsignadoId -_id")
      .lean();

    const revisadasPorCurso = new Map();

    for (const revision of revisiones) {
      const id = String(revision.cursoAsignadoId);
      revisadasPorCurso.set(id, (revisadasPorCurso.get(id) ?? 0) + 1);
    }

    const cursos = [...asignacion.cursos]
      .sort((a, b) => a.orden - b.orden)
      .map((curso) => ({
        titulo: curso.titulo,
        nivel: curso.nivel,
        duracionHoras: curso.duracionHoras,
        acceso: curso.acceso,
        unidadesRevisadas: revisadasPorCurso.get(String(curso._id)) ?? 0,
      }));

    const plan = await generarPlanCapacitacion({
      profesionInteres: puesto.titulo,
      requisitosDelPuesto: puesto.requisitos,
      habilidades: candidato.habilidades ?? [],
      ruta: asignacion.estructura.nombre,
      cursos,
    });

    return res.status(200).json({
      message: "Plan de capacitación generado correctamente.",
      plan,
    });
  } catch (error) {
    console.error("Error al generar el plan:", error.message);
    return res.status(500).json({ message: "No se pudo generar el plan." });
  }
};
