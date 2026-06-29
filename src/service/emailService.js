import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ✨ FIRMA HTML (mejorada con enlaces clicables)
const firmaHTML = `
<div dir="ltr">
  <table cellpadding="0" cellspacing="0" style="font-family:sans-serif;color:#212121;padding:10px">
    <tbody>
      <tr>
        <td style="padding-right:20px;vertical-align:top">
          <img src="https://i.imgur.com/gu0mLBz.png" alt="Logo RieraDipe" width="90" height="90" style="border-radius:8px">
        </td>
        <td style="vertical-align:top">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:10px">
            <tbody>
              <tr>
                <td style="font-weight:bold;font-size:18px;color:#bf673a;line-height:1.2;border-bottom:3px solid #423636;padding-bottom:2px">
                  Alba Riera
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;font-weight:600;color:#423636;padding-top:5px">
                  Fundadora & Desarrolladora – RieraDipe
                </td>
              </tr>
            </tbody>
          </table>

          <table cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.4;text-align:center">
            <tbody>
              <tr>
                <td style="padding-right:20px">
                  📧 
                  <a href="mailto:contacto@rieradipe.dev" style="color:#423636;text-decoration:none">
                    contacto@rieradipe.dev
                  </a>
                </td>
                <td style="padding-left:20px">
                  📞 
                  <a href="tel:+34632193202" style="color:#423636;text-decoration:none">
                    632193202
                  </a>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:5px">
                  🌐 
                  <a href="https://rieradipe.dev" style="color:#423636;text-decoration:none" target="_blank">
                    rieradipe.dev
                  </a>
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

// 📩 EMAIL AL ADMIN
// 📩 EMAIL AL ADMIN
export const sendContactMail = async ({ nombre, email, asunto, mensaje }) => {
  const htmlContent = `
    ${firmaHTML}
    <hr>
    <p><strong>Nuevo mensaje desde la web</strong></p>
    <p><strong>Nombre:</strong> ${nombre}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Asunto:</strong> ${asunto}</p>
    <p><strong>Mensaje:</strong><br>${mensaje}</p>
  `;

  const result = await resend.emails.send({
    from: `RieraDipe <${process.env.CONTACT_FROM_EMAIL}>`,
    to: [process.env.CONTACT_TO_EMAIL],
    reply_to: email,
    subject: `[Contacto] ${asunto}`,
    html: htmlContent,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
};

// 🤖 AUTO-REPLY AL USUARIO
export const sendAutoReply = async ({ nombre, email }) => {
  const htmlContent = `
    ${firmaHTML}
    <hr>
    <p>Hola ${nombre},</p>
    <p>Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
    <p>Un saludo,<br/>Equipo RieraDipe</p>
  `;

  const result = await resend.emails.send({
    from: `RieraDipe <${process.env.CONTACT_FROM_EMAIL}>`,
    to: [email],
    subject: "Hemos recibido tu mensaje",
    html: htmlContent,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
};
