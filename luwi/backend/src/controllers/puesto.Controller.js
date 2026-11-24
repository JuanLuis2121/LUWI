import Puesto from "../models/Puesto.js";
import Empresa from "../models/Empresa.js";
import mongoose from "mongoose";

const ROLES_GESTION = ["ADMIN-EMPRESA", "RRHH"];

const obtenerEmpresaSesion = (user) => user?.empresa?._id ?? user?.empresa;

const filtrarEmpresa = (req, res) => {
  const empresaId = obtenerEmpresaSesion(req.user);

  if (!ROLES_GESTION.includes(req.user?.role) || !empresaId) {
    res.status(403).json({
      message: "No tienes permiso para gestionar puestos de esta empresa.",
    });
    return null;
  }

  return { empresa: empresaId };
};

const validarEmpresaSolicitada = (empresaSolicitada, empresaSesion) =>
  empresaSolicitada === undefined ||
  (typeof empresaSolicitada === "string" &&
    mongoose.isObjectIdOrHexString(empresaSolicitada) &&
    empresaSolicitada.toLowerCase() === String(empresaSesion));

const responderError = (res, error, message) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }

  console.error(message, error);
  return res.status(500).json({ message });
};

// LISTAR PUESTOS
export const getPuestos = async (req, res) => {
  try {
    let filtro;

    if (req.user?.role === "ADMIN") {
      const { empresa } = req.query;

      if (
        empresa !== undefined &&
        (typeof empresa !== "string" ||
          !mongoose.isObjectIdOrHexString(empresa))
      ) {
        return res.status(400).json({ message: "ID de empresa inválido." });
      }

      filtro = empresa === undefined ? {} : { empresa };
    } else {
      filtro = filtrarEmpresa(req, res);
      if (!filtro) return;
    }

    const puestos = await Puesto.find(filtro).populate("empresa", "-password");
    return res.status(200).json(puestos);
  } catch (error) {
    return responderError(res, error, "Error al consultar los puestos.");
  }
};

// CONSULTAR UN PUESTO DE SU EMPRESA
export const getPuesto = async (req, res) => {
  try {
    const filtro = filtrarEmpresa(req, res);
    if (!filtro) return;

    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({ message: "ID de puesto inválido." });
    }

    const puesto = await Puesto.findOne({ _id: id, ...filtro }).populate(
      "empresa",
      "-password",
    );

    if (!puesto) {
      return res.status(404).json({ message: "Puesto no encontrado." });
    }

    return res.status(200).json(puesto);
  } catch (error) {
    return responderError(res, error, "Error al consultar el puesto.");
  }
};

// CREAR PUESTO EN SU EMPRESA
export const createPuesto = async (req, res) => {
  try {
    const filtro = filtrarEmpresa(req, res);
    if (!filtro) return;

    const { titulo, empresa, descripcion, requisitos } = req.body ?? {};

    if (!validarEmpresaSolicitada(empresa, filtro.empresa)) {
      return res.status(403).json({
        message: "Solo puedes crear puestos en tu propia empresa.",
      });
    }

    const puesto = await mongoose.connection.transaction(async (session) => {
      const [nuevoPuesto] = await Puesto.create(
        [{ titulo, empresa: filtro.empresa, descripcion, requisitos }],
        { session },
      );

      const resultado = await Empresa.updateOne(
        { _id: filtro.empresa },
        { $addToSet: { puestos: nuevoPuesto._id } },
        { session },
      );

      if (resultado.matchedCount === 0) {
        throw new Error("No se encontró la empresa asociada al usuario.");
      }

      return nuevoPuesto;
    });

    return res.status(201).json({
      message: "Puesto creado correctamente.",
      puesto,
    });
  } catch (error) {
    return responderError(res, error, "Error al crear el puesto.");
  }
};

// ACTUALIZAR PUESTO DE SU EMPRESA
export const updatePuesto = async (req, res) => {
  try {
    const filtro = filtrarEmpresa(req, res);
    if (!filtro) return;

    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({ message: "ID de puesto inválido." });
    }

    const { titulo, empresa, descripcion, requisitos } = req.body ?? {};

    if (!validarEmpresaSolicitada(empresa, filtro.empresa)) {
      return res.status(403).json({
        message: "No puedes cambiar la empresa de un puesto.",
      });
    }

    const cambios = {};
    if (titulo !== undefined) cambios.titulo = titulo;
    if (descripcion !== undefined) cambios.descripcion = descripcion;
    if (requisitos !== undefined) cambios.requisitos = requisitos;

    if (Object.keys(cambios).length === 0) {
      return res
        .status(400)
        .json({ message: "Envía un campo para actualizar." });
    }

    const puesto = await Puesto.findOneAndUpdate(
      { _id: id, ...filtro },
      { $set: cambios },
      { new: true, runValidators: true },
    ).populate("empresa", "-password");

    if (!puesto) {
      return res.status(404).json({ message: "Puesto no encontrado." });
    }

    return res.status(200).json({
      message: "Puesto actualizado correctamente.",
      puesto,
    });
  } catch (error) {
    return responderError(res, error, "Error al actualizar el puesto.");
  }
};

// ELIMINAR PUESTO DE SU EMPRESA
export const deletePuesto = async (req, res) => {
  try {
    const filtro = filtrarEmpresa(req, res);
    if (!filtro) return;

    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({ message: "ID de puesto inválido." });
    }

    const eliminado = await mongoose.connection.transaction(async (session) => {
      const puesto = await Puesto.findOneAndDelete(
        { _id: id, ...filtro },
        { session },
      );

      if (!puesto) return false;

      await Empresa.updateOne(
        { _id: filtro.empresa },
        { $pull: { puestos: puesto._id } },
        { session },
      );

      return true;
    });

    if (!eliminado) {
      return res.status(404).json({ message: "Puesto no encontrado." });
    }

    return res.status(200).json({ message: "Puesto eliminado correctamente." });
  } catch (error) {
    return responderError(res, error, "Error al eliminar el puesto.");
  }
};
