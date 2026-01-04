import db from "../../db.js";
import { sendContactMail, sendAutoReply } from "../service/emailService.js";

// Crear contacto + hilo + nota y enviar correos
export const createContactWithThreadAndNote = async (req, res) => {
  const { name, email, phone, source, subject, message } = req.body;

  console.log("📥 createContactWithThreadAndNote recibido:", req.body);

  if (!email || !subject || !message) {
    console.warn("⚠️ Faltan datos obligatorios");
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    // 1️⃣ Buscar contacto existente
    console.log("🔎 Buscando contacto existente por email:", email);
    let existing = db
      .prepare("SELECT id FROM contacts WHERE email = ? LIMIT 1")
      .get(email);

    let contactId;

    if (!existing) {
      console.log("➕ Creando nuevo contacto:", { name, email, phone, source });
      const info = db
        .prepare(
          "INSERT INTO contacts (name, email, phone, source) VALUES (?, ?, ?, ?)"
        )
        .run(name ?? null, email, phone ?? null, source ?? "web");
      contactId = info.lastInsertRowid;
    } else {
      contactId = existing.id;
      console.log("✅ Contacto existente encontrado, id:", contactId);
    }

    // 2️⃣ Crear hilo asociado
    const threadTitle = subject || "Contacto desde la web";
    console.log("🧵 Creando hilo:", threadTitle);
    const threadInfo = db
      .prepare(
        "INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)"
      )
      .run(contactId, threadTitle, "open");
    const threadId = threadInfo.lastInsertRowid;

    // 3️⃣ Crear nota inicial
    console.log("📝 Creando nota inicial");
    db.prepare(
      "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    ).run(threadId, message, "inbound", "web");

    //probamos eliminar errores hasta dar con un servicio mail coherente con nosotros4️⃣
    try {
      await sendContactMail({ nombre, email, asunto: subject, mensaje });
    } catch (err) {
      console.warn("Correo admin falló, ignorando para frontend:", err.message);
    }

    /*Enviar correo al admin
    try {
      const infoAdmin = await sendContactMail({
        nombre: name,
        email,
        asunto: threadTitle,
        mensaje: message,
        contactId,
        threadId,
      });
      console.log("📨 Correo admin enviado:", infoAdmin.messageId);

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
    } catch (err) {
      console.error("❌ Falló envío de correo admin:", err.message);
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
    }

    // 5️⃣ Enviar auto-reply al usuario
    try {
      const infoUser = await sendAutoReply({ nombre: name, email });
      console.log("📤 Auto-reply enviado:", infoUser.messageId);

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
    } catch (err) {
      console.error("❌ Falló auto-reply:", err.message);
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
    }
      */

    console.log("✅ Contacto, hilo y notas creados correctamente:", {
      contactId,
      threadId,
    });

    return res.status(201).json({ success: true, contactId, threadId });
  } catch (err) {
    console.error("❌ Error en createContactWithThreadAndNote:", err);
    return res.status(500).json({ error: "Error al guardar el contacto" });
  }
};

// Obtener todos los contactos
export const getAllContacts = (req, res) => {
  console.log("📥 getAllContacts llamado");
  try {
    const rows = db
      .prepare("SELECT * FROM contacts ORDER BY created_at DESC")
      .all();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener los contactos:", err);
    res.status(500).json({ error: "Error al obtener los contactos" });
  }
};

// Obtener contacto por ID
export const getContactById = (req, res) => {
  const { id } = req.params;
  console.log("📥 getContactById llamado:", id);

  try {
    const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
    if (!contact) {
      console.warn("⚠️ Contacto no encontrado:", id);
      return res.status(404).json({ error: "Contacto no encontrado" });
    }
    res.json(contact);
  } catch (err) {
    console.error("❌ Error al obtener el contacto:", err);
    res.status(500).json({ error: "Error al obtener el contacto" });
  }
};

// Actualizar contacto
export const updateContact = (req, res) => {
  const { id } = req.params;
  const { name, email, phone, source } = req.body;
  console.log("📥 updateContact llamado:", { id, name, email, phone, source });

  if (!name && !email && !phone && !source) {
    console.warn("⚠️ No hay campos para actualizar");
    return res
      .status(400)
      .json({ error: "Al menos un campo debe ser actualizado" });
  }

  try {
    const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
    if (!contact) {
      console.warn("⚠️ Contacto no encontrado:", id);
      return res.status(404).json({ error: "Contacto no encontrado" });
    }

    db.prepare(
      `
      UPDATE contacts 
      SET name = ?, email = ?, phone = ?, source = ?
      WHERE id = ?
    `
    ).run(
      name || contact.name,
      email || contact.email,
      phone || contact.phone,
      source || contact.source,
      id
    );

    console.log("✅ Contacto actualizado:", id);
    res.json({ message: "Contacto actualizado" });
  } catch (err) {
    console.error("❌ Error al actualizar el contacto:", err);
    res.status(500).json({ error: "Error al actualizar el contacto" });
  }
};

// Eliminar contacto
export const deleteContact = (req, res) => {
  const { id } = req.params;
  console.log("📥 deleteContact llamado:", id);

  try {
    const info = db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
    if (info.changes === 0) {
      console.warn("⚠️ Contacto no encontrado para eliminar:", id);
      return res.status(404).json({ error: "Contacto no encontrado" });
    }

    console.log("✅ Contacto eliminado:", id);
    res.json({ message: "Contacto eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar el contacto:", err);
    res.status(500).json({ error: "Error al eliminar el contacto" });
  }
};
// Obtener contacto completo: contacto + hilos + notas
export const getFullContact = (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Contacto
    const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
    if (!contact)
      return res.status(404).json({ error: "Contacto no encontrado" });

    // 2️⃣ Hilos del contacto
    const threads = db
      .prepare("SELECT * FROM threads WHERE contact_id = ?")
      .all(id);

    // 3️⃣ Notas asociadas a esos hilos
    const notes = db
      .prepare(
        `SELECT n.*, t.id as thread_id, t.status 
         FROM notes n 
         JOIN threads t ON n.thread_id = t.id
         WHERE t.contact_id = ?`
      )
      .all(id);

    res.json({ contact, threads, notes });
  } catch (err) {
    console.error("Error en getFullContact:", err);
    res.status(500).json({ error: "Error al obtener contacto completo" });
  }
};
