import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import conectarDB from "../src/config/db.js";
import Empresa from "../src/models/Empresa.js";
import Puesto from "../src/models/Puesto.js";
import Curso from "../src/models/Curso.js";
import RutaAprendizaje from "../src/models/RutaAprendizaje.js";
import User from "../src/models/user.model.js";
import Candidato from "../src/models/Candidato.js";
import ProcesoFormacion from "../src/models/ProcesoFormacion.js";
import Competencia from "../src/models/Competencia.js";

dotenv.config();

const PASSWORD_PRUEBA = "Prueba12345";

// Busca por filtro; si no existe, lo crea con filtro + datos
const obtenerOCrear = async (Modelo, filtro, datos = {}) => {
  const existente = await Modelo.findOne(filtro);
  if (existente) return existente;
  return Modelo.create({ ...filtro, ...datos });
};

const idsCompetencias = async (...nombres) => {
  const docs = await Competencia.find({ nombre: { $in: nombres } }).select("_id");
  return docs.map((d) => d._id);
};

const unidadesEjemplo = (tema) => [
  {
    titulo: `Introducción a ${tema}`,
    tipo: "TEXTO",
    contenido: `Texto de ejemplo sobre ${tema}. Contenido ficticio para pruebas.`,
    obligatoria: true,
    orden: 1,
  },
  {
    titulo: `Video de apoyo de ${tema}`,
    tipo: "VIDEO",
    recursoUrl: "https://example.com/video-prueba",
    obligatoria: true,
    orden: 2,
  },
  {
    titulo: `Lectura opcional de ${tema}`,
    tipo: "ENLACE",
    recursoUrl: "https://example.com/lectura-prueba",
    obligatoria: false,
    orden: 3,
  },
];

const crearCurso = async ({ titulo, competencia, horas, empresa, estado, competencias }) =>
  obtenerOCrear(
    Curso,
    { titulo },
    {
      descripcion: `Curso ficticio de ${competencia} para pruebas de la entrega 4.`,
      competencia,
      duracionHoras: horas,
      nivel: "básico",
      competencias,
      empresa: empresa ?? null,
      estado,
      fechaPublicacion: estado === "PUBLICADO" ? new Date() : undefined,
      unidades: unidadesEjemplo(competencia),
    },
  );

const crearRuta = async ({ nombre, puesto, cursos }) =>
  obtenerOCrear(
    RutaAprendizaje,
    { nombre },
    {
      descripcion: `Ruta ficticia: ${nombre}.`,
      puesto: puesto._id,
      cursos: cursos.map((c) => c._id),
    },
  );

const crearPostulante = async ({ nombre, correo, empresa, puesto, rrhh }) => {
  const candidato = await obtenerOCrear(Candidato, { correo }, { nombre });

  const usuario = await obtenerOCrear(
    User,
    { email: correo },
    {
      username: nombre,
      rol: "POSTULANTE",
      estadoCuenta: "PENDIENTE",
      candidato: candidato._id,
    },
  );

  if (!candidato.usuario) {
    candidato.usuario = usuario._id;
    await candidato.save();
  }

  const proceso = await obtenerOCrear(
    ProcesoFormacion,
    { candidato: candidato._id, puesto: puesto._id, estado: "ACTIVO" },
    { empresa: empresa._id, creadoPor: rrhh._id },
  );

  return proceso;
};

const cargar = async () => {
  try {
    await conectarDB();

    const hash = await bcrypt.hash(PASSWORD_PRUEBA, 10);

    // Empresas
    const alfa = await obtenerOCrear(
      Empresa,
      { correo: "contacto@alfa-prueba.luwi.test" },
      { nombre: "Alfa Tech (prueba)", sector: "Tecnología" },
    );
    const beta = await obtenerOCrear(
      Empresa,
      { correo: "contacto@beta-prueba.luwi.test" },
      { nombre: "Beta Servicios (prueba)", sector: "Servicios" },
    );

    // Puestos
    const puestoAlfa = await obtenerOCrear(
      Puesto,
      { titulo: "Desarrollador Web (prueba)", empresa: alfa._id },
      {
        descripcion: "Puesto ficticio para pruebas de la entrega 4.",
        requisitos: "Requisitos ficticios para pruebas.",
        competencias: await idsCompetencias("Programación web", "Trabajo en equipo"),
      },
    );
    const puestoBeta = await obtenerOCrear(
      Puesto,
      { titulo: "Asesor de Ventas (prueba)", empresa: beta._id },
      {
        descripcion: "Puesto ficticio para pruebas de la entrega 4.",
        requisitos: "Requisitos ficticios para pruebas.",
        competencias: await idsCompetencias("Ventas", "Atención al cliente"),
      },
    );
    await Empresa.updateOne({ _id: alfa._id }, { $addToSet: { puestos: puestoAlfa._id } });
    await Empresa.updateOne({ _id: beta._id }, { $addToSet: { puestos: puestoBeta._id } });

    // Usuarios de RR. HH. (uno por empresa)
    const rrhhAlfa = await obtenerOCrear(
      User,
      { email: "rrhh.alfa@luwi.test" },
      { username: "RRHH Alfa (prueba)", password: hash, rol: "RRHH", empresa: alfa._id, estadoCuenta: "ACTIVA" },
    );
    const rrhhBeta = await obtenerOCrear(
      User,
      { email: "rrhh.beta@luwi.test" },
      { username: "RRHH Beta (prueba)", password: hash, rol: "RRHH", empresa: beta._id, estadoCuenta: "ACTIVA" },
    );

    // Cursos
    const cursoGlobal = await crearCurso({
      titulo: "Comunicación efectiva (prueba, global)",
      competencia: "Comunicación efectiva",
      horas: 4,
      estado: "PUBLICADO",
      competencias: await idsCompetencias("Comunicación efectiva"),
    });
    const cursoAlfa = await crearCurso({
      titulo: "Programación web básica (prueba, Alfa)",
      competencia: "Programación web",
      horas: 10,
      empresa: alfa._id,
      estado: "PUBLICADO",
      competencias: await idsCompetencias("Programación web"),
    });
    const cursoBeta = await crearCurso({
      titulo: "Técnicas de venta (prueba, Beta)",
      competencia: "Ventas",
      horas: 6,
      empresa: beta._id,
      estado: "PUBLICADO",
      competencias: await idsCompetencias("Ventas"),
    });
    const cursoBorrador = await crearCurso({
      titulo: "Curso en borrador (prueba, Alfa)",
      competencia: "Bases de datos",
      horas: 5,
      empresa: alfa._id,
      estado: "BORRADOR",
      competencias: await idsCompetencias("Bases de datos"),
    });

    // Rutas
    const rutaAlfa = await crearRuta({
      nombre: "Ruta Desarrollador Web (prueba)",
      puesto: puestoAlfa,
      cursos: [cursoGlobal, cursoAlfa],
    });
    const rutaAlfa2 = await crearRuta({
      nombre: "Ruta Desarrollador Web corta (prueba)",
      puesto: puestoAlfa,
      cursos: [cursoGlobal],
    });
    const rutaBeta = await crearRuta({
      nombre: "Ruta Asesor de Ventas (prueba)",
      puesto: puestoBeta,
      cursos: [cursoGlobal, cursoBeta],
    });
    const rutaConBorrador = await crearRuta({
      nombre: "Ruta con curso en borrador (prueba)",
      puesto: puestoAlfa,
      cursos: [cursoGlobal, cursoBorrador],
    });

    // Postulantes y procesos
    const procesoAna = await crearPostulante({
      nombre: "Ana Prueba",
      correo: "ana.prueba@luwi.test",
      empresa: alfa,
      puesto: puestoAlfa,
      rrhh: rrhhAlfa,
    });
    const procesoLuis = await crearPostulante({
      nombre: "Luis Prueba",
      correo: "luis.prueba@luwi.test",
      empresa: beta,
      puesto: puestoBeta,
      rrhh: rrhhBeta,
    });

    console.log("\n=== DATOS DE PRUEBA LISTOS ===");
    console.log(`Contraseña de los usuarios RR. HH.: ${PASSWORD_PRUEBA}`);
    console.log(`RRHH Alfa:  rrhh.alfa@luwi.test`);
    console.log(`RRHH Beta:  rrhh.beta@luwi.test`);
    console.log("\nProcesos de formación:");
    console.log(`  Ana (Alfa)  procesoId: ${procesoAna._id}`);
    console.log(`  Luis (Beta) procesoId: ${procesoLuis._id}`);
    console.log("\nRutas:");
    console.log(`  Alfa válida:            ${rutaAlfa._id}`);
    console.log(`  Alfa corta (reemplazo): ${rutaAlfa2._id}`);
    console.log(`  Beta (incompatible con Ana): ${rutaBeta._id}`);
    console.log(`  Alfa con curso borrador: ${rutaConBorrador._id}`);
  } catch (error) {
    console.error("Error al cargar los datos de asignación:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

cargar();