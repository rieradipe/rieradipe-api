import nodemailer from "nodemailer";

export function getTransporter() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
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
  const subject = '📬 ${asunto || "Nuevo contacto desde la web"}';

  const html = `
    <h2> Nuevo contacto desde la web </h2>
    <p><b>Nombre:</b> ${nombre || "-"}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Asunto:</b> ${asunto || "-"}</p>
    <p><b>Mensaje:</b></p>
    <pre style="white-space:pre-wrap">${mensaje}</pre>
    <hr/>
    <p>Contact #${contactId} - ThreadId #${threadId}</p>`;

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      subject,
      replyTo: email,
      html,
    });
    console.log(`📨 Correo enviado correctamente: ${info.messageId}`);

    return info;
  } catch (error) {
    console.log("❌ Error al enviar el correo: ", error);
    throw new Error("No se ha podido enviar el correo");
  }
}
