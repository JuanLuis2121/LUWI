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

    // Empresa que registró al postulante. createCandidato ya lo enviaba,
    // pero como el campo no existía en el esquema Mongoose lo descartaba
    // y el listado de /api/candidatos (que filtra por empresa) salía vacío.
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
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

candidatoSchema.index({ empresa: 1 });

const Candidato = mongoose.model("Candidato", candidatoSchema);

export default Candidato;
