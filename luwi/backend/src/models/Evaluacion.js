import mongoose from "mongoose";

const evaluacionSchema = new mongoose.Schema(
  {
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Curso",
      required: true,
    },
    titulo: {
      type: String,
      required: true,
    },
    preguntas: [
      {
        pregunta: { type: String, required: true },
        opciones: [{ type: String }],
        respuestaCorrecta: { type: String, required: true },
      },
    ],
    puntajeMinimoAprobar: {
      type: Number,
      default: 70, // porcentaje
    },
  },
  {
    timestamps: true,
  }
);

const Evaluacion = mongoose.model("Evaluacion", evaluacionSchema);

export default Evaluacion;