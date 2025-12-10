import db from "../../db.js";
import { sendContactMail, sendAutoReply } from "../service/emailService.js";

// Crear contacto + hilo + nota y enviar correos
export const createContactWithThreadAndNote = async (req, res) => {
  const { name, email, phone, source, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    // 1️⃣ Buscar contacto existente
    let existing = db
      .prepare("SELECT id FROM contacts WHERE email = ? LIMIT 1")
      .get(email);

    let contactId;

    if (!existing) {
      // 2️⃣ Crear contacto si no existe
      const info = db
        .prepare(
          "INSERT INTO contacts (name, email, phone, source) VALUES (?, ?, ?, ?)"
        )
        .run(name ?? null, email, phone ?? null, source ?? "web");
      contactId = info.lastInsertRowid;
    } else {
      contactId = existing.id;
    }

    // 3️⃣ Crear hilo asociado
    const threadTitle = subject || "Contacto desde la web";
    const threadInfo = db
      .prepare(
        "INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)"
      )
      .run(contactId, threadTitle, "open");
    const threadId = threadInfo.lastInsertRowid;

    // 4️⃣ Crear nota inicial
    db.prepare(
      "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    ).run(threadId, message, "inbound", "web");

    // 5️⃣ Enviar correo al admin
    try {
      const infoAdmin = await sendContactMail({
        nombre: name,
        email,
        asunto: threadTitle,
        mensaje: message,
        contactId,
        threadId,
      });

      db.prepare(
        `
        INSERT INTO emails (contact_id, thread_id, direction, medium, subject, body, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        contactId,
        threadId,
        "outbound",
        "email",
        threadTitle,
        message,
        "sent"
      );

      console.log(`📨 Admin mail enviado: ${infoAdmin.messageId}`);
    } catch (err) {
      db.prepare(
        `
        INSERT INTO emails (contact_id, thread_id, direction, medium, subject, body, status, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        contactId,
        threadId,
        "outbound",
        "email",
        threadTitle,
        message,
        "failed",
        err.message
      );

      console.error("❌ Falló envío de correo al admin:", err);
    }

    // 6️⃣ Enviar auto-reply al usuario
    try {
      const infoUser = await sendAutoReply({ nombre: name, email });

      db.prepare(
        `
        INSERT INTO emails (contact_id, thread_id, direction, medium, subject, body, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        contactId,
        threadId,
        "outbound",
        "email",
        "Respuesta automática",
        message,
        "sent"
      );

      console.log(`📤 Auto-reply enviado: ${infoUser.messageId}`);
    } catch (err) {
      db.prepare(
        `
        INSERT INTO emails (contact_id, thread_id, direction, medium, subject, body, status, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        contactId,
        threadId,
        "outbound",
        "email",
        "Respuesta automática",
        message,
        "failed",
        err.message
      );

      console.error("❌ Falló auto-reply:", err);
    }

    // 7️⃣ Responder al cliente solo después de todo
    return res.status(201).json({ success: true, contactId, threadId });
  } catch (err) {
    console.error("❌ Error en createContactWithThreadAndNote:", err);
    return res.status(500).json({ error: "Error al guardar el contacto" });
  }
};

// Resto de endpoints (getAllContacts, getContactById, updateContact, deleteContact) se mantienen igual

// Obtener todos los contactos
export const getAllContacts = (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM contacts ORDER BY created_at DESC");
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los contactos" });
  }
};

// Obtener contacto por ID
export const getContactById = (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare("SELECT * FROM contacts WHERE id = ?");
    const contact = stmt.get(id);

    if (!contact) {
      return res.status(404).json({ error: "Contacto no encontrado" });
    }

    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el contacto" });
  }
};

// Actualizar contacto
export const updateContact = (req, res) => {
  const { id } = req.params;
  const { name, email, phone, source } = req.body;

  if (!name && !email && !phone && !source) {
    return res
      .status(400)
      .json({ error: "Al menos un campo debe ser actualizado" });
  }

  try {
    const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
    if (!contact) {
      return res.status(404).json({ error: "Contacto no encontrado" });
    }

    const stmt = db.prepare(`
      UPDATE contacts 
      SET name = ?, email = ?, phone = ?, source = ?
      WHERE id = ?
    `);

    stmt.run(
      name || contact.name,
      email || contact.email,
      phone || contact.phone,
      source || contact.source,
      id
    );

    res.json({ message: "Contacto actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el contacto" });
  }
};

// Eliminar contacto
export const deleteContact = (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare("DELETE FROM contacts WHERE id = ?");
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Contacto no encontrado" });
    }

    res.json({ message: "Contacto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el contacto" });
  }
};
