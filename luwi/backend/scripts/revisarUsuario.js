import dotenv from "dotenv";
import mongoose from "mongoose";
import conectarDB from "../src/config/db.js";
import User, { ROLES } from "../src/models/user.model.js";

dotenv.config();

async function revisarUsuario() {
  try {
    if (!process.env.MONGO_URI) {
      console.log(
        "No se encontró MONGO_URI. Ejecuta este script desde backend."
      );
      return;
    }

    await conectarDB();

    // Solo consulta los campos necesarios. No modifica la cuenta.
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

    if (!usuario) {
      console.log(
        "No se encontró la cuenta de prueba en la base configurada."
      );
      return;
    }

    console.log("Datos actuales de la cuenta:");
    console.log(JSON.stringify(usuario, null, 2));

    console.log("Roles admitidos:", ROLES.join(", "));

    console.log(
      "¿El campo role tiene un valor válido?",
      ROLES.includes(usuario.role) ? "Sí" : "No"
    );
  } catch (error) {
    const mensaje = String(error.message ?? "Error desconocido")
      .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[CONEXIÓN OCULTA]");

    console.error("No se pudo consultar la cuenta:", mensaje);
  } finally {
    await mongoose.disconnect();
  }
}

revisarUsuario();