import mongoose from "mongoose";

const rutaAprendizajeSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    puesto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Puesto",
      required: true,
    },
    cursos: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Curso",
        },
      ],
      validate: [
        {
          validator: (cursos) => cursos.length > 0,
          message: "Debes agregar al menos un curso.",
        },
        {
          validator: (cursos) =>
            new Set(cursos.map(String)).size === cursos.length,
          message: "No puedes repetir cursos en la ruta.",
        },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "RutaAprendizaje",
  rutaAprendizajeSchema
);