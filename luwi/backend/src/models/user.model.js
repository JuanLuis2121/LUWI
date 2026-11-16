import mongoose from "mongoose";

export const ROLES = ["ADMIN", "RRHH", "POSTULANTE"];
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
    },
    // Opcional: una cuenta de postulante nace PENDIENTE, sin contraseña,
    // hasta que activa su invitación.
    password: {
      type: String,
      required: false,
    },
    rol: {
      type: String,
      enum: ROLES,
      default: "RRHH", // las cuentas que ya existen son de uso administrativo
    },
    // Empresa a la que pertenece un usuario RRHH (ADMIN y POSTULANTE no la necesitan)
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: false,
    },
    // Perfil del postulante (modelo Candidato) cuando rol = POSTULANTE
    candidato: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidato",
      required: false,
    },
    estadoCuenta: {
      type: String,
      enum: ESTADOS_CUENTA,
      default: "ACTIVA", // las cuentas existentes siguen activas
    },
  },
  {
    timestamps: true, // crea campos createdAt y updatedAt
  },
);

export default mongoose.model("User", userSchema);
