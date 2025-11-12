import db from "../../db.js";

//obtener todas las notas de un hilo especifico
export const getNotesByThread = (req, res) => {
  const { thread_id } = req.params;
  try {
    const notes = db
      .prepare(
        `
            SELECT * FROM notes WHERE thread_id = ?
            ORDER BY created_at DESC 
            `
      )
      .all(thread_id);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//crear nueva nota en un hilo
export const createNote = (req, res) => {
  const { thread_id } = req.params;
  const { body, direction, medium } = req.body;

  if (!body)
    return res.status(400).json({ error: "El cuerpo(body) es obligatorio" });

  try {
    const stmt = db.prepare(`
            INSERT INTO notes ( thread_id, body, direction, medium)
            VALUES (?, ?, ?, ?)
            `);
    const info = stmt.run(thread_id, body, direction || null, medium || null);
    res.status(201).json({
      id: info.lastInsertRowid,
      thread_id,
      body,
      direction,
      medium,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
