// Crea (o actualiza) un postulante de prueba con su ruta asignada.
// Es idempotente: se puede correr varias veces sin duplicar datos.
//
//   npm run seed:postulante                  -> crea / revisa los datos
//   npm run seed:postulante -- --habilitar   -> habilita el curso 2
//   npm run seed:postulante -- --bloquear    -> bloquea el curso 2
//   npm run seed:postulante -- --suspender   -> suspende el proceso
//   npm run seed:postulante -- --activar     -> reactiva el proceso
//   npm run seed:postulante -- --reiniciar   -> borra el avance y la última consulta
//
// Acceso: postulante.prueba@luwi.test / Postulante123
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

import conectarDB from "../src/config/db.js";
import Empresa from "../src/models/Empresa.js";
import Puesto from "../src/models/Puesto.js";
import Curso from "../src/models/Curso.js";
import RutaAprendizaje from "../src/models/RutaAprendizaje.js";
import User from "../src/models/user.model.js";
import Candidato from "../src/models/Candidato.js";
import ProcesoFormacion from "../src/models/ProcesoFormacion.js";
import AsignacionRuta from "../src/models/AsignacionRuta.js";
import ProgresoUnidad from "../src/models/ProgresoUnidad.js";
import UltimaConsulta from "../src/models/UltimaConsulta.js";

dotenv.config();

const CORREO_POSTULANTE = "postulante.prueba@luwi.test";
const PASSWORD_POSTULANTE = "Postulante123";

const UPSERT = { upsert: true, returnDocument: "after", runValidators: true };

const args = new Set(process.argv.slice(2));

const CURSOS = [
  {
    titulo: "Inducción a la empresa - Demo LUWI",
    descripcion:
      "Conoce la empresa, su historia, su cultura y las normas básicas de trabajo.",
    competencia: "Cultura organizacional",
    duracionHoras: 2,
    nivel: "básico",
    enlace: "https://example.com/cursos/induccion",
    unidades: [
      {
        titulo: "Bienvenida",
        contenido:
          "¡Te damos la bienvenida a Empresa Demo LUWI!\n\nEn este curso conocerás quiénes somos, qué hacemos y cómo trabajamos día a día.\n\nTómate tu tiempo para revisar cada unidad. Cuando termines una, márcala como revisada para registrar tu avance.",
        obligatoria: true,
        orden: 1,
      },
      {
        titulo: "Misión, visión y valores",
        contenido:
          "Misión: acompañar a las personas en su crecimiento profesional.\n\nVisión: ser la plataforma de formación de referencia en la región.\n\nValores:\n- Respeto\n- Compromiso\n- Aprendizaje continuo\n- Trabajo en equipo\n\nAbre el recurso para ver el documento completo.",
        recursoUrl: "https://example.com/recursos/mision-vision-valores.pdf",
        obligatoria: true,
        orden: 2,
      },
      {
        titulo: "Normas de convivencia",
        contenido:
          "Estas normas nos ayudan a trabajar mejor:\n\n1. Llega a tiempo a las reuniones.\n2. Comunica cualquier ausencia con anticipación.\n3. Trata a todas las personas con respeto.\n4. Cuida los equipos y espacios de trabajo.",
        obligatoria: true,
        orden: 3,
      },
      {
        titulo: "Lectura complementaria",
        contenido:
          "Esta lectura es opcional. Amplía lo que viste en las unidades anteriores con ejemplos de la vida diaria en la empresa.",
        obligatoria: false,
        orden: 4,
      },
    ],
  },
  {
    titulo: "Herramientas internas - Demo LUWI",
    descripcion:
      "Aprende a usar el correo, el calendario y el sistema de solicitudes internas.",
    competencia: "Herramientas digitales",
    duracionHoras: 3,
    nivel: "básico",
    enlace: "https://example.com/cursos/herramientas",
    unidades: [
      {
        titulo: "Correo y calendario",
        contenido:
          "Usamos el correo para comunicaciones formales y el calendario para agendar reuniones.\n\nRevisa tu bandeja al menos dos veces al día y acepta o rechaza las invitaciones a tiempo.",
        obligatoria: true,
        orden: 1,
      },
      {
        titulo: "Sistema de solicitudes",
        contenido:
          "Las solicitudes de vacaciones, permisos y materiales se hacen desde el sistema interno.\n\nAbre el recurso para ver la guía paso a paso.",
        recursoUrl: "https://example.com/recursos/guia-solicitudes.pdf",
        obligatoria: true,
        orden: 2,
      },
    ],
  },
];

// En develop cada unidad exige "tipo": ENLACE si trae recursoUrl, si no TEXTO.
const tipoDe = (unidad) => (unidad.recursoUrl ? "ENLACE" : "TEXTO");

async function prepararCurso(datos) {
  const { unidades: definidas, ...base } = datos;
  const unidades = definidas.map((u) => ({ ...u, tipo: tipoDe(u) }));

  // Los cursos de prueba nacen PUBLICADOS (las rutas solo aceptan cursos publicados).
  const curso = await Curso.findOneAndUpdate(
    { titulo: base.titulo },
    { $setOnInsert: { ...base, estado: "PUBLICADO", fechaPublicacion: new Date(), unidades } },
    UPSERT
  );

  // Cursos creados por una versión anterior de este script: se completan sin recrear
  // las unidades, para que sus _id (unidadId) y el avance guardado sigan valiendo.
  let cambiado = false;
  if (!curso.unidades?.length) {
    curso.unidades = unidades;
    cambiado = true;
  }
  for (const unidad of curso.unidades) {
    if (!unidad.tipo) {
      unidad.tipo = tipoDe(unidad);
      cambiado = true;
    }
  }
  if (curso.estado !== "PUBLICADO") {
    curso.estado = "PUBLICADO";
    curso.fechaPublicacion = new Date();
    cambiado = true;
  }
  if (cambiado) await curso.save();

  return curso;
}

async function cambiarAccesoCurso2(asignacion, curso2, acceso) {
  const ahora = new Date();
  const resultado = await AsignacionRuta.updateOne(
    {
      _id: asignacion._id,
      cursos: { $elemMatch: { curso: curso2._id, acceso: { $ne: acceso } } },
    },
    {
      $set: {
        "cursos.$.acceso": acceso,
        "cursos.$.fechaCambioAcceso": ahora,
      },
      $push: { "cursos.$.historialAcceso": { acceso, fecha: ahora } },
    }
  );

  console.log(
    resultado.modifiedCount
      ? `Curso 2 -> ${acceso}`
      : `El curso 2 ya estaba ${acceso}`
  );
}

async function crearPostulantePrueba() {
  try {
    await conectarDB();

    // 1. Empresa y puesto
    const empresa = await Empresa.findOneAndUpdate(
      { correo: "pruebas-rutas@example.com" },
      {
        $setOnInsert: {
          nombre: "Empresa Demo LUWI",
          sector: "Tecnología",
          correo: "pruebas-rutas@example.com",
          password: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
        },
      },
      UPSERT
    );

    const puesto = await Puesto.findOneAndUpdate(
      { titulo: "Asistente administrativo de prueba", empresa: empresa._id },
      {
        $setOnInsert: {
          titulo: "Asistente administrativo de prueba",
          empresa: empresa._id,
          descripcion: "Apoyo en tareas administrativas y de oficina.",
          requisitos: "Manejo básico de computadora y buena comunicación.",
        },
      },
      UPSERT
    );

    await Empresa.updateOne(
      { _id: empresa._id },
      { $addToSet: { puestos: puesto._id } }
    );

    // 2. Cursos con unidades
    const curso1 = await prepararCurso(CURSOS[0]);
    const curso2 = await prepararCurso(CURSOS[1]);

    // 3. Ruta
    const ruta = await RutaAprendizaje.findOneAndUpdate(
      { nombre: "Ruta de incorporación - Demo LUWI", puesto: puesto._id },
      {
        $setOnInsert: {
          nombre: "Ruta de incorporación - Demo LUWI",
          descripcion:
            "Cursos para los primeros días del asistente administrativo.",
          puesto: puesto._id,
          cursos: [curso1._id, curso2._id],
        },
      },
      UPSERT
    );

    // 4. Usuario postulante + candidato
    const passwordHash = await bcrypt.hash(PASSWORD_POSTULANTE, 10);
    let usuario = await User.findOneAndUpdate(
      { email: CORREO_POSTULANTE },
      {
        $setOnInsert: { username: "Postulante Prueba", email: CORREO_POSTULANTE },
        // El usuario cumple con los dos modelos que conviven en develop:
        //   rol + estadoCuenta  -> mi-formacion (Marlon) y asignaciones (Naomi)
        //   role + cuentaActiva + empresa -> login y sesión (Wala); su login exige empresa
        $set: {
          password: passwordHash,
          rol: "POSTULANTE",
          estadoCuenta: "ACTIVA",
          role: "postulante",
          cuentaActiva: true,
          empresa: empresa._id,
        },
      },
      UPSERT
    );

    const candidato = await Candidato.findOneAndUpdate(
      { correo: CORREO_POSTULANTE },
      {
        $setOnInsert: { nombre: "Postulante Prueba", correo: CORREO_POSTULANTE },
        $set: { usuario: usuario._id },
        $addToSet: { puestosAplicados: puesto._id },
      },
      UPSERT
    );

    usuario = await User.findByIdAndUpdate(
      usuario._id,
      { $set: { candidato: candidato._id } },
      { returnDocument: "after" }
    );

    // 5. Proceso de formación vigente
    const proceso = await ProcesoFormacion.findOneAndUpdate(
      {
        candidato: candidato._id,
        puesto: puesto._id,
        estado: { $in: ["ACTIVO", "SUSPENDIDO"] },
      },
      { $setOnInsert: { empresa: empresa._id, estado: "ACTIVO" } },
      UPSERT
    );

    // 6. Asignación ACTIVA: curso 1 HABILITADO, curso 2 BLOQUEADO
    const ahora = new Date();
    const copiaCurso = (curso, orden, acceso) => ({
      curso: curso._id,
      titulo: curso.titulo,
      duracionHoras: curso.duracionHoras,
      nivel: curso.nivel,
      competencia: curso.competencia,
      orden,
      acceso,
      fechaCambioAcceso: ahora,
      historialAcceso: [{ acceso, fecha: ahora }],
    });

    const asignacion = await AsignacionRuta.findOneAndUpdate(
      { proceso: proceso._id, estado: "ACTIVA" },
      {
        $setOnInsert: {
          empresa: empresa._id,
          ruta: ruta._id,
          estructura: {
            nombre: ruta.nombre,
            descripcion: ruta.descripcion,
            puesto: puesto._id,
          },
          cursos: [
            copiaCurso(curso1, 1, "HABILITADO"),
            copiaCurso(curso2, 2, "BLOQUEADO"),
          ],
          fechaAsignacion: ahora,
        },
      },
      UPSERT
    );

    // 7. Opciones
    if (args.has("--habilitar"))
      await cambiarAccesoCurso2(asignacion, curso2, "HABILITADO");
    if (args.has("--bloquear"))
      await cambiarAccesoCurso2(asignacion, curso2, "BLOQUEADO");

    if (args.has("--suspender")) {
      await ProcesoFormacion.updateOne(
        { _id: proceso._id },
        { $set: { estado: "SUSPENDIDO", fechaSuspension: new Date() } }
      );
      console.log("Proceso -> SUSPENDIDO");
    }
    if (args.has("--activar")) {
      await ProcesoFormacion.updateOne(
        { _id: proceso._id },
        { $set: { estado: "ACTIVO" }, $unset: { fechaSuspension: "" } }
      );
      console.log("Proceso -> ACTIVO");
    }

    if (args.has("--reiniciar")) {
      const [progresos, consultas] = await Promise.all([
        ProgresoUnidad.deleteMany({ asignacion: asignacion._id }),
        UltimaConsulta.deleteMany({ asignacion: asignacion._id }),
      ]);
      console.log(
        `Avance reiniciado (${progresos.deletedCount} unidades revisadas y ${consultas.deletedCount} última consulta borradas)`
      );
    }

    // Resumen
    const final = await AsignacionRuta.findById(asignacion._id).lean();
    const procesoFinal = await ProcesoFormacion.findById(proceso._id).lean();

    console.log("\nPostulante de prueba listo.");
    console.log(`  Acceso:      ${CORREO_POSTULANTE} / ${PASSWORD_POSTULANTE}`);
    console.log(`  Proceso:     ${procesoFinal._id} (${procesoFinal.estado})`);
    console.log(`  Asignación:  ${final._id}`);
    for (const c of [...final.cursos].sort((a, b) => a.orden - b.orden)) {
      console.log(`  Curso ${c.orden}:     ${c._id} ${c.titulo} (${c.acceso})`);
    }
  } catch (error) {
    console.error("No se pudo preparar el postulante de prueba:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

crearPostulantePrueba();
