import mongoose from "mongoose";

// En la interfaz se muestra como "Postulante" (PerfilPostulante).
const candidatoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    correo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Opcional: el acceso real vive en el modelo User.
    password: {
      type: String,
      required: false,
    },
    // Cuenta de acceso asociada (se crea al registrar al postulante)
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    telefono: {
      type: String,
      required: false,
      trim: true,
    },

    habilidades: [
      {
        type: String,
      },
    ],

    puestosAplicados: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Puesto",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Candidato = mongoose.model("Candidato", candidatoSchema);

export default Candidato;
