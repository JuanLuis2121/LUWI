import "dotenv/config";
import mongoose from "mongoose";
import Evaluacion from "../src/models/Evaluacion.js";
import IntentoEvaluacion from "../src/models/IntentoEvaluacion.js";
import AsignacionRuta from "../src/models/AsignacionRuta.js";
import ProcesoFormacion from "../src/models/ProcesoFormacion.js";

const PREFIJO = "[PRUEBA]";

const uri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DB_URI ||
  process.env.DATABASE_URL;

async function limpiar() {
  const evals = await Evaluacion.find({ titulo: new RegExp(`^\\${PREFIJO}`) }).select("_id");
  const ids = evals.map((e) => e._id);
  const intentos = await IntentoEvaluacion.deleteMany({ evaluacion: { $in: ids } });
  const borradas = await Evaluacion.deleteMany({ _id: { $in: ids } });
  console.log(
    `Limpieza: ${borradas.deletedCount} evaluaciones y ${intentos.deletedCount} intentos de prueba eliminados.`
  );
}

async function main() {
  if (!uri) {
    throw new Error(
      "No encontré la URI de MongoDB en el .env (probé MONGO_URI, MONGODB_URI, DB_URI, DATABASE_URL)."
    );
  }
  await mongoose.connect(uri);
  console.log("Conectado a MongoDB.");

  // Siempre se limpian los datos de prueba anteriores para poder repetir el script
  await limpiar();
  if (process.argv.includes("--limpiar")) return;

  // Asignación real y vigente
  const asignacion = await AsignacionRuta.findOne({ estado: "ACTIVA" }).sort({ createdAt: -1 });
  if (!asignacion) {
    throw new Error("No hay ninguna AsignacionRuta ACTIVA. Asigna una ruta a un postulante desde la app y vuelve a correr el script.");
  }
  const proceso = await ProcesoFormacion.findById(asignacion.proceso);
  if (!proceso) throw new Error("La asignación apunta a un proceso que no existe.");

  const cursoAsignado = asignacion.cursos[0];

  // Evaluación 1: publicada, con 4 preguntas (total 5 puntos)
  const evaluacion = await Evaluacion.create({
    curso: cursoAsignado.curso,
    titulo: `${PREFIJO} Evaluación de ${cursoAsignado.titulo}`,
    descripcion: "Evaluación ficticia para pruebas de integración.",
    estado: "PUBLICADA",
    puntajeMinimoAprobar: 70,
    preguntas: [
      {
        pregunta: "¿Cuál de estas opciones es una base de datos NoSQL?",
        tipo: "SELECCION_MULTIPLE",
        opciones: ["MySQL", "MongoDB", "PostgreSQL", "SQLite"],
        respuestaCorrecta: "MongoDB",
        puntos: 1,
        orden: 1,
      },
      {
        pregunta: "¿Qué método HTTP se usa normalmente para crear un recurso?",
        tipo: "SELECCION_MULTIPLE",
        opciones: ["GET", "DELETE", "POST", "HEAD"],
        respuestaCorrecta: "POST",
        puntos: 1,
        orden: 2,
      },
      {
        pregunta: "¿Qué lenguaje se ejecuta en el navegador de forma nativa?",
        tipo: "SELECCION_MULTIPLE",
        opciones: ["Python", "C#", "JavaScript", "Java"],
        respuestaCorrecta: "JavaScript",
        puntos: 2,
        orden: 3,
      },
      {
        pregunta: "Docker Compose permite definir varios contenedores en un archivo.",
        tipo: "VERDADERO_FALSO",
        respuestaCorrecta: "Verdadero",
        puntos: 1,
        orden: 4,
      },
    ],
  });

  // Evaluación 2: borrador con una pregunta (para probar publicar / activar / desactivar)
  const borrador = await Evaluacion.create({
    curso: cursoAsignado.curso,
    titulo: `${PREFIJO} Evaluación en borrador`,
    descripcion: "Para probar publicar y desactivar.",
    estado: "BORRADOR",
    preguntas: [
      {
        pregunta: "React es una biblioteca para construir interfaces.",
        tipo: "VERDADERO_FALSO",
        respuestaCorrecta: "Verdadero",
        puntos: 1,
        orden: 1,
      },
    ],
  });

  // Intento 1: finalizado y reprobado (acierta la 1 y la 4 = 2 de 5 puntos = 40%)
  const [p1, p2, p3, p4] = evaluacion.preguntas;
  const incorrecta = (p) => p.opciones.find((o) => o !== p.respuestaCorrecta);

  const intento = await IntentoEvaluacion.create({
    evaluacion: evaluacion._id,
    curso: cursoAsignado.curso,
    asignacion: asignacion._id,
    cursoAsignadoId: cursoAsignado._id,
    proceso: proceso._id,
    postulante: proceso.candidato,
    empresa: proceso.empresa,
    numeroIntento: 1,
    estado: "FINALIZADO",
    respuestas: [
      { pregunta: p1._id, respuesta: p1.respuestaCorrecta, esCorrecta: true, puntosObtenidos: p1.puntos },
      { pregunta: p2._id, respuesta: incorrecta(p2), esCorrecta: false, puntosObtenidos: 0 },
      { pregunta: p3._id, respuesta: incorrecta(p3), esCorrecta: false, puntosObtenidos: 0 },
      { pregunta: p4._id, respuesta: p4.respuestaCorrecta, esCorrecta: true, puntosObtenidos: p4.puntos },
    ],
    puntajeObtenido: p1.puntos + p4.puntos,
    puntajeTotal: p1.puntos + p2.puntos + p3.puntos + p4.puntos,
    puntajeMinimoAprobar: evaluacion.puntajeMinimoAprobar,
    fechaInicio: new Date(Date.now() - 15 * 60 * 1000),
    fechaFinalizacion: new Date(Date.now() - 5 * 60 * 1000),
  });

  console.log("\n=== DATOS PARA MARLON ===");
  console.log("Evaluación PUBLICADA:", String(evaluacion._id));
  console.log("Evaluación BORRADOR: ", String(borrador._id));
  console.log("Curso (original):    ", String(cursoAsignado.curso), `(${cursoAsignado.titulo})`);
  console.log("Asignación:          ", String(asignacion._id));
  console.log("cursoAsignadoId:     ", String(cursoAsignado._id));
  console.log("Proceso:             ", String(proceso._id));
  console.log("Postulante:          ", String(proceso.candidato));
  console.log("Empresa:             ", String(proceso.empresa));
  const guardado = await IntentoEvaluacion.findById(intento._id).lean();
  console.log(`Intento 1 guardado: ${guardado.calificacion}% -> ${guardado.resultado}`);
  console.log("Al postulante le queda 1 intento disponible.");
}

main()
  .catch((err) => {
    console.error("Error en el seed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());