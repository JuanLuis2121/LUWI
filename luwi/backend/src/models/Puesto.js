import mongoose from "mongoose";

const puestoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    requisitos: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Puesto", puestoSchema);