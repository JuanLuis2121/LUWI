import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Candidato from "../models/Candidato.js";
import User, { ROLES } from "../models/user.model.js";
import Invitacion from "../models/Invitacion.js";
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

  if (
    typeof nombre !== "string" ||
    !nombre.trim() ||
    typeof correo !== "string" ||
    !correo.trim()
  ) {
    return res.status(400).json({
      message: "Nombre y correo son obligatorios.",
    });
  }

  if (
    !Array.isArray(habilidades) ||
    !Array.isArray(puestosAplicados) ||
    puestosAplicados.some((id) => !isValidId(id))
  ) {
    return res.status(400).json({
      message: "Habilidades o puestos aplicados inválidos.",
    });
  }

  const email = correo.trim().toLowerCase();

  // Token original: se envía por correo, nunca se guarda.
  const token = crypto.randomBytes(32).toString("hex");

  // Solo almacenamos el hash del token.
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // La invitación vence después de 48 horas.
  const expiraEn = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const session = await mongoose.startSession();

  let candidatoCreado;

  try {
    await session.withTransaction(async () => {
      // Comprobar que los puestos pertenecen a la empresa
      // del usuario RRHH autenticado.
      const puestosValidos = await Puesto.countDocuments({
        _id: { $in: puestosAplicados },
        empresa: empresaId,
      }).session(session);

      const puestosUnicos = new Set(puestosAplicados.map(String));

      if (puestosValidos !== puestosUnicos.size) {
        const error = new Error(
          "Uno o más puestos no pertenecen a tu empresa.",
        );
        error.status = 400;
        throw error;
      }

      // No crear otra cuenta si el correo ya existe.
      const usuarioExistente = await User.findOne({
        email,
      }).session(session);

      if (usuarioExistente) {
        const error = new Error(
          "El correo ya está registrado. No se modificó la contraseña ni la cuenta existente.",
        );
        error.status = 409;
        throw error;
      }

      // Crear usuario pendiente.
      const [usuario] = await User.create(
        [
          {
            username: nombre.trim(),
            email,
            password: await bcrypt.hash(
              crypto.randomBytes(32).toString("hex"),
              10,
            ),
            role: ROLES[3], // "POSTULANTE"
            empresa: empresaId,
            estadoCuenta: "PENDIENTE",
          },
        ],
        { session },
      );

      // Crear perfil del postulante.
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

      // Asociar el perfil del candidato con el usuario
      await User.updateOne(
        { _id: usuario._id },
        {
          $set: {
            candidato: candidato._id,
          },
        },
        { session },
      );

      // Crear invitación independiente del proceso
      // de formación.
      await Invitacion.create(
        [
          {
            usuario: usuario._id,
            tokenHash,
            expiraEn,
            estado: "PENDIENTE",
            creadaPor: req.user._id,
          },
        ],
        { session },
      );

      candidatoCreado = candidato;
    });

    // El correo se envía después de confirmar
    // la transacción en MongoDB.
    try {
      await enviarCorreoActivacion({
        correo: email,
        nombre: nombre.trim(),
        token,
      });
    } catch (emailError) {
      console.error("Error al enviar correo de activación:", emailError);

      return res.status(201).json({
        message:
          "Postulante creado, pero no se pudo enviar el correo de activación.",
        candidato: candidatoCreado,
        correoEnviado: false,
      });
    }

    return res.status(201).json({
      message:
        "Postulante creado correctamente. Invitación enviada por correo.",
      candidato: candidatoCreado,
      correoEnviado: true,
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
        error.status === 400 || error.status === 409
          ? error.message
          : "Error al crear el postulante.",
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
          role: ROLES[3], // "POSTULANTE"
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
