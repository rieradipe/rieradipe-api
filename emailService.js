import nodemailer from "nodemailer";

export function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: false, // <— opcional para ver trazas
    debug: false, // <— opcional
  });
}

export async function sendContactMail({
  nombre,
  email,
  asunto,
  mensaje,
  contactId,
  threadId,
}) {
  const transporter = getTransporter();
  const subject = `📬 ${asunto || "Nuevo contacto desde la web"}`;

  const html = `
    <h2>Nuevo contacto desde la web</h2>
    <p><b>Nombre:</b> ${nombre || "-"}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Asunto:</b> ${asunto || "-"}</p>
    <p><b>Mensaje:</b></p>
    <pre style="white-space:pre-wrap">${mensaje}</pre>
    <hr/>
    <p>Contact #${contactId} - ThreadId #${threadId}</p>`;

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject,
    replyTo: email,
    html,
  });
  console.log(`📨 Admin mail -> ${info.messageId}`);
  return info;
}

export async function sendAutoReply({ nombre, email }) {
  const transporter = getTransporter();
  const subject = "📬 Gracias por contactar con RieraDiPe";
  const html = `
    <h2>¡Hola ${nombre || "amigo/a"}!</h2>
    <p>Hemos recibido tu mensaje y te responderemos en breve.</p>
    <p>Un saludo,<br/><b>Equipo RieraDiPe</b></p>
    <small>Este es un correo automático, no respondas a este email.</small>`;

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject,
    html,
  });
  console.log(`📤 Auto-reply -> ${info.messageId}`);
  return info;
}
