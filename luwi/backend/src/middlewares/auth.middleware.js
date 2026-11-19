import jwt from "jsonwebtoken";
import User, { ROLES } from "../models/user.model.js";

// VERIFICAR AUTENTICACIÓN
export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Debes iniciar sesión para continuar.",
    });
  }

  const secret = process.env.TOKEN_SECRET;

  if (!secret) {
    return res.status(500).json({
      message: "La autenticación no está configurada.",
    });
  }

  let payload;

  try {
    payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });
  } catch {
    return res.status(401).json({
      message: "Tu sesión no es válida o ha vencido.",
    });
  }

  if (
    typeof payload !== "object" ||
    typeof payload.id !== "string" ||
    !/^[a-fA-F0-9]{24}$/.test(payload.id)
  ) {
    return res.status(401).json({
      message: "La sesión no contiene un usuario válido.",
    });
  }

  try {
    const user = await User.findById(payload.id)
      .select("_id username email role empresa candidato estadoCuenta")
      .populate("empresa", "_id nombre")
      .lean();

    if (!user) {
      return res.status(401).json({
        message: "El usuario de esta sesión ya no existe.",
      });
    }

    // Validar rol
    if (!user.role || !ROLES.includes(user.role)) {
      return res.status(403).json({
        message: "El usuario no tiene un rol válido.",
      });
    }

    // Validar estado de cuenta
    const estadoCuenta = user.estadoCuenta ?? "ACTIVA";

    if (estadoCuenta === "DESACTIVADA") {
      return res.status(403).json({
        message: "Tu cuenta está desactivada.",
      });
    }

    if (estadoCuenta === "PENDIENTE") {
      return res.status(403).json({
        message: "Tu cuenta todavía no está activada.",
      });
    }

    // ADMIN general no necesita empresa.
    if (user.role !== "ADMIN" && !user.empresa) {
      return res.status(403).json({
        message: "El usuario no tiene una empresa asociada.",
      });
    }

    // Guardar información del usuario autenticado
    req.user = {
      ...user,
      estadoCuenta,
    };

    return next();
  } catch (error) {
    console.error("Error al verificar sesión:", error);

    return res.status(500).json({
      message: "No se pudo verificar la sesión. Inténtalo de nuevo.",
    });
  }
};

// AUTORIZACIÓN POR ROLES
export const requireRol =
  (...rolesPermitidos) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Debes iniciar sesión.",
      });
    }

    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        message: "No tienes permiso para realizar esta acción.",
      });
    }

    return next();
  };

// VERIFICAR PERTENENCIA A EMPRESA
export const perteneceAEmpresa = (usuario, empresaId) => {
  if (!usuario || !empresaId) {
    return false;
  }

  // Administrador general
  if (usuario.role === "ADMIN") {
    return true;
  }

  if (!usuario.empresa) {
    return false;
  }

  const usuarioEmpresaId = usuario.empresa._id ?? usuario.empresa;

  return String(usuarioEmpresaId) === String(empresaId);
};

// COMPATIBILIDAD CON RUTAS EXISTENTES
export const requireRRHH = requireRol("RRHH");
