import mongoose from "mongoose";

export const ROLES = ["ADMIN", "ADMIN-EMPRESA", "RRHH", "POSTULANTE"];

export const ESTADOS_CUENTA = ["PENDIENTE", "ACTIVA", "DESACTIVADA"];

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ROLES,
      required: true,
    },
    candidato: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidato",
      required: false,
    },

    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: function () {
        return this.role !== "ADMIN";
      },
    },

    estadoCuenta: {
      type: String,
      enum: ESTADOS_CUENTA,
      default: "ACTIVA",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
