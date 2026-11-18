import mongoose from "mongoose";

export const NIVELES = ["básico", "intermedio", "avanzado"];

// Unidad de contenido de un curso (propuesta para coordinar con Marlon).
// El _id de cada unidad es el unidadId que usan ProgresoUnidad y UltimaConsulta.
const unidadSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  contenido: {
    type: String,
    default: "",
  },
  recursoUrl: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500,
  },
  // Solo las unidades obligatorias cuentan para el avance
  obligatoria: {
    type: Boolean,
    default: true,
  },
  orden: {
    type: Number,
    required: true,
  },
});

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
  // Competencias que enseña el curso (del catálogo).
    // El texto "competencia" de arriba se mantiene mientras el equipo migra.
    competencias: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Competencia",
      },
    ],
    // Contenido del curso que revisa el postulante
    unidades: {
      type: [unidadSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Curso = mongoose.model("Curso", cursoSchema);

export default Curso;
