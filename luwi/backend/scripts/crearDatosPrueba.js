import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

import conectarDB from "../src/config/db.js";
import Empresa from "../src/models/Empresa.js";
import Puesto from "../src/models/Puesto.js";
import Curso from "../src/models/Curso.js";

dotenv.config();

async function crearDatosPrueba() {
  try {
    await conectarDB();

    // Solo se utiliza al crear la empresa ficticia.
    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString("hex"),
      10
    );

    const empresa = await Empresa.findOneAndUpdate(
      { correo: "pruebas-rutas@example.com" },
      {
        $setOnInsert: {
          nombre: "Empresa Demo LUWI",
          sector: "Tecnología",
          correo: "pruebas-rutas@example.com",
          password: passwordHash,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    const puesto = await Puesto.findOneAndUpdate(
      {
        titulo: "Desarrollador frontend de prueba",
        empresa: empresa._id,
      },
      {
        $setOnInsert: {
          titulo: "Desarrollador frontend de prueba",
          empresa: empresa._id,
          descripcion: "Desarrollo de interfaces web con React.",
          requisitos: "Conocimientos básicos de HTML, CSS y JavaScript.",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    // Mantiene también la relación que ya tiene el modelo Empresa.
    await Empresa.updateOne(
      { _id: empresa._id },
      { $addToSet: { puestos: puesto._id } }
    );

    const cursosPrueba = [
      {
        titulo: "JavaScript básico - Demo LUWI",
        descripcion: "Variables, funciones y arreglos en JavaScript.",
        competencia: "JavaScript",
        duracionHoras: 6,
        nivel: "básico",
      },
      {
        titulo: "Introducción a React - Demo LUWI",
        descripcion: "Componentes, propiedades y estado en React.",
        competencia: "React",
        duracionHoras: 8,
        nivel: "básico",
      },
    ];

    for (const curso of cursosPrueba) {
      await Curso.findOneAndUpdate(
        { titulo: curso.titulo },
        { $setOnInsert: curso },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    }

    console.log("Datos de prueba preparados correctamente.");
    console.log("Empresa: Empresa Demo LUWI");
    console.log("Puesto: Desarrollador frontend de prueba");
    console.log("Cursos: JavaScript y React");
  } catch (error) {
    console.error("No se pudieron preparar los datos:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

crearDatosPrueba();