import db from "../../db.js";

// Crear contacto + hilo + nota
export const createContactWithThreadAndNote = (req, res) => {
  const { name, email, phone, source, subject, message } = req.body;

  // Los obligatorios REALMENTE son estos
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
      const stmtContact = db.prepare(
        "INSERT INTO contacts (name, email, phone, source) VALUES (?, ?, ?, ?)"
      );
      const info = stmtContact.run(
        name ?? null,
        email,
        phone ?? null,
        source ?? "web"
      );
      contactId = info.lastInsertRowid;
    } else {
      contactId = existing.id;
    }

    // 3️⃣ Crear hilo asociado
    const threadTitle = subject || "Contacto desde la web";

    const stmtThread = db.prepare(
      "INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)"
    );
    const threadInfo = stmtThread.run(contactId, threadTitle, "open");
    const threadId = threadInfo.lastInsertRowid;

    // 4️⃣ Crear nota inicial en el hilo
    const stmtNote = db.prepare(
      "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    );
    stmtNote.run(threadId, message, "inbound", "web");

    res.status(201).json({
      success: true,
      contactId,
      threadId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar el contacto" });
  }
};

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
