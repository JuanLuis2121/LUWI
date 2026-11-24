import User, { ROLES } from "../models/user.model.js";
import Invitacion from "../models/Invitacion.js";
import bcrypt from "bcryptjs";
import { CreateAccessToken } from "../utils/jwt.js";
import mongoose from "mongoose";
import crypto from "node:crypto";
import {
  ROLES_ACTIVABLES,
  errorActivacion,
} from "../validators/auth.validator.js";

// FORMATEAR DATOS DEL USUARIO
const getUserData = (user) => ({
  id: user._id,
  nombre: user.nombreCompleto || user.username,
  email: user.email,
  role: user.role,
  empresa: user.empresa
    ? {
        id: user.empresa._id,
        nombre: user.empresa.nombre,
      }
    : null,
});

// REGISTRAR USUARIO
/* export const register = async (req, res) => {
  const { username, email, password, empresa: empresaId } = req.body;

  try {
    let role;
    let empresaAsignada = null;

    if (req.user.role === "ADMIN") {
      // El administrador general crea administradores de empresa.
      role = "ADMIN-EMPRESA";

      if (!empresaId || !mongoose.isValidObjectId(empresaId)) {
        return res.status(400).json({
          message: "Debes proporcionar un ID de empresa válido.",
        });
      }

      const empresaExiste = await Empresa.exists({ _id: empresaId });

      if (!empresaExiste) {
        return res.status(404).json({
          message: "La empresa indicada no existe.",
        });
      }

      empresaAsignada = empresaId;
    } else if (req.user.role === "ADMIN-EMPRESA") {
      // El administrador de empresa crea usuarios RRHH.
      role = "RRHH";
      empresaAsignada = req.user.empresa._id;
    } else if (req.user.role === "RRHH") {
      // RRHH crea cuentas de postulantes.
      role = "POSTULANTE";
      empresaAsignada = req.user.empresa._id;
    } else {
      return res.status(403).json({
        message: "No tienes permisos para crear usuarios.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email: email.trim().toLowerCase(),
      password: passwordHash,
      role,
      empresa: empresaAsignada,
    });

    const userSaved = await newUser.save();

    const user = await User.findById(userSaved._id)
      .select("_id username email role empresa")
      .populate("empresa", "_id nombre")
      .lean();

    return res.status(201).json({
      message: "Usuario creado correctamente.",
      user: getUserData(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "El correo electrónico ya está registrado.",
      });
    }

    return res.status(500).json({
      message: "Error interno al crear el usuario.",
    });
  }
}; */

// INICIAR SESIÓN
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userFound = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!userFound) {
      return res.status(400).json({
        message: "No existe una cuenta con ese correo.",
      });
    }

    const isMatch = await bcrypt.compare(password, userFound.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "La contraseña es incorrecta.",
      });
    }

    if (!ROLES.includes(userFound.role)) {
      return res.status(403).json({
        message: "El usuario no tiene un rol válido.",
      });
    }

    const user = await User.findById(userFound._id)
      .select("_id nombreCompleto username email role empresa")
      .populate("empresa", "_id nombre")
      .lean();

    if (user.role !== "ADMIN" && !user.empresa) {
      return res.status(403).json({
        message: "El usuario no tiene una empresa asociada válida.",
      });
    }

    if (userFound.estadoCuenta === "PENDIENTE") {
      return res.status(403).json({
        message: "Debes activar tu cuenta desde el correo electrónico.",
      });
    }

    if (userFound.estadoCuenta === "DESACTIVADA") {
      return res.status(403).json({
        message: "Tu cuenta está desactivada.",
      });
    }

    const token = await CreateAccessToken({
      id: user._id.toString(),
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Inicio de sesión exitoso.",
      user: getUserData(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error interno al iniciar sesión.",
    });
  }
};

// CONSULTAR SESIÓN
export const getSession = async (req, res) => {
  return res.status(200).json({
    user: getUserData(req.user),
  });
};

// CERRAR SESIÓN
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    message: "Sesión cerrada correctamente.",
  });
};

// ACTIVAR CUENTA
export const activarCuenta = async (req, res) => {
  const { token, password, nombreCompleto, telefono } = req.body;
  let session;

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const passwordHash = await bcrypt.hash(password, 10);

    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const invitacion = await Invitacion.findOne({
        tokenHash,
        estado: "PENDIENTE",
        expiraEn: { $gt: new Date() },
      }).session(session);

      if (!invitacion) {
        throw errorActivacion(
          "El enlace es inválido, ha expirado o ya fue utilizado.",
        );
      }

      const usuario = await User.findOne({
        _id: invitacion.usuario,
        role: { $in: ROLES_ACTIVABLES },
        estadoCuenta: "PENDIENTE",
      }).session(session);

      if (!usuario) {
        throw errorActivacion("La cuenta no existe o ya está activada.");
      }

      const cambios = {
        password: passwordHash,
        estadoCuenta: "ACTIVA",
      };

      if (usuario.role === "ADMIN-EMPRESA" || usuario.role === "RRHH") {
        if (!nombreCompleto) {
          throw errorActivacion("Escribe tu nombre completo.");
        }

        cambios.nombreCompleto = nombreCompleto;
      }

      if (usuario.role === "ADMIN-EMPRESA") {
        if (!telefono) {
          throw errorActivacion("Escribe tu teléfono de contacto.");
        }

        cambios.telefono = telefono;
      }

      const ahora = new Date();
      const resultado = await Invitacion.updateOne(
        {
          _id: invitacion._id,
          estado: "PENDIENTE",
          expiraEn: { $gt: ahora },
        },
        {
          $set: { estado: "USADA", usadaEn: ahora },
        },
        { session },
      );

      if (resultado.modifiedCount !== 1) {
        throw errorActivacion("La invitación ya fue utilizada o ha expirado.");
      }

      const cuentaActualizada = await User.updateOne(
        {
          _id: usuario._id,
          role: usuario.role,
          estadoCuenta: "PENDIENTE",
        },
        {
          $set: cambios,
          $unset: {
            activacionToken: "",
            activacionExpira: "",
          },
        },
        { session, runValidators: true },
      );

      if (cuentaActualizada.modifiedCount !== 1) {
        throw errorActivacion("La cuenta no existe o ya está activada.");
      }
    });

    return res.status(200).json({
      message: "Cuenta activada correctamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    if (error.status === 400 || error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === 112 || error.codeName === "WriteConflict") {
      return res.status(409).json({
        message: "Verifica si la cuenta ya fue activada antes de reintentar.",
      });
    }

    console.error("Error al activar cuenta:", error);

    return res.status(500).json({
      message: "Error interno al activar la cuenta.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
