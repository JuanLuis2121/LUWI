import mongoose from "mongoose";

// Un documento = una unidad marcada como revisada.
// Consultar una unidad NO crea registros aquí.
const progresoUnidadSchema = new mongoose.Schema(
  {
    asignacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AsignacionRuta",
      required: true,
    },
    proceso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProcesoFormacion",
      required: true,
    },
    // _id del curso dentro de AsignacionRuta.cursos
    cursoAsignadoId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Id de la unidad 
    unidad: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    postulante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidato",
      required: true,
    },
    fechaRevision: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Una sola revisión por unidad y asignación
progresoUnidadSchema.index({ asignacion: 1, unidad: 1 }, { unique: true });

// Para calcular avance por proceso y por curso
progresoUnidadSchema.index({ proceso: 1 });
progresoUnidadSchema.index({ asignacion: 1, cursoAsignadoId: 1 });

export default mongoose.model("ProgresoUnidad", progresoUnidadSchema);