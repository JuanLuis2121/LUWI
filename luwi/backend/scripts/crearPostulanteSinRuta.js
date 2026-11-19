// Postulante de prueba SIN ruta asignada, para probar desde la ficha:
// asignar ruta, habilitar y bloquear capacitaciones.
// Usa la empresa, el puesto y el usuario RR. HH. de cargarDatosAsignacion.js (córrelo antes).
//
//   npm run seed:sin-ruta               -> crea o revisa la postulante
//   npm run seed:sin-ruta -- --reiniciar -> le quita la ruta y el avance para repetir la prueba
//
// Acceso de RR. HH.: rrhh.alfa@luwi.test / Prueba12345
import dotenv from "dotenv";
import mongoose from "mongoose";

import conectarDB from "../src/config/db.js";
import Empresa from "../src/models/Empresa.js";
import Puesto from "../src/models/Puesto.js";
import User from "../src/models/user.model.js";
import Candidato from "../src/models/Candidato.js";
import ProcesoFormacion from "../src/models/ProcesoFormacion.js";
import AsignacionRuta from "../src/models/AsignacionRuta.js";
import ProgresoUnidad from "../src/models/ProgresoUnidad.js";
import UltimaConsulta from "../src/models/UltimaConsulta.js";

dotenv.config();

const CORREO = "carla.prueba@luwi.test";
const NOMBRE = "Carla Prueba";
const UPSERT = { upsert: true, returnDocument: "after", runValidators: true };

async function crear() {
  try {
    await conectarDB();

    const empresa = await Empresa.findOne({ correo: "contacto@alfa-prueba.luwi.test" });
    const puesto = empresa && (await Puesto.findOne({ titulo: "Desarrollador Web (prueba)", empresa: empresa._id }));
    const rrhh = await User.findOne({ email: "rrhh.alfa@luwi.test" });
    if (!empresa || !puesto || !rrhh) {
      throw new Error("Faltan los datos de Alfa. Corre primero: node scripts/cargarDatosAsignacion.js");
    }

    const candidato = await Candidato.findOneAndUpdate(
      { correo: CORREO },
      { $setOnInsert: { nombre: NOMBRE, correo: CORREO }, $addToSet: { puestosAplicados: puesto._id } },
      UPSERT
    );

    // Cuenta PENDIENTE: la postulante todavía no activa su invitación
    const usuario = await User.findOneAndUpdate(
      { email: CORREO },
      {
        $setOnInsert: {
          username: NOMBRE,
          email: CORREO,
          rol: "POSTULANTE",
          estadoCuenta: "PENDIENTE",
          candidato: candidato._id,
        },
      },
      UPSERT
    );
    if (!candidato.usuario) await Candidato.updateOne({ _id: candidato._id }, { usuario: usuario._id });

    const proceso = await ProcesoFormacion.findOneAndUpdate(
      { candidato: candidato._id, puesto: puesto._id, estado: { $in: ["ACTIVO", "SUSPENDIDO"] } },
      { $setOnInsert: { empresa: empresa._id, estado: "ACTIVO", creadoPor: rrhh._id } },
      UPSERT
    );

    if (process.argv.includes("--reiniciar")) {
      const asignaciones = await AsignacionRuta.find({ proceso: proceso._id }).select("_id");
      const ids = asignaciones.map((a) => a._id);
      await Promise.all([
        ProgresoUnidad.deleteMany({ asignacion: { $in: ids } }),
        UltimaConsulta.deleteMany({ asignacion: { $in: ids } }),
        AsignacionRuta.deleteMany({ _id: { $in: ids } }),
      ]);
      if (proceso.estado !== "ACTIVO") {
        await ProcesoFormacion.updateOne({ _id: proceso._id }, { estado: "ACTIVO", $unset: { fechaSuspension: "" } });
      }
      console.log(`Reiniciado: se quitaron ${ids.length} asignaciones de ${NOMBRE}.`);
    }

    const tieneRuta = await AsignacionRuta.exists({ proceso: proceso._id, estado: "ACTIVA" });

    console.log(`\n${NOMBRE} lista (${tieneRuta ? "con ruta asignada" : "sin ruta asignada"}).`);
    console.log(`  Puesto:     ${puesto.titulo} (${empresa.nombre})`);
    console.log(`  procesoId:  ${proceso._id}`);
    console.log(`  Ficha:      http://localhost:5173/dashboard/postulantes/${proceso._id}`);
    console.log("  Entra como: rrhh.alfa@luwi.test / Prueba12345");
  } catch (error) {
    console.error("No se pudo preparar la postulante:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

crear();
