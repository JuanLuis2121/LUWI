import Empresa from "../models/Empresa.js";
import Puesto from "../models/Puesto.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// CONSULTAR TODAS LAS EMPRESAS
export const getEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.find()
      .select("-password")
      .populate("puestos");

    res.status(200).json(empresas);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar las empresas",
      error: error.message,
    });
  }
};

// CONSULTAR UNA EMPRESA POR ID
export const getEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID de empresa inválido",
      });
    }

    const empresa = await Empresa.findById(id)
      .select("-password")
      .populate("puestos");

    if (!empresa) {
      return res.status(404).json({
        message: "Empresa no encontrada",
      });
    }

    res.status(200).json(empresa);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar la empresa",
      error: error.message,
    });
  }
};

// CREAR EMPRESA
export const createEmpresa = async (req, res) => {
  try {
    const { nombre, sector, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        message: "Nombre, correo y contraseña son obligatorios",
      });
    }

    const empresaExistente = await Empresa.findOne({
      correo: correo.toLowerCase().trim(),
    });

    if (empresaExistente) {
      return res.status(409).json({
        message: "Ya existe una empresa con ese correo",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevaEmpresa = new Empresa({
      nombre,
      sector,
      correo,
      password: hashedPassword,
    });

    await nuevaEmpresa.save();

    const empresaCreada = await Empresa.findById(nuevaEmpresa._id).select(
      "-password",
    );

    res.status(201).json({
      message: "Empresa creada correctamente",
      empresa: empresaCreada,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear la empresa",
      error: error.message,
    });
  }
};

// ACTUALIZAR EMPRESA
export const updateEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, sector, correo, password } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID de empresa inválido",
      });
    }

    const empresa = await Empresa.findById(id);

    if (!empresa) {
      return res.status(404).json({
        message: "Empresa no encontrada",
      });
    }

    if (nombre !== undefined) empresa.nombre = nombre;
    if (sector !== undefined) empresa.sector = sector;
    if (correo !== undefined) empresa.correo = correo;

    if (password) {
      empresa.password = await bcrypt.hash(password, 10);
    }

    await empresa.save();

    const empresaActualizada = await Empresa.findById(id).select("-password");

    res.status(200).json({
      message: "Empresa actualizada correctamente",
      empresa: empresaActualizada,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "El correo ya está registrado",
      });
    }

    res.status(500).json({
      message: "Error al actualizar la empresa",
      error: error.message,
    });
  }
};

// ELIMINAR EMPRESA
export const deleteEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID de empresa inválido",
      });
    }

    const empresa = await Empresa.findById(id);

    if (!empresa) {
      return res.status(404).json({
        message: "Empresa no encontrada",
      });
    }

    // Verificar si tiene puestos asociados
    const tienePuestos = await Puesto.exists({
      empresa: id,
    });

    if (tienePuestos || empresa.puestos.length > 0) {
      return res.status(409).json({
        message:
          "No se puede eliminar la empresa porque tiene puestos asociados",
      });
    }

    await Empresa.findByIdAndDelete(id);

    res.status(200).json({
      message: "Empresa eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar la empresa",
      error: error.message,
    });
  }
};
