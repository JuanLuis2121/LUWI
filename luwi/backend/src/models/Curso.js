import mongoose from "mongoose";

export const NIVELES = ["básico", "intermedio", "avanzado"];
export const ESTADOS_CURSO = ["BORRADOR", "PUBLICADO", "INACTIVO"];
export const TIPOS_UNIDAD = ["TEXTO", "VIDEO", "ENLACE"];

// Unidad de contenido de un curso.
// El _id de cada unidad es el unidadId que usan ProgresoUnidad y UltimaConsulta,
// por eso las unidades nunca se borran ni se recrean: al retirarlas se marcan
// con "retirada" y así se conserva el avance de quien ya las revisó.
const unidadSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    tipo: {
      type: String,
      enum: TIPOS_UNIDAD,
      required: true,
    },
    // Texto de la unidad (obligatorio en las de tipo TEXTO)
    contenido: {
      type: String,
      default: "",
      maxlength: 20000,
    },
    // URL del video o del enlace (obligatoria en VIDEO y ENLACE)
    recursoUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Solo las obligatorias cuentan para el avance
    obligatoria: {
      type: Boolean,
      default: true,
    },
    orden: {
      type: Number,
      required: true,
    },
    retirada: {
      type: Boolean,
      default: false,
    },
    fechaRetiro: {
      type: Date,
    },
  },
  { timestamps: true }
);

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
    // Opcional desde la entrega 4: el contenido ahora va en las unidades.
    // Se mantiene para no romper los cursos que ya lo tienen.
    enlace: {
      type: String,
      required: false,
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
    // Alcance: sin empresa = curso global (lo ven todas); con empresa = solo esa empresa.
    // Se toma de la sesión de RR. HH., nunca del navegador.
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      default: null,
    },
    // BORRADOR: en preparación. PUBLICADO: se puede asignar. INACTIVO: desactivado.
    estado: {
      type: String,
      enum: ESTADOS_CURSO,
      default: "BORRADOR",
    },
    fechaPublicacion: {
      type: Date,
    },
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
