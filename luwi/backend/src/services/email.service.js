import nodemailer from "nodemailer";

export const enviarCorreoActivacion = async ({ correo, nombre, token }) => {
  const { EMAIL_USER, EMAIL_APP_PASSWORD, FRONTEND_URL } = process.env;

  if (!EMAIL_USER || !EMAIL_APP_PASSWORD || !FRONTEND_URL) {
    throw new Error("Faltan variables de entorno para enviar correos.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });

  const enlace = new URL("/activar-cuenta", FRONTEND_URL);
  enlace.searchParams.set("token", token);

  await transporter.sendMail({
    from: `"LUWI" <${EMAIL_USER}>`,
    to: correo,
    subject: "Activa tu cuenta de LUWI",
    text: `Hola ${nombre},

Has sido registrado en LUWI por Recursos Humanos.

Para activar tu cuenta y establecer tu contraseña, visita:

${enlace.toString()}

Este enlace vence en 24 horas.

Equipo LUWI`,
  });
};
