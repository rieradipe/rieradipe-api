import db from "../../db.js";

export const getMessages = (req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT n.id, c.name, c.email, n.body AS message, n.created_at, t.status
        FROM notes n
        JOIN threads t ON n.thread_id = t.id
        JOIN contacts c ON t.contact_id = c.id
        ORDER BY n.created_at DESC
      `
      )
      .all();

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los mensajes" });
  }
};
