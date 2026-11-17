import mongoose from "mongoose";

export const ESTADOS_INVITACION = ["PENDIENTE", "USADA", "INVALIDADA"];

const invitacionSchema = new mongoose.Schema(
  {
    proceso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProcesoFormacion",
      required: true,
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Solo se guarda el hash del token; el token original nunca se almacena
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    // Propuesta: 48 horas desde la generación
    expiraEn: {
      type: Date,
      required: true,
    },
    // Una invitación vencida se detecta comparando expiraEn con la fecha actual
    estado: {
      type: String,
      enum: ESTADOS_INVITACION,
      default: "PENDIENTE",
    },
    usadaEn: {
      type: Date,
      required: false,
    },
    invalidadaEn: {
      type: Date,
      required: false,
    },
    creadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Una sola invitación pendiente por proceso: al renovar, la anterior
// debe pasar a INVALIDADA antes de crear la nueva.
invitacionSchema.index(
  { proceso: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: "PENDIENTE" },
  }
);

export default mongoose.model("Invitacion", invitacionSchema);