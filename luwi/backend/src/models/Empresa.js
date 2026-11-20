import mongoose from "mongoose";

const empresaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
<<<<<<< HEAD
    },
    sector: {
      type: String,
      default: "No especificado",
=======
      minlength: 2,
      maxlength: 120,
    },
    sector: {
      type: String,
      required: false,
      trim: true,
      maxlength: 80,
>>>>>>> origin/develop
    },
    correo: {
      type: String,
      required: true,
      unique: true,
<<<<<<< HEAD
      lowercase: true,
      trim: true,
=======
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "El correo no tiene un formato válido."],
>>>>>>> origin/develop
    },
    // Opcional: el formulario de empresas no la pide.
    password: {
      type: String,
<<<<<<< HEAD
      required: true,
      select: false, // No incluir el password en las consultas por defecto
=======
      required: false,
>>>>>>> origin/develop
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
