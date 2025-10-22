import "dotenv/config";
import express from "express";
import cors from "cors";
import db, { initDB } from "./db.js";
import { z } from "zod";
import { sendAutoReply, sendContactMail } from "./emailService.js";
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
app.post("/api/contact", async (req, res) => {
  try {
    const data = ContactPayload.parse(req.body);
    const source = (data.source || "web").toLowerCase();

    // 1) contacto
    const existing = db
      .prepare("SELECT id FROM contacts WHERE email = ?")
      .get(data.email);
    let contactId = existing?.id;
    if (!contactId) {
      const ins = db
        .prepare(
          "INSERT INTO contacts (name, email, phone, source) VALUES (?, ?, ?, ?)"
        )
        .run(data.nombre || null, data.email, data.phone || null, source);
      contactId = ins.lastInsertRowid;
    }

    // 2) thread
    const title = data.asunto || "Contacto desde la web";
    const t = db
      .prepare(
        "INSERT INTO threads (contact_id, title, status) VALUES (?, ?, ?)"
      )
      .run(contactId, title, "open");
    const threadId = t.lastInsertRowid;

    // 3) nota
    db.prepare(
      "INSERT INTO notes (thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
    ).run(threadId, data.mensaje, "inbound", "web");

    // 4) correos (con logs claros y capturas separadas)
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
    } catch (err) {
      console.error("❌ Falló envío al admin:", err?.message || err);
    }

    try {
      const infoUser = await sendAutoReply({
        nombre: data.nombre,
        email: data.email,
      });
      console.log(
        `📤 Auto-reply enviado a ${data.email}: ${infoUser?.messageId}`
      );
    } catch (err) {
      console.error("❌ Falló auto-reply:", err?.message || err);
    }

    return res.json({ ok: true, contactId, threadId });
  } catch (err) {
    console.error("Error en /api/contact:", err);
    return res
      .status(400)
      .json({ ok: false, error: err.message || "bad_request" });
  }
});

// (opcional) para que el navegador no muestre "No se puede obtener /"
app.get("/", (_req, res) => res.send("API RieraDiPe OK"));

// Ruta de prueba para auto-reply aislado
app.get("/debug/send-auto-reply", async (req, res) => {
  const to = req.query.to;
  if (!to)
    return res.status(400).json({ ok: false, error: "Falta ?to=correo" });
  try {
    const info = await sendAutoReply({ nombre: "Test", email: to });
    return res.json({ ok: true, messageId: info?.messageId || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Salud
app.get("/health", (_req, res) => {
  const row = db.prepare('SELECT datetime("now") as now').get();
  res.json({ ok: true, now: row.now });
});

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));
