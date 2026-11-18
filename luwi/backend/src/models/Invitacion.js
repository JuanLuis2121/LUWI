import mongoose from "mongoose";

export const ESTADOS_INVITACION = ["PENDIENTE", "USADA", "INVALIDADA"];

const invitacionSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Guardamos el hash, nunca el token original
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    // Fecha de vencimiento: 48 horas
    expiraEn: {
      type: Date,
      required: true,
    },

    estado: {
      type: String,
      enum: ESTADOS_INVITACION,
      default: "PENDIENTE",
    },

    usadaEn: {
      type: Date,
      default: null,
    },

    invalidadaEn: {
      type: Date,
    },

    creadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// Solo una invitación pendiente por usuario
invitacionSchema.index(
  { usuario: 1 },
  {
    unique: true,
    partialFilterExpression: {
      estado: "PENDIENTE",
    },
  },
);

export default mongoose.model("Invitacion", invitacionSchema);
