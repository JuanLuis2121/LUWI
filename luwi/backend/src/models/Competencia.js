import mongoose from "mongoose";

export const CATEGORIAS_COMPETENCIA = ["TECNICA", "BLANDA", "OTRA"];
export const ESTADOS_COMPETENCIA = ["ACTIVA", "INACTIVA"];

const competenciaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    descripcion: {
      type: String,
      required: false,
      trim: true,
      maxlength: 300,
    },
    categoria: {
      type: String,
      enum: CATEGORIAS_COMPETENCIA,
      default: "OTRA",
    },
    // Se desactiva en vez de borrar, para no dañar puestos y cursos que la usan
    estado: {
      type: String,
      enum: ESTADOS_COMPETENCIA,
      default: "ACTIVA",
    },
    // Quién la agregó (útil si luego se permite "Otros")
    creadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Nombre único sin importar mayúsculas ni tildes ("Ingles" = "inglés")
competenciaSchema.index(
  { nombre: 1 },
  { unique: true, collation: { locale: "es", strength: 1 } }
);

export default mongoose.model("Competencia", competenciaSchema);