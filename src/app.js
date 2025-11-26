// src/app.js
import express from "express";
import cors from "cors";
import { z } from "zod";
import db, { initDB } from "../db.js";
import { sendContactMail, sendAutoReply } from "../emailService.js";
import logger from "./logger/index.js";
import httpLogger from "./middleware/httpLogger.js";
import contactRoutes from "./routes/ContactRoutes.js";
import messagesRoutes from "./routes/MessagesRoutes.js";
import notesRoutes from "./routes/NotesRoutes.js";

const app = express();

// Middlewares base
app.use(express.json());
app.use(cors({ origin: true }));
app.use("/api/notes", notesRoutes);
app.use(httpLogger);
app.use("/api/contacts", contactRoutes);
app.use("/api/messages", messagesRoutes);

// Validación del payload del formulario
const ContactPayload = z.object({
  name: z.string().trim(),
  email: z.string().email(),
  subject: z.string().trim().optional(),
  message: z.string().min(5, "El mensaje debe tener al menos 5 caracteres"),
  phone: z.string().trim().optional(),
  source: z.string().trim().optional(),
});

// 📩 POST /api/contacts -> crea contacto, hilo, nota y envía correos
app.post("/api/contacts", async (req, res) => {
  try {
    const data = ContactPayload.parse(req.body);
    const source = (data.source || "web").toLowerCase();

    // Buscar contacto existente por email
    const existing = db
      .prepare("SELECT id FROM contacts WHERE email = ? LIMIT 1")
      .get(data.email);

    let contactId = existing?.id;

    // Crear contacto si no existe
    if (!contactId) {
      const ins = db
        .prepare(
          "INSERT INTO contacts (name, email, phone, source) VALUES (?, ?, ?, ?)"
        )
        .run(data.name ?? null, data.email, data.phone ?? null, source);

      contactId = ins.lastInsertRowid;
    }

    // Título del hilo
    const title =
      (data.subject && data.subject.trim()) || "Contacto desde la web";

    // Crear HILO
    const t = db
      .prepare(
        "INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)"
      )
      .run(contactId, title, "open");
    const threadId = t.lastInsertRowid;

    // Crear NOTA inicial con el mensaje
    db.prepare(
      "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    ).run(threadId, data.message, "inbound", "web");

    // Email admin
    try {
      const infoAdmin = await sendContactMail({
        nombre: data.name,
        email: data.email,
        asunto: title,
        mensaje: data.message,
        contactId,
        threadId,
      });

      logger.info(
        `📨 Admin mail enviado a ${process.env.MAIL_TO}: ${infoAdmin?.messageId}`
      );
    } catch (mailErr) {
      logger.warn("⚠️ Falló envío al admin:", mailErr?.message || mailErr);
    }

    // Auto-reply al usuario
    try {
      const infoUser = await sendAutoReply({
        nombre: data.name,
        email: data.email,
      });

      logger.info(
        `📤 Auto-reply enviado a ${data.email}: ${infoUser?.messageId}`
      );
    } catch (mailErr) {
      logger.warn("⚠️ Falló auto-reply:", mailErr?.message || mailErr);
    }

    return res.status(201).json({ ok: true, contactId, threadId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ ok: false, error: err.format() });
    }

    logger.error("❌ Error en /api/contact:", err?.message || err);
    return res
      .status(400)
      .json({ ok: false, error: err?.message || "bad_request" });
  }
});

// 🧾 GET /api/contacts -> lista todos los contactos con sus threads
app.get("/api/contacts", (req, res) => {
  try {
    const contacts = db
      .prepare(
        `
        SELECT c.id, c.name, c.email, c.phone, c.source, c.created_at,
                COUNT(t.id) as threads_count
         FROM contacts c
         LEFT JOIN threads t ON t.contact_id = c.id
         GROUP BY c.id
         ORDER BY c.created_at DESC`
      )
      .all();

    res.json({ ok: true, data: contacts });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Error al obtener contactos" });
  }
});

// Healthcheck
app.get("/health", (_req, res) => {
  const row = db.prepare('SELECT datetime("now") as now').get();
  res.json({ ok: true, now: row.now });
});

// 404 explícito
app.use((req, res) => {
  req.log?.warn?.({ url: req.originalUrl }, "route_not_found");
  res.status(404).json({ error: "Not found" });
});

// Manejador global
app.use((err, req, res, next) => {
  (req.log || logger).error({ err }, "unhandled_error");
  res.status(500).json({ error: "Internal Server Error" });
});

// Soporte para inicializar DB (opcional)
if (process.argv.includes("--init")) {
  initDB();
  logger.info("DB inicializada ✅");
  process.exit(0);
}

export default app;
