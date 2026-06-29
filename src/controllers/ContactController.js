// src/controllers/ContactController.js
import db from "../../db.js";
import { sendContactMail, sendAutoReply } from "../service/emailService.js";

// Crear contacto + hilo + nota (NO bloqueante con correo)
export const createContactWithThreadAndNote = async (req, res) => {
  const { name, email, phone, source, subject, message } = req.body;

  console.log("📥 Contact recibido:", req.body);

  if (!email || !subject || !message) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

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
    .prepare("INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)")
    .run(contactId, subject, "open");
  const threadId = threadInfo.lastInsertRowid;

  // 3️⃣ Crear nota inicial
  db.prepare(
    "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
  ).run(threadId, message, "inbound", "web");

  console.log("📝 Nota creada");
    try {
    const adminResult = await sendContactMail({
      nombre: name,
      email,
      asunto: subject,
      mensaje: message,
    });

    console.log("✅ Correo admin enviado:", adminResult);

    const autoReplyResult = await sendAutoReply({
      nombre: name,
      email,
    });

    console.log("✅ Auto-reply enviado:", autoReplyResult);
  } catch (err) {
    console.error("❌ Error enviando correo:", err);

    return res.status(500).json({
      success: false,
      error: "Error enviando los correos",
      detail: err.message,
    });
  }

  // 6️⃣ Responder al frontend inmediatamente
  return res.status(201).json({
    success: true,
    message: "Contacto recibido correctamente",
    contactId,
    threadId,
  });
};

// Listar todos los contactos
export const getAllContacts = (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM contacts ORDER BY created_at DESC")
      .all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los contactos" });
  }
};

// Obtener contacto simple por ID
export const getContactById = (req, res) => {
  const { id } = req.params;
  try {
    const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
    if (!contact)
      return res.status(404).json({ error: "Contacto no encontrado" });
    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el contacto" });
  }
};

// Obtener contacto completo: contacto + hilos + notas
export const getFullContact = (req, res) => {
  const { id } = req.params;
  try {
    const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
    if (!contact)
      return res.status(404).json({ error: "Contacto no encontrado" });

    const threads = db
      .prepare("SELECT * FROM threads WHERE contact_id = ?")
      .all(id);
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
    console.error(err);
    res.status(500).json({ error: "Error al obtener contacto completo" });
  }
};

// Actualizar contacto
export const updateContact = (req, res) => {
  const { id } = req.params;
  const { name, email, phone, source } = req.body;

  if (!name && !email && !phone && !source)
    return res
      .status(400)
      .json({ error: "Al menos un campo debe ser actualizado" });

  try {
    const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
    if (!contact)
      return res.status(404).json({ error: "Contacto no encontrado" });

    db.prepare(
      `UPDATE contacts SET name = ?, email = ?, phone = ?, source = ? WHERE id = ?`
    ).run(
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
    const info = db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
    if (info.changes === 0)
      return res.status(404).json({ error: "Contacto no encontrado" });
    res.json({ message: "Contacto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el contacto" });
  }
};
