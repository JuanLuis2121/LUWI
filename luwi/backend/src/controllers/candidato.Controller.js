import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Candidato from "../models/Candidato.js";
import User from "../models/user.model.js";
import Puesto from "../models/Puesto.js";
import crypto from "node:crypto";
import { enviarCorreoActivacion } from "../services/email.service.js";

const getEmpresaId = (req) => req.user.empresa?._id;

const isValidId = (id) => mongoose.isValidObjectId(id);

// GET /api/candidatos
export const getCandidatos = async (req, res) => {
  try {
    const candidatos = await Candidato.find({
      empresa: getEmpresaId(req),
    })
      .select("-password")
      .populate("usuario", "username email role")
      .populate("puestosAplicados", "titulo")
      .lean();

    return res.status(200).json(candidatos);
  } catch {
    return res.status(500).json({
      message: "Error al consultar postulantes.",
    });
  }
};

// GET /api/candidatos/:id
export const getCandidato = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "ID de postulante inválido.",
      });
    }

    const candidato = await Candidato.findOne({
      _id: req.params.id,
      empresa: getEmpresaId(req),
    })
      .select("-password")
      .populate("usuario", "username email role")
      .populate("puestosAplicados", "titulo")
      .lean();

    if (!candidato) {
      return res.status(404).json({
        message: "Postulante no encontrado.",
      });
    }

    return res.status(200).json(candidato);
  } catch {
    return res.status(500).json({
      message: "Error al consultar el postulante.",
    });
  }
};

// POST /api/candidatos
export const createCandidato = async (req, res) => {
  const {
    nombre,
    correo,
    telefono,
    habilidades = [],
    puestosAplicados = [],
  } = req.body;

  const empresaId = getEmpresaId(req);

  if (!empresaId) {
    return res.status(403).json({
      message: "No tienes una empresa asociada.",
    });
  }

  if (!nombre || !correo) {
    return res.status(400).json({
      message: "Nombre y correo son obligatorios.",
    });
  }

  // Generar token de activación
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (
    !Array.isArray(habilidades) ||
    !Array.isArray(puestosAplicados) ||
    puestosAplicados.some((id) => !isValidId(id))
  ) {
    return res.status(400).json({
      message: "Habilidades o puestos aplicados inválidos.",
    });
  }

  const session = await mongoose.startSession();

  try {
    const email = correo.trim().toLowerCase();

    let candidatoCreado;

    await session.withTransaction(async () => {
      const puestosValidos = await Puesto.countDocuments({
        _id: { $in: puestosAplicados },
        empresa: empresaId,
      }).session(session);

      if (puestosValidos !== new Set(puestosAplicados).size) {
        const error = new Error(
          "Uno o más puestos no pertenecen a tu empresa.",
        );
        error.status = 400;
        throw error;
      }

      const [usuario] = await User.create(
        [
          {
            username: nombre.trim(),
            email,
            password: await bcrypt.hash(
              crypto.randomBytes(32).toString("hex"),
              10,
            ), // Contraseña temporal
            role: "postulante",
            empresa: empresaId,
            cuentaActiva: false,
            activacionToken: tokenHash,
            activacionExpira: expiracion,
          },
        ],
        { session },
      );

      const [candidato] = await Candidato.create(
        [
          {
            nombre: nombre.trim(),
            correo: email,
            usuario: usuario._id,
            empresa: empresaId,
            telefono,
            habilidades,
            puestosAplicados,
          },
        ],
        { session },
      );

      candidatoCreado = candidato;
    });

    await enviarCorreoActivacion({
      correo: email,
      nombre: nombre.trim(),
      token,
    });

    return res.status(201).json({
      message: "Postulante creado correctamente.",
      candidato: candidatoCreado,
    });
  } catch (error) {
    console.error("Error al crear el postulante:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "El correo ya está registrado.",
      });
    }

    return res.status(error.status || 500).json({
      message:
        error.status === 400 ? error.message : "Error al crear el postulante.",
    });
  } finally {
    await session.endSession();
  }
};

// PUT /api/candidatos/:id
export const updateCandidato = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "ID de postulante inválido.",
      });
    }

    // Solo se permiten campos del perfil.
    const cambios = {};

    if (req.body.nombre !== undefined) {
      cambios.nombre = req.body.nombre;
    }

    if (req.body.telefono !== undefined) {
      cambios.telefono = req.body.telefono;
    }

    if (req.body.habilidades !== undefined) {
      if (!Array.isArray(req.body.habilidades)) {
        return res.status(400).json({
          message: "Las habilidades deben ser un arreglo.",
        });
      }
      cambios.habilidades = req.body.habilidades;
    }

    if (req.body.puestosAplicados !== undefined) {
      const puestos = req.body.puestosAplicados;

      if (!Array.isArray(puestos) || puestos.some((id) => !isValidId(id))) {
        return res.status(400).json({
          message: "Puestos aplicados inválidos.",
        });
      }

      const cantidad = await Puesto.countDocuments({
        _id: { $in: puestos },
        empresa: getEmpresaId(req),
      });

      if (cantidad !== new Set(puestos).size) {
        return res.status(400).json({
          message: "Uno o más puestos no pertenecen a tu empresa.",
        });
      }

      cambios.puestosAplicados = puestos;
    }

    const candidato = await Candidato.findOneAndUpdate(
      {
        _id: req.params.id,
        empresa: getEmpresaId(req),
      },
      { $set: cambios },
      { new: true, runValidators: true },
    ).select("-password");

    if (!candidato) {
      return res.status(404).json({
        message: "Postulante no encontrado.",
      });
    }

    return res.status(200).json({
      message: "Postulante actualizado correctamente.",
      candidato,
    });
  } catch {
    return res.status(500).json({
      message: "Error al actualizar el postulante.",
    });
  }
};

// DELETE /api/candidatos/:id
export const deleteCandidato = async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "ID de postulante inválido.",
    });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const candidato = await Candidato.findOne({
        _id: req.params.id,
        empresa: getEmpresaId(req),
      }).session(session);

      if (!candidato) {
        const error = new Error("Postulante no encontrado.");
        error.status = 404;
        throw error;
      }

      await Candidato.deleteOne({
        _id: candidato._id,
      }).session(session);

      if (candidato.usuario) {
        await User.deleteOne({
          _id: candidato.usuario,
          role: "postulante",
          empresa: getEmpresaId(req),
        }).session(session);
      }
    });

    return res.status(200).json({
      message: "Postulante eliminado correctamente.",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message:
        error.status === 404
          ? error.message
          : "Error al eliminar el postulante.",
    });
  } finally {
    await session.endSession();
  }
};
