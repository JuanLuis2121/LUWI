import { getOpenAI } from "../config/openai.js";

export const generarPlanCapacitacion = async (perfil) => {
  const openai = getOpenAI();

  const respuesta = await openai.chat.completions.create({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    messages: [
      {
        role: "system",
        content: `
          Eres LUWI AI, un asistente especializado en capacitación profesional.

          Genera un plan de estudio en español para el puesto del postulante.
          Usa los requisitos del puesto y las habilidades registradas para
          proponer actividades prácticas. Si el arreglo de habilidades está
          vacío, indica que el perfil no tiene habilidades registradas.

          Usa únicamente los cursos de la ruta asignada y sigue estas reglas:

          1. Prioriza los cursos HABILITADOS que tengan unidades revisadas
          y que no estén marcados como COMPLETADO. Si hay varios, respeta
          el orden en que aparecen en la asignación.
          2. Después, incluye los cursos HABILITADOS que tengan cero unidades
          revisadas, en el orden de la asignación.
          3. Presenta los cursos BLOQUEADOS como pendientes de habilitación.
          Deja las actividades de esos cursos para cuando tengan acceso.
          4. Si un curso está marcado como COMPLETADO, reconócelo como un logro
          y enfoca las actividades del plan en los cursos pendientes.
          5. Usa los porcentajes de avance solo cuando estén en los datos.
          Si solo conoces el número de unidades revisadas, presenta esa
          cantidad sin calcular un porcentaje ni dar el curso por completado.

          Si se indica disponibilidad semanal, ajusta el plan a ese tiempo.
          Si no se indica, organiza el plan por etapas.

          Usa explicaciones claras y prácticas. No inventes cursos,
          certificaciones ni unidades.
        `,
      },
      {
        role: "user",
        content: `
          Genera un plan de estudio para este proceso de formación:

          ${JSON.stringify(perfil, null, 2)}
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
