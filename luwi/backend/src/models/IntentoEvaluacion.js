import mongoose from "mongoose";

export const ESTADOS_INTENTO = ["EN_CURSO", "FINALIZADO"];
export const RESULTADOS = ["APROBADO", "REPROBADO"];

// Máximo de intentos por evaluación en cada asignación (acordado con el equipo)
export const MAX_INTENTOS = 2;

// Respuesta a una pregunta. "pregunta" es el _id de la pregunta dentro de
// Evaluacion.preguntas. esCorrecta y puntosObtenidos los calcula el servidor.
const respuestaSchema = new mongoose.Schema(
  {
    pregunta: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    respuesta: { type: String, required: true, trim: true },
    esCorrecta: { type: Boolean, default: false },
    puntosObtenidos: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// Un documento = un intento de un postulante en una evaluación,
// dentro de una asignación y un proceso de formación concretos.
const intentoEvaluacionSchema = new mongoose.Schema(
  {
    evaluacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evaluacion",
      required: true,
    },
    // Curso original (para consultar resultados por curso)
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Curso",
      required: true,
    },
    // Misma estructura que ProgresoUnidad
    asignacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AsignacionRuta",
      required: true,
    },
    // _id del curso dentro de AsignacionRuta.cursos
    cursoAsignadoId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    proceso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProcesoFormacion",
      required: true,
    },
    postulante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidato",
      required: true,
    },
    // Se copia del proceso para validar permisos de RR. HH. rápidamente
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
    },

    numeroIntento: {
  type: Number,
  required: true,
  min: 1,
  max: [MAX_INTENTOS, `Solo se permiten ${MAX_INTENTOS} intentos por evaluación.`],
},

    respuestas: { type: [respuestaSchema], default: [] },

    // Se copian al finalizar para que el resultado no cambie si luego se
    // edita la evaluación
    puntajeObtenido: { type: Number, default: 0, min: 0 },
    puntajeTotal: { type: Number, default: 0, min: 0 },
    puntajeMinimoAprobar: { type: Number, default: 70, min: 0, max: 100 },

    // Porcentaje 0-100 (mismo formato que Progreso.calificacionEvaluacion)
    calificacion: { type: Number, min: 0, max: 100 },
    resultado: { type: String, enum: RESULTADOS },

    fechaInicio: { type: Date, default: Date.now },
    fechaFinalizacion: { type: Date },
  },
  { timestamps: true }
);

intentoEvaluacionSchema.pre("validate", function (next) {
  const ids = this.respuestas.map((r) => String(r.pregunta));
  if (new Set(ids).size !== ids.length) {
    this.invalidate("respuestas", "No puede haber dos respuestas para la misma pregunta.");
  }

  if (this.estado === "FINALIZADO") {
    if (this.puntajeObtenido > this.puntajeTotal) {
      this.invalidate("puntajeObtenido", "El puntaje obtenido no puede superar el total.");
    }
    if (!this.fechaFinalizacion) this.fechaFinalizacion = new Date();

    this.calificacion =
      this.puntajeTotal > 0
        ? Math.round((this.puntajeObtenido / this.puntajeTotal) * 10000) / 100
        : 0;
    this.resultado =
      this.calificacion >= this.puntajeMinimoAprobar ? "APROBADO" : "REPROBADO";
  }
  next();
});

// Un solo intento con ese número por evaluación y asignación
intentoEvaluacionSchema.index(
  { asignacion: 1, evaluacion: 1, numeroIntento: 1 },
  { unique: true }
);

// Solo un intento EN_CURSO a la vez (evita duplicados si se da doble clic en "iniciar")
intentoEvaluacionSchema.index(
  { asignacion: 1, evaluacion: 1, postulante: 1 },
  { unique: true, partialFilterExpression: { estado: "EN_CURSO" } }
);

// Consultas de resultados
intentoEvaluacionSchema.index({ postulante: 1, fechaFinalizacion: -1 });
intentoEvaluacionSchema.index({ curso: 1 });
intentoEvaluacionSchema.index({ proceso: 1 });
intentoEvaluacionSchema.index({ empresa: 1, evaluacion: 1 });

export default mongoose.model("IntentoEvaluacion", intentoEvaluacionSchema);