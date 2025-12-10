import db from "../../db.js";

export const NotesController = {
  //crear nota en un hilo
  createNote: (req, res) => {
    const threadId = req.params.threadId;
    const { body } = req.body;

    if (!threadId || !body) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    try {
      const stmt = db.prepare(
        "INSERT INTO notes (threadId, body) VALUES (?, ?)"
      );
      const info = stmt.run(threadId, body);
      res.json({ success: true, notedId: info.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  //obtener todas las notas de un hilo
  getAllNotes: (req, res) => {
    try {
      const notes = db.prepare("SELECT * FROM notes").all();
      res.json(notes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  //obtener las notas por un thread
  getNotesByThread: (req, res) => {
    const threadId = req.params.threadId;

    if (!threadId) {
      return res.status(400).json({ error: "Falta el ID del hilo" });
    }
    try {
      const stmt = db.prepare("SELECT * FROM notes WHERE thread_id = ?");
      const notes = stmt.all(threadId);
      res.json(notes);
    } catch (err) {
      res.ststus(500).json({ error: err.message });
    }
  },
  //elimar notas
  deleteNote: (req, res) => {
    const noteId = req.params.noteId;

    if (!noteId) {
      return res.stutus(400).json({ error: "Falta el Id de la nota" });
    }
    try {
      const stmt = db.prepare("DELETE FROM notes WHERE id = ?");
      stmt.run(noteId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
