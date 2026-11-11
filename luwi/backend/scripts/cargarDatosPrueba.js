import dotenv from "dotenv";
import mongoose from "mongoose";

import conectarDB from "../src/config/db.js";
import Empresa from "../src/models/Empresa.js";
import Puesto from "../src/models/Puesto.js";
import Curso from "../src/models/Curso.js";
import RutaAprendizaje from "../src/models/RutaAprendizaje.js";

dotenv.config();

// Busca el registro; si no existe, lo crea (así se puede ejecutar varias veces sin duplicar).
async function obtenerOCrear(Modelo, filtro, datos, etiqueta) {
  let doc = await Modelo.findOne(filtro);
  if (!doc) {
    doc = await Modelo.create({ ...filtro, ...datos });
    console.log(`  + creado: ${etiqueta}`);
  } else {
    console.log(`  = ya existía: ${etiqueta}`);
  }
  return doc;
}

async function cargarDatosPrueba() {
  try {
    await conectarDB();

    // 1. Empresas
    console.log("Empresas:");
    const demo = await obtenerOCrear(
      Empresa,
      { correo: "pruebas-rutas@example.com" },
      { nombre: "Empresa Demo LUWI", sector: "Tecnología" },
      "Empresa Demo LUWI"
    );
    const banco = await obtenerOCrear(
      Empresa,
      { correo: "contacto@bancohorizonte.example.com" },
      { nombre: "Banco Horizonte", sector: "Finanzas" },
      "Banco Horizonte"
    );
    const logistica = await obtenerOCrear(
      Empresa,
      { correo: "rrhh@logisticacaribe.example.com" },
      { nombre: "Logística Caribe", sector: "Logística" },
      "Logística Caribe"
    );
    // Sin puestos: sirve para probar que una empresa sin relaciones sí se puede eliminar.
    await obtenerOCrear(
      Empresa,
      { correo: "empleo@comercialsol.example.com" },
      { nombre: "Comercial Sol", sector: "Comercio" },
      "Comercial Sol (sin puestos)"
    );

    // La empresa demo de Juan Luis se creó con una contraseña aleatoria: se elimina.
    await Empresa.updateOne({ correo: demo.correo }, { $unset: { password: "" } });

    // 2. Puestos
    console.log("Puestos:");
    const puestosDatos = [
      {
        empresa: demo,
        titulo: "Desarrollador frontend de prueba",
        descripcion: "Desarrollo de interfaces web con React.",
        requisitos: "Conocimientos básicos de HTML, CSS y JavaScript.",
      },
      {
        empresa: demo,
        titulo: "Desarrollador backend junior",
        descripcion: "Creación de servicios y APIs con Node.js y Express.",
        requisitos: "JavaScript, nociones de bases de datos y trabajo en equipo.",
      },
      {
        empresa: banco,
        titulo: "Analista de datos junior",
        descripcion: "Preparación de reportes y análisis de información financiera.",
        requisitos: "Excel intermedio y razonamiento lógico.",
      },
      {
        empresa: logistica,
        titulo: "Asistente administrativo",
        descripcion: "Apoyo en gestión documental y atención interna.",
        requisitos: "Buena comunicación y manejo básico de oficina.",
      },
    ];

    const puestos = {};
    for (const p of puestosDatos) {
      const doc = await obtenerOCrear(
        Puesto,
        { titulo: p.titulo, empresa: p.empresa._id },
        { descripcion: p.descripcion, requisitos: p.requisitos },
        p.titulo
      );
      puestos[p.titulo] = doc;
      // Mantiene la lista de puestos dentro de la empresa.
      await Empresa.updateOne(
        { _id: p.empresa._id },
        { $addToSet: { puestos: doc._id } }
      );
    }

    // 3. Cursos
    console.log("Cursos:");
    const cursosDatos = [
      {
        titulo: "JavaScript básico - Demo LUWI",
        descripcion: "Variables, funciones y arreglos en JavaScript.",
        competencia: "JavaScript",
        duracionHoras: 6,
        nivel: "básico",
        enlace: "https://example.com/cursos/javascript-basico",
      },
      {
        titulo: "Introducción a React - Demo LUWI",
        descripcion: "Componentes, propiedades y estado en React.",
        competencia: "React",
        duracionHoras: 8,
        nivel: "básico",
        enlace: "https://example.com/cursos/react-introduccion",
      },
      {
        titulo: "Bases de datos con MongoDB - Demo LUWI",
        descripcion: "Colecciones, documentos y consultas básicas en MongoDB.",
        competencia: "MongoDB",
        duracionHoras: 5,
        nivel: "intermedio",
        enlace: "https://example.com/cursos/mongodb",
      },
      {
        titulo: "Excel para análisis de datos - Demo LUWI",
        descripcion: "Fórmulas, tablas dinámicas y gráficos para reportes.",
        competencia: "Excel",
        duracionHoras: 10,
        nivel: "intermedio",
        enlace: "https://example.com/cursos/excel-analisis",
      },
      // Fuera de toda ruta: sirve para probar que un curso libre sí se puede eliminar.
      {
        titulo: "Servicio al cliente - Demo LUWI",
        descripcion: "Técnicas de comunicación y manejo de quejas.",
        competencia: "Comunicación",
        duracionHoras: 4,
        nivel: "básico",
        enlace: "https://example.com/cursos/servicio-cliente",
      },
    ];

    const cursos = {};
    for (const c of cursosDatos) {
      const { titulo, ...resto } = c;
      cursos[titulo] = await obtenerOCrear(Curso, { titulo }, resto, titulo);
    }

    // Los cursos demo creados antes de que existiera "enlace" quedan sin ese campo.
    await Curso.updateMany(
      { titulo: /Demo LUWI$/, enlace: { $exists: false } },
      { $set: { enlace: "https://example.com/cursos/demo" } }
    );

    // 4. Rutas de aprendizaje (el orden del arreglo es el orden de los cursos)
    console.log("Rutas de aprendizaje:");
    await obtenerOCrear(
      RutaAprendizaje,
      { nombre: "Ruta frontend junior - Demo LUWI" },
      {
        descripcion: "Recorrido para formar desarrolladores frontend.",
        puesto: puestos["Desarrollador frontend de prueba"]._id,
        cursos: [
          cursos["JavaScript básico - Demo LUWI"]._id,
          cursos["Introducción a React - Demo LUWI"]._id,
        ],
      },
      "Ruta frontend junior"
    );
    await obtenerOCrear(
      RutaAprendizaje,
      { nombre: "Ruta analista de datos - Demo LUWI" },
      {
        descripcion: "Recorrido para formar analistas de datos junior.",
        puesto: puestos["Analista de datos junior"]._id,
        cursos: [
          cursos["Excel para análisis de datos - Demo LUWI"]._id,
          cursos["Bases de datos con MongoDB - Demo LUWI"]._id,
        ],
      },
      "Ruta analista de datos"
    );

    const [e, p, c, r] = await Promise.all([
      Empresa.countDocuments(),
      Puesto.countDocuments(),
      Curso.countDocuments(),
      RutaAprendizaje.countDocuments(),
    ]);
    console.log(`Totales en la base -> empresas: ${e}, puestos: ${p}, cursos: ${c}, rutas: ${r}`);
    console.log("Datos de prueba listos.");
  } catch (error) {
    console.error("No se pudieron cargar los datos:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

cargarDatosPrueba();