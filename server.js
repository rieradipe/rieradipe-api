import "dotenv/config";
import express from "express";
import cors from "cors";
import db, { initDB } from "./db.js";
import { z } from "zod"; // <- no existe 'email' exportado desde zod

const app = express();
const PORT = process.env.PORT || 7070;

app.use(cors({ origin: true }));
app.use(express.json());

// Soporte: npm run init
if (process.argv.includes("--init")) {
  initDB();
  console.log("DB inicializada ✅");
  process.exit(0);
}

// Validación del payload del formulario
const ContactPayload = z.object({
  nombre: z.string().trim().optional(),
  email: z.string().email(),
  asunto: z.string().trim().optional(),
  mensaje: z.string().min(5),
  phone: z.string().optional(),
  source: z.string().optional(),
});

// POST /api/contact -> crea/encuentra contacto, thread y 1ª nota
app.post("/api/contact", (req, res) => {
  try {
    const data = ContactPayload.parse(req.body); // <- estaba mal escrito ContactPauload

    // 1) contacto (crea si no existe por email)
    const existing = db
      .prepare("SELECT id FROM contacts WHERE email = ?")
      .get(data.email);
    let contactId = existing?.id;
    if (!contactId) {
      const ins = db
        .prepare(
          "INSERT INTO contacts (name, email, phone, source) VALUES (?, ?, ?, ?)"
        )
        .run(
          data.nombre || null,
          data.email,
          data.phone || null,
          data.source || "web"
        );
      contactId = ins.lastInsertRowid;
    }

    // 2) thread (nuevo por envío)
    const title = data.asunto || "Contacto desde la web";
    const t = db
      .prepare(
        "INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)"
      )
      .run(contactId, title, "open");
    const threadId = t.lastInsertRowid;

    // 3) primera nota (mensaje inbound)
    db.prepare(
      "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    ).run(threadId, data.mensaje, "inbound", "web"); // <- aquí había ';' en lugar de ','

    return res.json({ ok: true, contactId, threadId });
  } catch (err) {
    return res
      .status(400)
      .json({ ok: false, error: err.message || "bad_request" });
  }
});

// Salud
app.get("/health", (_req, res) => {
  const row = db.prepare('SELECT datetime("now") as now').get();
  res.json({ ok: true, now: row.now });
});

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));
