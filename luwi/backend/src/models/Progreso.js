import mongoose from "mongoose";

const progresoSchema = new mongoose.Schema(
  {
    candidato: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidato",
      required: true,
    },
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Curso",
      required: true,
    },
    estado: {
      type: String,
      enum: ["no iniciado", "en progreso", "completado"],
      default: "no iniciado",
    },
    porcentajeAvance: {
      type: Number,
      default: 0, // de 0 a 100
    },
    calificacionEvaluacion: {
      type: Number,
      required: false, // se llena cuando el candidato presenta la evaluación
    },
    fechaInicio: {
      type: Date,
      required: false,
    },
    fechaFinalizacion: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Progreso = mongoose.model("Progreso", progresoSchema);

export default Progreso;