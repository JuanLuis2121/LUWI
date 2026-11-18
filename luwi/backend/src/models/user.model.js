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

    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: function () {
        return this.role !== "ADMIN";
      },
    },

    candidato: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidato",
      default: null,
    },

    estadoCuenta: {
      type: String,
      enum: ESTADOS_CUENTA,
      default: "ACTIVA",
    },

    activacionToken: {
      type: String,
      default: null,
      select: false,
    },

    activacionExpira: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
