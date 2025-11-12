// src/app.js
import express from "express";
import cors from "cors";
import { z } from "zod";
import db, { initDB } from "../db.js";
import { sendContactMail, sendAutoReply } from "../emailService.js";
import logger from "./logger/index.js";
import httpLogger from "./middleware/httpLogger.js";
import contactRoutes from "./routes/ContactRoutes.js";
import messageRoutes from "./routes/MessageRoutes.js";
import notesRoutes from "./routes/NotesRoutes.js";

const app = express();

// Middlewares base
app.use(cors({ origin: true }));
app.use(express.json());
app.use(httpLogger);
app.use("/api/contact", contactRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/notes", notesRoutes);

// Validación del payload del formulario
const ContactPayload = z.object({
  nombre: z.string().trim().optional(),
  email: z.string().email(),
  asunto: z.string().trim().optional(),
  mensaje: z.string().min(5, "El mensaje debe tener al menos 5 caracteres"),
  phone: z.string().trim().optional(),
  source: z.string().trim().optional(),
});

// 📩 POST /api/contact -> crea contacto, hilo, nota y envía correos
app.post("/api/contact", async (req, res) => {
  try {
    const data = ContactPayload.parse(req.body);
    const source = (data.source || "web").toLowerCase();

    const existing = db
      .prepare("SELECT id FROM contacts WHERE email = ? LIMIT 1")
      .get(data.email);

    let contactId = existing?.id;
    if (!contactId) {
      const ins = db
        .prepare(
          "INSERT INTO contacts (name, email, phone, source) VALUES (?, ?, ?, ?)"
        )
        .run(data.nombre ?? null, data.email, data.phone ?? null, source);
      contactId = ins.lastInsertRowid;
    }

    const title =
      (data.asunto && data.asunto.trim()) || "Contacto desde la web";
    const t = db
      .prepare(
        "INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)"
      )
      .run(contactId, title, "open");
    const threadId = t.lastInsertRowid;

    db.prepare(
      "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    ).run(threadId, data.mensaje, "inbound", "web");

    try {
      const infoAdmin = await sendContactMail({
        nombre: data.nombre,
        email: data.email,
        asunto: title,
        mensaje: data.mensaje,
        contactId,
        threadId,
      });
      logger.info(
        `📨 Admin mail enviado a ${process.env.MAIL_TO}: ${infoAdmin?.messageId}`
      );
    } catch (mailErr) {
      logger.warn("⚠️ Falló envío al admin:", mailErr?.message || mailErr);
    }

    try {
      const infoUser = await sendAutoReply({
        nombre: data.nombre,
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
