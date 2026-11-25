import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Invitacion from "../models/Invitacion.js";
import crypto from "node:crypto";
import { enviarCorreoActivacion } from "../services/email.service.js";
import Empresa from "../models/Empresa.js";

const crearInvitacionPersonal = async (req, res, { empresaId, rol }) => {
  const { correo } = req.body;

  if (!empresaId) {
    return res.status(403).json({
      message: "No tienes una empresa asociada.",
    });
  }

  if (!/^[a-f0-9]{24}$/i.test(String(empresaId))) {
    return res.status(400).json({
      message: "ID de empresa inválido.",
    });
  }

  let session;

  try {
    const empresaExiste = await Empresa.exists({ _id: empresaId });

    if (!empresaExiste) {
      return res.status(404).json({
        message: "Empresa no encontrada.",
      });
    }

    const usuarioExistente = await User.exists({ email: correo });

    if (usuarioExistente) {
      return res.status(409).json({
        message: "El correo ya está registrado.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiraEn = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const password = await bcrypt.hash(
      crypto.randomBytes(32).toString("hex"),
      10,
    );

    // Valor temporal para cumplir con el campo obligatorio del modelo.
    const username = `luwi-${crypto.randomBytes(7).toString("hex")}`;

    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const [usuario] = await User.create(
        [
          {
            username,
            email: correo,
            password,
            role: rol,
            empresa: empresaId,
            estadoCuenta: "PENDIENTE",
          },
        ],
        { session },
      );

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
    });

    try {
      await enviarCorreoActivacion({ correo, token, rol });
    } catch (error) {
      console.error("Error al enviar la invitación:", error);

      return res.status(201).json({
        message: "La cuenta quedó pendiente, pero el correo no se pudo enviar.",
        correoEnviado: false,
      });
    }

    return res.status(201).json({
      message: "Invitación enviada correctamente.",
      correoEnviado: true,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        message: "El correo ya está registrado.",
      });
    }

    console.error("Error al crear la invitación:", error);

    return res.status(500).json({
      message: "No se pudo crear la invitación.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const invitarAdminEmpresa = (req, res) =>
  crearInvitacionPersonal(req, res, {
    empresaId: req.params.id,
    rol: "ADMIN-EMPRESA",
  });

export const invitarRRHH = (req, res) =>
  crearInvitacionPersonal(req, res, {
    empresaId: req.user.empresa?._id,
    rol: "RRHH",
  });
