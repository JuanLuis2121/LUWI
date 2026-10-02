import mongoose from "mongoose";

const empresaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    sector: {
      type: String,
      required: false,
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
    puestos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Puesto",
      },
    ],
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  }
);

const Empresa = mongoose.model("Empresa", empresaSchema);

export default Empresa;