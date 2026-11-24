import nodemailer from "nodemailer";

const mensajesPorRol = new Map([
  [
    "POSTULANTE",
    "Recursos Humanos te ha invitado a activar tu cuenta en LUWI.",
  ],
  ["ADMIN-EMPRESA", "Te invitamos a administrar tu empresa en LUWI."],
  [
    "RRHH",
    "Te invitamos a unirte al equipo de Recursos Humanos de tu empresa en LUWI.",
  ],
]);

export const enviarCorreoActivacion = async ({
  correo,
  nombre,
  token,
  rol = "POSTULANTE",
}) => {
  const { EMAIL_USER, EMAIL_APP_PASSWORD, FRONTEND_URL } = process.env;

  if (!EMAIL_USER || !EMAIL_APP_PASSWORD || !FRONTEND_URL) {
    throw new Error("Faltan variables de entorno para enviar correos.");
  }

  const mensaje = mensajesPorRol.get(rol);

  if (!mensaje) {
    throw new Error("El rol no admite invitaciones de activación.");
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

  const saludo = nombre ? `Hola ${nombre},` : "Hola,";

  await transporter.sendMail({
    from: `"LUWI" <${EMAIL_USER}>`,
    to: correo,
    subject: "Activa tu cuenta de LUWI",
    text: `${saludo}

${mensaje}

Abre este enlace para activar tu cuenta y crear tu contraseña:

${enlace.toString()}

El enlace es de un solo uso.

Equipo LUWI`,
  });
};
