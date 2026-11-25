import mongoose from "mongoose";

export const TIPOS_PREGUNTA = ["SELECCION_MULTIPLE", "VERDADERO_FALSO"];
export const ESTADOS_EVALUACION = ["BORRADOR", "PUBLICADA", "INACTIVA"];
export const OPCIONES_VERDADERO_FALSO = ["Verdadero", "Falso"];

// Pregunta de una evaluación.
// El campo "pregunta" es el enunciado (se mantiene el nombre de la entrega 4).
// Las preguntas no se borran: al retirarlas se marcan con "retirada", así los
// intentos ya guardados siguen apuntando a una pregunta que existe.
const preguntaSchema = new mongoose.Schema(
  {
    pregunta: {
      type: String,
      required: [true, "La pregunta debe tener un enunciado."],
      trim: true,
      minlength: [3, "El enunciado es demasiado corto."],
      maxlength: 1000,
    },
    tipo: {
      type: String,
      enum: TIPOS_PREGUNTA,
      default: "SELECCION_MULTIPLE",
    },
    // Selección múltiple: de 2 a 6 opciones.
    // Verdadero/falso: siempre ["Verdadero", "Falso"] (se fija automáticamente).
    opciones: { type: [String], default: [] },
    // Debe coincidir exactamente con una de las opciones.
    respuestaCorrecta: {
      type: String,
      required: [true, "La pregunta debe tener una respuesta correcta."],
      trim: true,
    },
    puntos: {
      type: Number,
      default: 1,
      min: [0.1, "Los puntos deben ser mayores que 0."],
      max: 100,
    },
    orden: { type: Number, default: 0 },
    retirada: { type: Boolean, default: false },
    fechaRetiro: { type: Date },
  },
  { timestamps: true }
);

preguntaSchema.pre("validate", function () {
  if (this.tipo === "VERDADERO_FALSO") {
    this.opciones = [...OPCIONES_VERDADERO_FALSO];
  } else {
    this.opciones = (this.opciones || [])
      .map((o) => String(o).trim())
      .filter(Boolean);

    if (this.opciones.length < 2 || this.opciones.length > 6) {
      this.invalidate(
        "opciones",
        "Una pregunta de selección múltiple debe tener entre 2 y 6 opciones."
      );
    }
    const unicas = new Set(this.opciones.map((o) => o.toLowerCase()));
    if (unicas.size !== this.opciones.length) {
      this.invalidate("opciones", "Las opciones no pueden repetirse.");
    }
  }

  if (this.respuestaCorrecta && !this.opciones.includes(this.respuestaCorrecta)) {
    this.invalidate(
      "respuestaCorrecta",
      "La respuesta correcta debe ser una de las opciones de la pregunta."
    );
  }
  
});

const evaluacionSchema = new mongoose.Schema(
  {
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Curso",
      required: [true, "La evaluación debe estar asociada a un curso."],
    },
    titulo: {
      type: String,
      required: [true, "La evaluación debe tener un título."],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    // BORRADOR: en preparación. PUBLICADA: los postulantes pueden realizarla.
    // INACTIVA: desactivada (no se puede iniciar).
    estado: {
      type: String,
      enum: ESTADOS_EVALUACION,
      default: "BORRADOR",
    },
    preguntas: { type: [preguntaSchema], default: [] },
    // Porcentaje (0-100). Se mantiene el nombre porque otros archivos lo leen.
    puntajeMinimoAprobar: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    // Usuario que creó la evaluación
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// No se puede publicar una evaluación sin al menos una pregunta vigente
evaluacionSchema.pre("validate", function () {
  if (this.estado === "PUBLICADA") {
    const vigentes = this.preguntas.filter((p) => !p.retirada);
    if (vigentes.length === 0) {
      this.invalidate(
        "preguntas",
        "No se puede publicar una evaluación sin preguntas válidas."
      );
    }
  }
  
});

// Puntos totales de las preguntas vigentes
evaluacionSchema.virtual("puntajeTotal").get(function () {
  return this.preguntas
    .filter((p) => !p.retirada)
    .reduce((suma, p) => suma + (p.puntos ?? 1), 0);
});

// Versión segura para el postulante: sin respuestas correctas ni preguntas retiradas
evaluacionSchema.methods.paraPostulante = function () {
  const obj = this.toObject();
  obj.preguntas = obj.preguntas
    .filter((p) => !p.retirada)
    .map(({ respuestaCorrecta, ...resto }) => resto);
  obj.puntajeTotal = this.puntajeTotal;
  return obj;
};

// Consultar evaluaciones por curso
evaluacionSchema.index({ curso: 1, estado: 1 });

const Evaluacion = mongoose.model("Evaluacion", evaluacionSchema);

export default Evaluacion;