import mongoose from "mongoose";

// Minutos de estudio por candidato y día. Alimenta la gráfica semanal y la racha del dashboard.
const actividadSchema = new mongoose.Schema(
  {
    candidato: { type: mongoose.Schema.Types.ObjectId, ref: "Candidato", required: true },
    dia: { type: String, required: true }, // "YYYY-MM-DD" en hora de República Dominicana
    minutos: { type: Number, default: 0 },
  },
  { timestamps: true }
);

actividadSchema.index({ candidato: 1, dia: 1 }, { unique: true });

const Actividad = mongoose.model("Actividad", actividadSchema);

export default Actividad;
