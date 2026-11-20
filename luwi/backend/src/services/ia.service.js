import { getOpenAI } from "../config/openai.js";

export const generarPlanCapacitacion = async (perfil) => {
  const openai = getOpenAI();

  const respuesta = await openai.chat.completions.create({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    messages: [
      {
        role: "system",
        content: `
          Eres LUWI AI, un asistente especializado en orientación
          profesional y capacitación tecnológica.

          Analiza las habilidades actuales e identifica oportunidades de mejora.
          Recomienda tecnologías, conocimientos y actividades de aprendizaje.
          Organiza el plan según la disponibilidad semanal del candidato.

          Responde en español con explicaciones claras y prácticas.
          No inventes certificaciones ni cursos específicos.
        `,
      },
      {
        role: "user",
        content: `
          Analiza el siguiente perfil profesional:

          ${JSON.stringify(perfil, null, 2)}

          Genera un plan de capacitación personalizado.
        `,
      },
    ],
  });

  const plan = respuesta.choices[0]?.message?.content?.trim();

  if (!plan) {
    throw new Error("Gemini no devolvió un plan de capacitación.");
  }

  return plan;
};
