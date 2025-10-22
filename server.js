// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import db, { initDB } from "./db.js";
import { z } from "zod";
import { sendContactMail, sendAutoReply } from "./emailService.js";

const app = express();
const PORT = process.env.PORT || 7070;

// Middlewares
app.use(cors({ origin: true }));
app.use(express.json());

// Soporte para inicializar la DB con:  npm run init  (-> node server.js --init)
if (process.argv.includes("--init")) {
  initDB();
  console.log("DB inicializada ✅");
  process.exit(0);
}

// Validación del payload del formulario de contacto
const ContactPayload = z.object({
  nombre: z.string().trim().optional(),
  email: z.string().email(),
  asunto: z.string().trim().optional(),
  mensaje: z.string().min(5, "El mensaje debe tener al menos 5 caracteres"),
  phone: z.string().trim().optional(),
  source: z.string().trim().optional(),
});

// POST /api/contact -> crea/encuentra contacto, crea thread, añade 1ª nota y envía emails
app.post("/api/contact", async (req, res) => {
  try {
    const data = ContactPayload.parse(req.body);

    // Normaliza el origen
    const source = (data.source || "web").toLowerCase();

    // 1) Contacto (crea si no existe por email)
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

    // 2) Thread (nuevo por envío)
    const title =
      (data.asunto && data.asunto.trim()) || "Contacto desde la web";
    const t = db
      .prepare(
        "INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)"
      )
      .run(contactId, title, "open");
    const threadId = t.lastInsertRowid;

    // 3) Primera nota (mensaje inbound)
    db.prepare(
      "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    ).run(threadId, data.mensaje, "inbound", "web");

    // 4) Envío de correos (admin + autoreply) — errores no bloquean la respuesta
    try {
      const infoAdmin = await sendContactMail({
        nombre: data.nombre,
        email: data.email,
        asunto: title,
        mensaje: data.mensaje,
        contactId,
        threadId,
      });
      console.log(
        `📨 Admin mail enviado a ${process.env.MAIL_TO}: ${infoAdmin?.messageId}`
      );
    } catch (mailErr) {
      console.warn(
        "⚠️ Falló envío al admin (contacto guardado):",
        mailErr?.message || mailErr
      );
    }

    try {
      const infoUser = await sendAutoReply({
        nombre: data.nombre,
        email: data.email,
      });
      console.log(
        `📤 Auto-reply enviado a ${data.email}: ${infoUser?.messageId}`
      );
    } catch (mailErr) {
      console.warn(
        "⚠️ Falló auto-reply (contacto guardado):",
        mailErr?.message || mailErr
      );
    }

    return res.status(201).json({ ok: true, contactId, threadId });
  } catch (err) {
    // Si es un error de validación de Zod, devuelve el detalle formateado
    if (err instanceof z.ZodError) {
      return res.status(400).json({ ok: false, error: err.format() });
    }
    console.error("❌ Error en /api/contact:", err?.message || err);
    return res
      .status(400)
      .json({ ok: false, error: err?.message || "bad_request" });
  }
});

// Healthcheck simple
app.get("/health", (_req, res) => {
  const row = db.prepare('SELECT datetime("now") as now').get();
  res.json({ ok: true, now: row.now });
});

app.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}`);
});
