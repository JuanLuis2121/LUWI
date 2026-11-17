import mongoose from "mongoose";

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

    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },

    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
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
