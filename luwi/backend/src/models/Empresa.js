import mongoose from "mongoose";

const empresaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    sector: {
      type: String,
      required: false,
      trim: true,
      maxlength: 80,
    },
    correo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "El correo no tiene un formato válido."],
    },
    // Opcional: el formulario de empresas no la pide.
    password: {
      type: String,
      required: false,
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