import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

try {
  await transporter.verify();
  console.log("Conexión con Gmail exitosa.");
} catch (error) {
  console.error("Error al conectar con Gmail:", error.message);
  process.exitCode = 1;
}
