import mongoose from "mongoose";

const candidatoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    correo: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    telefono: {
      type: String,
      required: false,
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
  }
);

const Candidato = mongoose.model("Candidato", candidatoSchema);

export default Candidato;