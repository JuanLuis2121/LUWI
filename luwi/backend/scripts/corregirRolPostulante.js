import dotenv from "dotenv";
import mongoose from "mongoose";
import conectarDB from "../src/config/db.js";
import User from "../src/models/user.model.js";

dotenv.config();

async function corregirRolPostulante() {
  try {
    if (!process.env.MONGO_URI) {
      console.log(
        "No se encontró MONGO_URI. Ejecuta este script desde backend."
      );
      return;
    }

    await conectarDB();

    const resultado = await User.collection.updateOne(
      {
        email: "postulante.prueba@luwi.test",
        role: "postulante",
        rol: "POSTULANTE",
      },
      {
        $set: {
          role: "POSTULANTE",
        },
      }
    );

    if (resultado.modifiedCount === 1) {
      console.log("Corrección realizada: role ahora es POSTULANTE.");
    } else {
      console.log(
        "No se modificó ninguna cuenta. Puede estar corregida o sus datos cambiaron."
      );
    }

    const usuario = await User.collection.findOne(
      { email: "postulante.prueba@luwi.test" },
      {
        projection: {
          _id: 0,
          role: 1,
          rol: 1,
          empresa: 1,
          estadoCuenta: 1,
        },
      }
    );

    console.log("Datos actuales:");
    console.log(JSON.stringify(usuario, null, 2));
  } catch (error) {
    const mensaje = String(error.message ?? "Error desconocido")
      .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[CONEXIÓN OCULTA]");

    console.error("No se pudo completar la corrección:", mensaje);
  } finally {
    await mongoose.disconnect();
  }
}

corregirRolPostulante();