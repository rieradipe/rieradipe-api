import db from "../../db.js";

export const NotesController = {
  // Crear nota en un hilo
  createNote: (req, res) => {
    const threadId = req.params.threadId;
    const { body } = req.body;

    if (!threadId || !body) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    try {
      console.log("Creando nota para thread:", threadId);

      // Corregido: columna en DB es thread_id
      const stmt = db.prepare(
        "INSERT INTO notes (thread_id, body) VALUES (?, ?)"
      );
      const info = stmt.run(threadId, body);

      console.log("Nota creada con ID:", info.lastInsertRowid);
      res.json({ success: true, noteId: info.lastInsertRowid });
    } catch (err) {
      console.error("Error en createNote:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Obtener todas las notas
  getAllNotes: (req, res) => {
    try {
      console.log("Obteniendo todas las notas...");
      const notes = db.prepare("SELECT * FROM notes").all();
      console.log("Notas encontradas:", notes.length);
      res.json(notes);
    } catch (err) {
      console.error("Error en getAllNotes:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Obtener las notas por thread
  getNotesByThread: (req, res) => {
    const threadId = req.params.threadId;

    if (!threadId) {
      return res.status(400).json({ error: "Falta el ID del hilo" });
    }

    try {
      console.log("Obteniendo notas para thread:", threadId);
      const stmt = db.prepare("SELECT * FROM notes WHERE thread_id = ?");
      const notes = stmt.all(threadId);
      console.log("Notas encontradas:", notes.length);
      res.json(notes);
    } catch (err) {
      console.error("Error en getNotesByThread:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Eliminar nota
  deleteNote: (req, res) => {
    const noteId = req.params.noteId;

    if (!noteId) {
      return res.status(400).json({ error: "Falta el Id de la nota" });
    }

    try {
      console.log("Eliminando nota con ID:", noteId);
      const stmt = db.prepare("DELETE FROM notes WHERE id = ?");
      const info = stmt.run(noteId);
      console.log("Notas eliminadas:", info.changes);

      if (info.changes === 0) {
        return res.status(404).json({ error: "Nota no encontrada" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Error en deleteNote:", err);
      res.status(500).json({ error: err.message });
    }
  },
};
