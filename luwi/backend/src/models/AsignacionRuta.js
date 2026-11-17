import mongoose from "mongoose";

export const ACCESOS = ["BLOQUEADO", "HABILITADO"];
export const ESTADOS_ASIGNACION = ["ACTIVA", "REEMPLAZADA"];

// Cada cambio de acceso queda registrado aquí (nunca se borra)
const cambioAccesoSchema = new mongoose.Schema(
  {
    acceso: { type: String, enum: ACCESOS, required: true },
    fecha: { type: Date, default: Date.now },
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { _id: false }
);

// Copia estable de cada curso de la ruta. El _id de este subdocumento
// es el cursoAsignadoId que usan los endpoints.
const cursoAsignadoSchema = new mongoose.Schema({
  // Curso original (referencia). Los datos de abajo son la copia.
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Curso",
    required: true,
  },
  titulo: { type: String, required: true },
  duracionHoras: { type: Number, required: true },
  nivel: { type: String },
  competencia: { type: String },
  orden: { type: Number, required: true },

  acceso: {
    type: String,
    enum: ACCESOS,
    default: "BLOQUEADO",
  },
  fechaCambioAcceso: { type: Date, default: Date.now },
  cambiadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  historialAcceso: { type: [cambioAccesoSchema], default: [] },
});

const asignacionRutaSchema = new mongoose.Schema(
  {
    proceso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProcesoFormacion",
      required: true,
    },
    // Se copia desde el proceso para validar permisos por empresa rápidamente
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
    },
    // Ruta original (plantilla) de la que salió la copia
    ruta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RutaAprendizaje",
      required: true,
    },
    // Copia estable de la estructura de la ruta
    estructura: {
      nombre: { type: String, required: true },
      descripcion: { type: String },
      puesto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Puesto",
        required: true,
      },
    },
    // Cursos ordenados. Aquí se podrá agregar la copia de unidades
    // cuando Marlon defina cómo las guarda.
    cursos: {
      type: [cursoAsignadoSchema],
      validate: [
        {
          validator: (cursos) => cursos.length > 0,
          message: "La asignación debe tener al menos un curso.",
        },
        {
          validator: (cursos) =>
            new Set(cursos.map((c) => String(c.curso))).size === cursos.length,
          message: "No puede haber cursos repetidos en la asignación.",
        },
      ],
    },
    estado: {
      type: String,
      enum: ESTADOS_ASIGNACION,
      default: "ACTIVA",
    },
    fechaAsignacion: { type: Date, default: Date.now },
    // Responsables
    asignadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    reemplazadaEn: { type: Date, required: false },
  },
  { timestamps: true }
);

// Una sola asignación ACTIVA por proceso. Las REEMPLAZADAS quedan de historial.
asignacionRutaSchema.index(
  { proceso: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: "ACTIVA" },
  }
);

// Para consultas por empresa
asignacionRutaSchema.index({ empresa: 1 });

export default mongoose.model("AsignacionRuta", asignacionRutaSchema);