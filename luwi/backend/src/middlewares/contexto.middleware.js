import User from "../models/user.model.js";

// Se usa DESPUÉS de requireAuth. Completa req.user con rol, empresa,
// candidato y estado de cuenta, y bloquea cuentas desactivadas.
// Es temporal: se puede reemplazar por los controles de Wallan.
export const cargarContexto = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.user._id)
      .select("_id username email rol empresa candidato estadoCuenta")
      .lean();

    if (!usuario) {
      return res.status(401).json({
        message: "El usuario de esta sesión ya no existe.",
      });
    }

    // Las cuentas creadas antes de los campos nuevos no los tienen guardados
    const estadoCuenta = usuario.estadoCuenta ?? "ACTIVA";

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

    req.user = {
      ...usuario,
      rol: usuario.rol ?? "RRHH",
      estadoCuenta,
    };

    return next();
  } catch {
    return res.status(500).json({
      message: "No se pudo verificar tu perfil. Inténtalo de nuevo.",
    });
  }
};

// Uso: requireRol("ADMIN", "RRHH")
export const requireRol =
  (...rolesPermitidos) =>
  (req, res, next) => {
    if (!rolesPermitidos.includes(req.user?.rol)) {
      return res.status(403).json({
        message: "No tienes permiso para realizar esta acción.",
      });
    }
    return next();
  };

// Un ADMIN puede operar sobre cualquier empresa;
// un usuario RRHH solo sobre la suya.
export const perteneceAEmpresa = (usuario, empresaId) => {
  if (usuario.rol === "ADMIN") return true;
  if (!usuario.empresa || !empresaId) return false;
  return String(usuario.empresa) === String(empresaId);
};