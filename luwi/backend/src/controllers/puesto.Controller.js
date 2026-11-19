import Puesto from "../models/Puesto.js";
import Empresa from "../models/Empresa.js";
import mongoose from "mongoose";

// CONSULTAR TODOS LOS PUESTOS
export const getPuestos = async (req, res) => {
  try {
    const puestos = await Puesto.find().populate("empresa", "-password");

    res.status(200).json(puestos);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar los puestos",
      error: error.message,
    });
  }
};

// CONSULTAR UN PUESTO
export const getPuesto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID de puesto inválido",
      });
    }

    const puesto = await Puesto.findById(id).populate("empresa", "-password");

    if (!puesto) {
      return res.status(404).json({
        message: "Puesto no encontrado",
      });
    }

    res.status(200).json(puesto);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar el puesto",
      error: error.message,
    });
  }
};

// CREAR PUESTO
export const createPuesto = async (req, res) => {
  try {
    const { titulo, empresa: empresaId, descripcion, requisitos } = req.body;

    if (!titulo || !empresaId || !descripcion || !requisitos) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios",
      });
    }

    if (!mongoose.isValidObjectId(empresaId)) {
      return res.status(400).json({
        message: "ID de empresa inválido",
      });
    }

    const empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      return res.status(404).json({
        message: "La empresa indicada no existe",
      });
    }

    const nuevoPuesto = new Puesto({
      titulo,
      empresa: empresaId,
      descripcion,
      requisitos,
    });

    const puestoGuardado = await nuevoPuesto.save();

    await Empresa.findByIdAndUpdate(empresaId, {
      $addToSet: {
        puestos: puestoGuardado._id,
      },
    });

    res.status(201).json({
      message: "Puesto creado correctamente",
      puesto: puestoGuardado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear el puesto",
      error: error.message,
    });
  }
};

// ACTUALIZAR PUESTO
export const updatePuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      empresa: nuevaEmpresaId,
      descripcion,
      requisitos,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID de puesto inválido",
      });
    }

    const puesto = await Puesto.findById(id);

    if (!puesto) {
      return res.status(404).json({
        message: "Puesto no encontrado",
      });
    }

    if (titulo !== undefined) puesto.titulo = titulo;
    if (descripcion !== undefined) puesto.descripcion = descripcion;
    if (requisitos !== undefined) puesto.requisitos = requisitos;

    // Cambiar de empresa si se proporciona una nueva
    if (nuevaEmpresaId !== undefined) {
      if (!mongoose.isValidObjectId(nuevaEmpresaId)) {
        return res.status(400).json({
          message: "ID de empresa inválido",
        });
      }

      const empresaAnteriorId = puesto.empresa.toString();

      const empresaNueva = await Empresa.findById(nuevaEmpresaId);

      if (!empresaNueva) {
        return res.status(404).json({
          message: "La nueva empresa no existe",
        });
      }

      if (empresaAnteriorId !== nuevaEmpresaId.toString()) {
        await Empresa.findByIdAndUpdate(empresaAnteriorId, {
          $pull: { puestos: puesto._id },
        });

        await Empresa.findByIdAndUpdate(nuevaEmpresaId, {
          $addToSet: { puestos: puesto._id },
        });

        puesto.empresa = nuevaEmpresaId;
      }
    }

    await puesto.save();

    const puestoActualizado = await Puesto.findById(id).populate(
      "empresa",
      "-password",
    );

    res.status(200).json({
      message: "Puesto actualizado correctamente",
      puesto: puestoActualizado,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar el puesto",
      error: error.message,
    });
  }
};

// ELIMINAR PUESTO
export const deletePuesto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID de puesto inválido",
      });
    }

    const puesto = await Puesto.findById(id);

    if (!puesto) {
      return res.status(404).json({
        message: "Puesto no encontrado",
      });
    }

    // Aquí agregaremos la validación de rutas asociadas
    // cuando confirmemos el modelo Ruta.

    await Puesto.findByIdAndDelete(id);

    await Empresa.findByIdAndUpdate(puesto.empresa, {
      $pull: { puestos: puesto._id },
    });

    res.status(200).json({
      message: "Puesto eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar el puesto",
      error: error.message,
    });
  }
};
