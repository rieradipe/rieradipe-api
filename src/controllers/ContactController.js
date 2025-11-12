import db from "../../db.js";
// crear nuevo contacto + thread + nota
export const createContact = (req, res) => {
  const { nombre, email, mensaje, phone, source } = req.body;

  if (!email || !mensaje) {
    return res.status(400).json({ error: "Email y mensaje son obligatorios" });
  }

  try {
    // 1️⃣ Buscar contacto existente
    let contact = db
      .prepare("SELECT id FROM contacts WHERE email = ? LIMIT 1")
      .get(email);

    let contactId = contact?.id;

    // 2️⃣ Crear contacto si no existe
    if (!contactId) {
      const ins = db
        .prepare(
          "INSERT INTO contacts(name, email, phone, source, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
        )
        .run(nombre ?? null, email, phone ?? null, source ?? "web");
      contactId = ins.lastInsertRowid;
    }

    // 3️⃣ Crear thread
    const t = db
      .prepare(
        "INSERT INTO threads(contact_id, title, status) VALUES (?, ?, ?)"
      )
      .run(contactId, "Contacto desde la web", "open");
    const threadId = t.lastInsertRowid;

    // 4️⃣ Crear nota
    db.prepare(
      "INSERT INTO notes(thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    ).run(threadId, mensaje, "inbound", "web");

    res.status(201).json({ ok: true, contactId, threadId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar el contacto" });
  }
};

//obtener todos los contactos
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
//obtener por id
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

//modificar un contacto
export const updateContact = (req, res) => {
  const { id } = req.params;
  const { name, email, message } = req.body;
  if (!name && !email && !message) {
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
                SET name = ?, email = ?, message =? WHERE id = ?
                `);
    stmt.run(
      name || contact.name,
      email || contact.email,
      message || contact.message,
      id
    );
    res.json({ message: "Contacto actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el contacto" });
  }
};
//eliminar contacto
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
