// src/service/emailService.js
import nodemailer from "nodemailer";

// Transportador configurado con tus variables de entorno
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Tu firma HTML
const firmaHTML = `
<div dir="ltr">
  <table cellpadding="0" cellspacing="0" style="font-family:sans-serif;color:rgb(33,33,33);padding:10px">
    <tbody>
      <tr>
        <td style="padding-right:20px;vertical-align:top">
          <img src="https://i.imgur.com/gu0mLBz.png" alt="Logo" width="90" height="90" style="border-radius:8px">
        </td>
        <td style="vertical-align:top">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:10px">
            <tbody>
              <tr>
                <td style="font-weight:bold;font-size:18px;color:rgb(191,103,58);line-height:1.2;border-bottom:3px solid rgb(66,54,54);padding-bottom:2px">
                  Alba Riera
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;font-weight:600;color:rgb(66,54,54);padding-top:5px">
                  Fundadora &amp; Desarrolladora – RieraDipe
                </td>
              </tr>
            </tbody>
          </table>
          <table cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.4;text-align:center">
            <tbody>
              <tr>
                <td style="padding-right:20px">
                  📧 <a href="mailto:rieradipe@gmail.com" style="color:rgb(66,54,54)" target="_blank">rieradipe@gmail.com</a>
                </td>
                <td style="padding-left:20px">
                  📞 <span style="color:rgb(66,54,54)">632193202</span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:5px">
                  🌐 <span style="color:rgb(66,54,54)">Próximamente</span>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</div>
`;

// Enviar correo al admin
export const sendContactMail = async ({
  nombre,
  email,
  asunto,
  mensaje,
  contactId,
  threadId,
}) => {
  const htmlContent = `
  ${firmaHTML}
  <hr>
    <p>Nuevo mensaje de contacto recibido:</p>
    <p><strong>Nombre:</strong> ${nombre}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Asunto:</strong> ${asunto}</p>
    <p><strong>Mensaje:</strong><br>${mensaje}</p>
  `;

  const info = await transporter.sendMail({
    from: `"RieraDipe" <${process.env.SMTP_USER}>`,
    to: process.env.MAIL_TO,
    subject: `[Contacto] ${asunto}`,
    html: htmlContent,
  });

  return info;
};

// Auto-reply al usuario
export const sendAutoReply = async ({ nombre, email }) => {
  const htmlContent = `
  ${firmaHTML}
  </hr>
    <p>Hola ${nombre},</p>
    <p>Gracias por contactarnos. Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.</p>
    <p>Mientras tanto, puedes visitar nuestra web para más información.</p>
    
  `;

  const info = await transporter.sendMail({
    from: `"RieraDipe" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Hemos recibido tu mensaje",
    html: htmlContent,
  });

  return info;
};
