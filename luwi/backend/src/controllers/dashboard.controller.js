import { construirDashboard, registrarActividad } from "../services/dashboard.service.js";

// GET /api/candidatos/me/dashboard
export async function obtenerDashboard(req, res, next) {
  try {
    const data = await construirDashboard(req.user);
    if (!data) return res.status(404).json({ message: "No encontramos tu perfil de candidato" });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/candidatos/me/actividad   body: { minutos: 12 }
// Llamar cuando el candidato avanza o termina una sesión de estudio.
export async function guardarActividad(req, res, next) {
  try {
    const minutos = Number(req.body?.minutos);
    if (!Number.isFinite(minutos) || minutos <= 0 || minutos > 600) {
      return res.status(400).json({ message: "minutos debe ser un número entre 1 y 600" });
    }
    const ok = await registrarActividad(req.user, minutos);
    if (!ok) return res.status(404).json({ message: "No encontramos tu perfil de candidato" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
