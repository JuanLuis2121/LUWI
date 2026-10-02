import mongoose from "mongoose";

const cursoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: false,
    },
    competencia: {
      type: String,
      required: true, // ej: "React", "SQL", "Trabajo en equipo"
    },
    duracionHoras: {
      type: Number,
      required: false,
    },
    nivel: {
      type: String,
      enum: ["básico", "intermedio", "avanzado"],
      default: "básico",
    },
  },
  {
    timestamps: true,
  }
);

const Curso = mongoose.model("Curso", cursoSchema);

export default Curso;