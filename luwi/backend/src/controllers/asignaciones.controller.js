import mongoose from "mongoose";
import ProcesoFormacion from "../models/ProcesoFormacion.js";
import AsignacionRuta from "../models/AsignacionRuta.js";
import RutaAprendizaje from "../models/RutaAprendizaje.js";
import ProgresoUnidad from "../models/ProgresoUnidad.js";
import { perteneceAEmpresa } from "../middlewares/contexto.middleware.js";

// Devuelve la asignación con cursos ordenados y la duración total calculada
const formatearAsignacion = (asignacion) => {
  const obj = asignacion.toObject ? asignacion.toObject() : asignacion;
  obj.cursos = [...obj.cursos].sort((a, b) => a.orden - b.orden);
  obj.duracionTotalHoras =
    Math.round(
      obj.cursos.reduce((total, c) => total + (c.duracionHoras || 0), 0) * 100,
    ) / 100;
  return obj;
};

// Valida el id, busca el proceso y comprueba que sea de la empresa del usuario.
// Si algo falla responde y devuelve null.
const obtenerProcesoAutorizado = async (req, res) => {
  const { procesoId } = req.params;

  if (!mongoose.isValidObjectId(procesoId)) {
    res.status(400).json({ message: "ID de proceso inválido" });
    return null;
  }

  const proceso = await ProcesoFormacion.findById(procesoId);

  if (!proceso) {
    res.status(404).json({ message: "Proceso de formación no encontrado" });
    return null;
  }

  if (!perteneceAEmpresa(req.user, proceso.empresa)) {
    res.status(403).json({
      message: "Este proceso pertenece a otra empresa.",
    });
    return null;
  }

  return proceso;
};

// ASIGNAR (O REEMPLAZAR) UNA RUTA A UN PROCESO
export const crearAsignacion = async (req, res) => {
  try {
    const proceso = await obtenerProcesoAutorizado(req, res);
    if (!proceso) return;

    const { rutaId } = req.body;

    if (!rutaId || !mongoose.isValidObjectId(rutaId)) {
      return res.status(400).json({ message: "Debes indicar una ruta válida." });
    }

    if (proceso.estado !== "ACTIVO") {
      return res.status(409).json({
        message: "El proceso de formación no está activo.",
      });
    }

    const ruta = await RutaAprendizaje.findById(rutaId).populate({
      path: "cursos",
      select: "titulo duracionHoras nivel competencia estado empresa",
    });

    if (!ruta) {
      return res.status(404).json({ message: "Ruta de aprendizaje no encontrada" });
    }

    if (String(ruta.puesto) !== String(proceso.puesto)) {
      return res.status(400).json({
        message: "La ruta no es compatible con el puesto del postulante.",
      });
    }

    if (ruta.cursos.length === 0) {
      return res.status(400).json({ message: "La ruta no tiene cursos disponibles." });
    }

    // Todos los cursos deben estar publicados y ser globales o de la misma empresa
    const noDisponibles = ruta.cursos.filter(
      (c) =>
        c.estado !== "PUBLICADO" ||
        (c.empresa && String(c.empresa) !== String(proceso.empresa)),
    );

    if (noDisponibles.length > 0) {
      return res.status(400).json({
        message: `Estos cursos no están disponibles para asignar: ${noDisponibles
          .map((c) => c.titulo)
          .join(", ")}.`,
      });
    }

    // ¿Ya tiene una ruta activa?
    const existente = await AsignacionRuta.findOne({
      proceso: proceso._id,
      estado: "ACTIVA",
    });

    if (existente) {
      if (String(existente.ruta) === String(ruta._id)) {
        return res.status(409).json({
          message: "Esta ruta ya está asignada a este postulante.",
        });
      }

      const tieneAvance = await ProgresoUnidad.exists({
        asignacion: existente._id,
      });

      if (tieneAvance) {
        return res.status(409).json({
          message:
            "El postulante ya tiene avance en su ruta actual; no se puede reemplazar.",
        });
      }
    }

    // Copia estable de la ruta: todos los cursos nacen BLOQUEADOS
    const ahora = new Date();

    const nueva = new AsignacionRuta({
      proceso: proceso._id,
      empresa: proceso.empresa,
      ruta: ruta._id,
      estructura: {
        nombre: ruta.nombre,
        descripcion: ruta.descripcion,
        puesto: ruta.puesto,
      },
      cursos: ruta.cursos.map((c, i) => ({
        curso: c._id,
        titulo: c.titulo,
        duracionHoras: c.duracionHoras,
        nivel: c.nivel,
        competencia: c.competencia,
        orden: i + 1,
        acceso: "BLOQUEADO",
        fechaCambioAcceso: ahora,
        cambiadoPor: req.user._id,
        historialAcceso: [
          { acceso: "BLOQUEADO", fecha: ahora, responsable: req.user._id },
        ],
      })),
      asignadoPor: req.user._id,
      fechaAsignacion: ahora,
    });

    // Validar antes de tocar la asignación anterior
    await nueva.validate();

    if (existente) {
      existente.estado = "REEMPLAZADA";
      existente.reemplazadaEn = ahora;
      await existente.save();
    }

    try {
      await nueva.save();
    } catch (error) {
      // Si falla, la anterior vuelve a estar activa
      if (existente) {
        existente.estado = "ACTIVA";
        existente.reemplazadaEn = undefined;
        await existente.save();
      }
      throw error;
    }

    res.status(201).json({
      message: "Ruta asignada correctamente",
      asignacion: formatearAsignacion(nueva),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Este proceso ya tiene una ruta asignada.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({
      message: "Error al asignar la ruta",
      error: error.message,
    });
  }
};

// CONSULTAR LA RUTA ASIGNADA A UN PROCESO
export const getAsignacion = async (req, res) => {
  try {
    const proceso = await obtenerProcesoAutorizado(req, res);
    if (!proceso) return;

    const asignacion = await AsignacionRuta.findOne({
      proceso: proceso._id,
      estado: "ACTIVA",
    });

    if (!asignacion) {
      return res.status(200).json({ asignacion: null });
    }

    res.status(200).json({ asignacion: formatearAsignacion(asignacion) });
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar la asignación",
      error: error.message,
    });
  }
};