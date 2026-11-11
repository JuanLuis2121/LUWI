import { generarPlanCapacitacion } from "../services/ia.service.js";

export const generarPlan = async (req, res) => {
  try {
    const {
      profesionInteres,
      nivelActual,
      habilidades,
      objetivos,
      disponibilidadSemanal,
    } = req.body;

    // Validar los datos recibidos
    if (
      !profesionInteres ||
      !nivelActual ||
      !Array.isArray(habilidades) ||
      !objetivos ||
      !disponibilidadSemanal
    ) {
      return res.status(400).json({
        message: "Debes proporcionar todos los datos del perfil.",
      });
    }

    // Generar el plan mediante OpenAI
    const plan = await generarPlanCapacitacion({
      profesionInteres,
      nivelActual,
      habilidades,
      objetivos,
      disponibilidadSemanal,
    });

    return res.status(200).json({
      message: "Plan de capacitación generado correctamente.",
      plan,
    });
  } catch (error) {
    console.error("Error al generar plan de capacitación:", error);

    return res.status(500).json({
      message: "No se pudo generar el plan de capacitación.",
      error: error.message,
    });
  }
};
