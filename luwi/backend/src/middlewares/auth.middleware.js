import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

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
      .select("_id username email")
      .lean();

    if (!user) {
      return res.status(401).json({
        message: "El usuario de esta sesión ya no existe.",
      });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(500).json({
      message: "No se pudo verificar la sesión. Inténtalo de nuevo.",
    });
  }
};