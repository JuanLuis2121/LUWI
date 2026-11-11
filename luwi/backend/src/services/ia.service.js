import { getOpenAI } from "../config/openai.js";

export const generarPlanCapacitacion = async (perfil) => {
  const openai = getOpenAI();

  const respuesta = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-6-luna",

    instructions: `
      Eres LUWI AI, un asistente especializado en
      orientación profesional y capacitación tecnológica.

      Tu trabajo es analizar el perfil de los candidatos
      y generar planes de capacitación personalizados.

      Debes:
      - Analizar las habilidades actuales.
      - Identificar oportunidades de mejora.
      - Recomendar tecnologías y conocimientos.
      - Proponer cursos y actividades de aprendizaje.
      - Crear un plan de capacitación organizado.

      Responde siempre en español.
      Utiliza explicaciones claras y prácticas.
      No inventes certificaciones ni cursos específicos.
    `,

    input: `
      Analiza el siguiente perfil profesional:

      ${JSON.stringify(perfil, null, 2)}

      Genera un plan de capacitación personalizado
      según las necesidades del candidato.
    `,
  });

  return respuesta.output_text;
};
