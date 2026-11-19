import User from "../models/user.model.js";
import Empresa from "../models/Empresa.js";
import bcrypt from "bcryptjs";
import { CreateAccessToken } from "../utils/jwt.js";
import mongoose from "mongoose";
import crypto from "node:crypto";
import { normalizeUserRole } from "../utils/userRole.js";

// FORMATEAR DATOS DEL USUARIO
const getUserData = (user) => ({
  id: user._id,
  nombre: user.username,
  email: user.email,
  rol: normalizeUserRole(user),
  empresa: user.empresa
    ? {
        id: user.empresa._id,
        nombre: user.empresa.nombre,
      }
    : null,
});

// REGISTRAR USUARIO
export const register = async (req, res) => {
  const { username, email, password, empresa: empresaId } = req.body;

  try {
    let role;
    let empresaAsignada = null;

    if (req.user.role === "admin") {
      // El administrador general crea administradores de empresa.
      role = "empresa";

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
    } else if (req.user.role === "empresa") {
      // El administrador de empresa crea usuarios RRHH.
      role = "rrhh";
      empresaAsignada = req.user.empresa._id;
    } else if (req.user.role === "rrhh") {
      // RRHH crea cuentas de postulantes.
      role = "postulante";
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
};

// INICIAR SESIÓN
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userFound = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!userFound) {
      return res.status(400).json({
        message: "Credenciales incorrectas.",
      });
    }

    const isMatch = await bcrypt.compare(password, userFound.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Credenciales incorrectas.",
      });
    }

    const role = normalizeUserRole(userFound);

    if (!role) {
      return res.status(403).json({
        message: "El usuario no tiene un rol válido.",
      });
    }

    const user = await User.findById(userFound._id)
      .select("_id username email role rol empresa")
      .populate("empresa", "_id nombre")
      .lean();

    user.role = role;

    if (user.role !== "admin" && !user.empresa) {
      return res.status(403).json({
        message: "El usuario no tiene una empresa asociada válida.",
      });
    }

    if (userFound.cuentaActiva === false) {
      return res.status(403).json({
        message: "Debes activar tu cuenta desde el correo electrónico.",
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
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        message: "Token de activación requerido.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const usuario = await User.findOne({
      activacionToken: tokenHash,
      activacionExpira: { $gt: new Date() },
      cuentaActiva: false,
      role: "postulante",
    }).select("+activacionToken");

    if (!usuario) {
      return res.status(400).json({
        message: "El enlace es inválido o ha expirado.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const actualizado = await User.findOneAndUpdate(
      {
        _id: usuario._id,
        activacionToken: tokenHash,
        activacionExpira: { $gt: new Date() },
        cuentaActiva: false,
      },
      {
        $set: {
          password: passwordHash,
          cuentaActiva: true,
        },
        $unset: {
          activacionToken: "",
          activacionExpira: "",
        },
      },
      { new: true },
    );

    if (!actualizado) {
      return res.status(400).json({
        message: "El enlace ya fue utilizado o ha expirado.",
      });
    }

    return res.status(200).json({
      message: "Cuenta activada correctamente. Ya puedes iniciar sesión.",
    });
  } catch {
    return res.status(500).json({
      message: "Error al activar la cuenta.",
    });
  }
};
