import mongoose from "mongoose";

export const ESTADOS_PROCESO = ["ACTIVO", "SUSPENDIDO", "FINALIZADO"];

const procesoFormacionSchema = new mongoose.Schema(
  {
    candidato: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidato",
      required: true,
    },
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
    },
    puesto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Puesto",
      required: true,
    },
    estado: {
      type: String,
      enum: ESTADOS_PROCESO,
      default: "ACTIVO",
    },
    fechaInicio: {
      type: Date,
      default: Date.now,
    },
    fechaSuspension: {
      type: Date,
      required: false,
    },
    fechaFinalizacion: {
      type: Date,
      required: false,
    },
    // Usuario de RR. HH. que registró al postulante
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Un solo proceso vigente (ACTIVO o SUSPENDIDO) por persona y puesto.
// Si el anterior queda FINALIZADO, se puede abrir uno nuevo.
procesoFormacionSchema.index(
  { candidato: 1, puesto: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: { $in: ["ACTIVO", "SUSPENDIDO"] } },
  }
);

// Para listar rápido los postulantes de una empresa filtrando por estado
procesoFormacionSchema.index({ empresa: 1, estado: 1 });

export default mongoose.model("ProcesoFormacion", procesoFormacionSchema);