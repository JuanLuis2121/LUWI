import mongoose from "mongoose";

export const NIVELES = ["básico", "intermedio", "avanzado"];

const cursoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    competencia: {
      type: String,
      required: true, // ej: "React", "SQL", "Trabajo en equipo"
      trim: true,
      maxlength: 60,
    },
    duracionHoras: {
      type: Number,
      required: true,
      min: 0.5,
      max: 500,
    },
    nivel: {
      type: String,
      enum: NIVELES,
      default: "básico",
    },
    enlace: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

const Curso = mongoose.model("Curso", cursoSchema);

export default Curso;
