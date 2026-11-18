import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User, { ROLES } from "../src/models/user.model.js";

const createAdmin = async () => {
  try {
    const { MONGO_URI, ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } =
      process.env;

    if (!MONGO_URI || !ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "Faltan variables de entorno para crear el administrador.",
      );
    }

    if (
      ADMIN_PASSWORD.length < 8 ||
      !/[A-Z]/.test(ADMIN_PASSWORD) ||
      !/[a-z]/.test(ADMIN_PASSWORD) ||
      !/[0-9]/.test(ADMIN_PASSWORD)
    ) {
      throw new Error("La contraseña no cumple las reglas de seguridad.");
    }

    await mongoose.connect(MONGO_URI);

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log(
        "Ya existe un usuario con ese correo. No se realizaron cambios.",
      );
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.create({
      username: ADMIN_USERNAME.trim(),
      email,
      password: passwordHash,
      role: ROLES[0], // "ADMIN"
      empresa: null,
    });

    console.log("Administrador general creado correctamente.");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
