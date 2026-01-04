import db from "../../db.js";
import { sendContactMail, sendAutoReply } from "../service/emailService.js";

// Crear contacto + hilo + nota
export const createContactWithThreadAndNote = async (req, res) => {
  const { name, email, phone, source, subject, message } = req.body;

  console.log("📥 Contact recibido:", req.body);

  // Validación mínima
  if (!email || !subject || !message) {
    return res.status(400).json({
      error: "Faltan datos obligatorios",
    });
  }

  try {
    // 1️⃣ Buscar o crear contacto
    let contact = db
      .prepare("SELECT id FROM contacts WHERE email = ? LIMIT 1")
      .get(email);

    let contactId;

    if (!contact) {
      const info = db
        .prepare(
          "INSERT INTO contacts (name, email, phone, source) VALUES (?, ?, ?, ?)"
        )
        .run(name ?? null, email, phone ?? null, source ?? "web");

      contactId = info.lastInsertRowid;
      console.log("➕ Contacto creado:", contactId);
    } else {
      contactId = contact.id;
      console.log("✅ Contacto existente:", contactId);
    }

    // 2️⃣ Crear hilo
    const threadInfo = db
      .prepare(
        "INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)"
      )
      .run(contactId, subject, "open");

    const threadId = threadInfo.lastInsertRowid;

    // 3️⃣ Crear nota inicial
    db.prepare(
      "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    ).run(threadId, message, "inbound", "web");

    console.log("📝 Nota creada");

    // 4️⃣ Enviar correo al admin (NO bloqueante)
    try {
      await sendContactMail({
        nombre: name,
        email,
        asunto: subject,
        mensaje: message,
      });
    } catch (err) {
      console.warn("⚠️ Correo admin falló:", err.message);
    }

    // 5️⃣ Enviar auto-reply (NO bloqueante)
    try {
      await sendAutoReply({
        nombre: name,
        email,
      });
    } catch (err) {
      console.warn("⚠️ Auto-reply falló:", err.message);
    }

    // ✅ RESPUESTA FINAL SIEMPRE OK
    return res.status(201).json({
      success: true,
      message: "Contacto recibido correctamente",
      contactId,
      threadId,
    });
  } catch (err) {
    console.error("❌ Error creando contacto:", err);
    return res.status(500).json({
      error: "Error interno al guardar el contacto",
    });
  }
};
