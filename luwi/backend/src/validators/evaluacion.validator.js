import { z } from "zod";
import mongoose from "mongoose";
import { TIPOS_PREGUNTA, OPCIONES_VERDADERO_FALSO } from "../models/Evaluacion.js";

const esId = (id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id);
const vacioAUndefined = (v) => (v === "" || v === null ? undefined : v);

// "75" -> 75 (los formularios mandan números como texto)
const numero = (mensaje, min, max) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: mensaje }).min(min, mensaje).max(max, mensaje)
  );

// ---------------- Evaluación ----------------

const camposEvaluacion = {
  titulo: z
    .string({ error: "El título de la evaluación es obligatorio." })
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(150, "El título no puede superar los 150 caracteres."),

  descripcion: z.preprocess(
    (v) => (v === null || v === undefined ? "" : v),
    z.string().trim().max(1000, "La descripción no puede superar los 1000 caracteres.")
  ),

  puntajeMinimoAprobar: numero(
    "El porcentaje para aprobar debe ser un número entre 0 y 100.",
    0,
    100
  ).optional(),
};

// POST /api/evaluaciones
export const crearEvaluacionValidator = z.object({
  curso: z
    .string({ error: "Selecciona el curso de la evaluación." })
    .refine(esId, "Selecciona un curso válido."),
  ...camposEvaluacion,
});

// PUT /api/evaluaciones/:id   (el curso no se cambia: los intentos ya guardados dependen de él)
export const editarEvaluacionValidator = z.object(camposEvaluacion);

// ---------------- Preguntas ----------------

// "seleccion multiple", "verdadero/falso", "VF"... -> valor oficial del modelo
function normalizarTipo(v) {
  if (typeof v !== "string") return v;
  const t = v.trim().toUpperCase().replace(/[\s/-]+/g, "_").normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (t === "VF" || t.startsWith("VERDADERO")) return "VERDADERO_FALSO";
  if (t.startsWith("SELECCION")) return "SELECCION_MULTIPLE";
  return t;
}

export const preguntaValidator = z
  .object({
    pregunta: z
      .string({ error: "Escribe el enunciado de la pregunta." })
      .trim()
      .min(3, "El enunciado es demasiado corto.")
      .max(1000, "El enunciado no puede superar los 1000 caracteres."),

    tipo: z.preprocess(
      normalizarTipo,
      z.enum(TIPOS_PREGUNTA, { error: "El tipo debe ser SELECCION_MULTIPLE o VERDADERO_FALSO." })
    ),

    opciones: z
      .array(z.string({ error: "Cada opción debe ser un texto." }).trim(), {
        error: "Las opciones deben enviarse como una lista.",
      })
      .optional(),

    respuestaCorrecta: z
      .string({ error: "Indica cuál es la respuesta correcta." })
      .trim()
      .min(1, "Indica cuál es la respuesta correcta."),

    puntos: numero("Los puntos deben ser un número entre 0.1 y 100.", 0.1, 100).default(1),
  })
  .transform((p) => {
    if (p.tipo === "VERDADERO_FALSO") {
      // Acepta "verdadero"/"FALSO" y lo deja como en el modelo
      const r = p.respuestaCorrecta.toLowerCase();
      const correcta = OPCIONES_VERDADERO_FALSO.find((o) => o.toLowerCase() === r) ?? p.respuestaCorrecta;
      return { ...p, opciones: [...OPCIONES_VERDADERO_FALSO], respuestaCorrecta: correcta };
    }
    return { ...p, opciones: (p.opciones ?? []).filter(Boolean) };
  })
  .superRefine((p, ctx) => {
    if (p.tipo === "SELECCION_MULTIPLE") {
      if (p.opciones.length < 2 || p.opciones.length > 6) {
        ctx.addIssue({ code: "custom", path: ["opciones"], message: "Una pregunta de selección múltiple debe tener entre 2 y 6 opciones." });
        return;
      }
      if (new Set(p.opciones.map((o) => o.toLowerCase())).size !== p.opciones.length) {
        ctx.addIssue({ code: "custom", path: ["opciones"], message: "Las opciones no pueden repetirse." });
        return;
      }
    }
    if (!p.opciones.includes(p.respuestaCorrecta)) {
      ctx.addIssue({
        code: "custom",
        path: ["respuestaCorrecta"],
        message:
          p.tipo === "VERDADERO_FALSO"
            ? "La respuesta correcta debe ser Verdadero o Falso."
            : "La respuesta correcta debe ser una de las opciones.",
      });
    }
  });

// ---------------- Envío de respuestas (postulante) ----------------

export const enviarRespuestasValidator = z.object({
  respuestas: z
    .array(
      z.object({
        pregunta: z.string({ error: "Cada respuesta debe indicar su pregunta." }).refine(esId, "Una de las preguntas no es válida."),
        respuesta: z.preprocess(
          vacioAUndefined,
          z.string({ error: "Hay preguntas sin responder." }).trim().min(1, "Hay preguntas sin responder.")
        ),
      }),
      { error: "Envía las respuestas como una lista." }
    )
    .min(1, "Debes responder las preguntas antes de enviar."),
});
