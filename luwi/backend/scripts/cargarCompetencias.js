import dotenv from "dotenv";
import mongoose from "mongoose";
import conectarDB from "../src/config/db.js";
import Competencia from "../src/models/Competencia.js";

dotenv.config();

const COMPETENCIAS = [
  // Técnicas
  { nombre: "Programación web", categoria: "TECNICA", descripcion: "Desarrollo de sitios y aplicaciones web (HTML, CSS, JavaScript y frameworks)." },
  { nombre: "Bases de datos", categoria: "TECNICA", descripcion: "Diseño, consulta y administración de bases de datos." },
  { nombre: "Excel y ofimática", categoria: "TECNICA", descripcion: "Uso de hojas de cálculo, procesadores de texto y presentaciones." },
  { nombre: "Contabilidad básica", categoria: "TECNICA", descripcion: "Registro de operaciones, balances y conceptos contables esenciales." },
  { nombre: "Ventas", categoria: "TECNICA", descripcion: "Técnicas de prospección, negociación y cierre de ventas." },
  { nombre: "Inglés", categoria: "TECNICA", descripcion: "Comunicación oral y escrita en inglés para el entorno laboral." },
  // Blandas
  { nombre: "Atención al cliente", categoria: "BLANDA", descripcion: "Trato, escucha y solución de necesidades de clientes." },
  { nombre: "Comunicación efectiva", categoria: "BLANDA", descripcion: "Expresar ideas con claridad y escuchar de forma activa." },
  { nombre: "Trabajo en equipo", categoria: "BLANDA", descripcion: "Colaborar con otros para lograr objetivos comunes." },
  { nombre: "Liderazgo", categoria: "BLANDA", descripcion: "Guiar, motivar y tomar decisiones con un grupo de personas." },
  { nombre: "Resolución de problemas", categoria: "BLANDA", descripcion: "Analizar situaciones y encontrar soluciones prácticas." },
  { nombre: "Gestión del tiempo", categoria: "BLANDA", descripcion: "Organizar tareas y prioridades para cumplir plazos." },
];

const cargar = async () => {
  try {
    await conectarDB();

    let creadas = 0;
    let existentes = 0;

    for (const comp of COMPETENCIAS) {
      // Busca ignorando mayúsculas y tildes (misma regla que el índice único)
      const yaExiste = await Competencia.findOne({ nombre: comp.nombre }).collation({
        locale: "es",
        strength: 1,
      });

      if (yaExiste) {
        existentes++;
        continue;
      }

      await Competencia.create(comp);
      creadas++;
    }

    console.log(`Competencias creadas: ${creadas}`);
    console.log(`Competencias que ya existían: ${existentes}`);
  } catch (error) {
    console.error("Error al cargar competencias:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

cargar();