import mongoose from "mongoose";

const empresaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    sector: {
      type: String,
      default: "No especificado",
    },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // No incluir el password en las consultas por defecto
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
  },
);

const Empresa = mongoose.model("Empresa", empresaSchema);

export default Empresa;
