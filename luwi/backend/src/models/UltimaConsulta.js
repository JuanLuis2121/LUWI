import mongoose from "mongoose";

// El "marcapáginas" del postulante: guarda dónde se quedó.
// Un solo registro por asignación; se actualiza, no se acumula.
// Guardar esta posición NO cuenta como revisar la unidad.
const ultimaConsultaSchema = new mongoose.Schema(
  {
    asignacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AsignacionRuta",
      required: true,
    },
    postulante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidato",
      required: true,
    },
    // _id del curso dentro de AsignacionRuta.cursos
    cursoAsignadoId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Id de la unidad (la define Marlon; por eso no lleva ref)
    unidad: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Un solo marcapáginas por asignación
ultimaConsultaSchema.index({ asignacion: 1 }, { unique: true });

export default mongoose.model("UltimaConsulta", ultimaConsultaSchema);