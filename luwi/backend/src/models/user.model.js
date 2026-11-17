import mongoose from "mongoose";

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
      enum: ["admin", "empresa", "rrhh", "postulante"],
      required: true,
    },

    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: function () {
        return this.role !== "admin";
      },
    },

    //Para creacion de candidatos por primera vez
    // Estado de activación de la cuenta
    cuentaActiva: {
      type: Boolean,
      default: true,
    },

    // Hash del token de activación
    activacionToken: {
      type: String,
      default: null,
      select: false,
    },

    // Fecha de vencimiento del enlace
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
