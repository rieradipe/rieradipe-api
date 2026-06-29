// src/app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initDB } from "../db.js";

// Rutas
import adminRoutes from "./routes/AdminRoutes.js";
import messagesRoutes from "./routes/MessagesRoutes.js";
import notesRoutes from "./routes/NotesRoutes.js";
import publicContactRoutes from "./routes/PublicContactRoutes.js";

// Core
import db from "../db.js";
import logger from "./logger/index.js";
import httpLogger from "./middleware/httpLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
console.log("BACKEND CARGADO DESDE ESTA RUTA");

// Middlewares
app.use(express.json());
app.use(cors({ origin: true }));
app.use(httpLogger);

/* =========================
   RUTAS PÚBLICAS
========================= */
app.use("/api/contact", publicContactRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/notes", notesRoutes);

/* =========================
   PANEL ADMIN OCULTO (API)
========================= */
app.use("/panel-secreto-7f4d2a1b/api/admin", adminRoutes);

/* =========================
   PANEL ADMIN (FRONTEND)
========================= */
app.use(
  "/panel-secreto-7f4d2a1b",
  express.static(path.join(__dirname, "../admin-panel/build"))
);

// Para que React Router funcione correctamente
app.get("/panel-secreto-7f4d2a1b/*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../admin-panel/build/index.html"));
});

/* =========================
   HEALTHCHECK
========================= */
app.get("/health", (_req, res) => {
  try {
    const row = db.prepare("SELECT datetime('now') as now").get();
    console.log("Healthcheck DB:", row);
    res.json({ ok: true, now: row.now });
  } catch (err) {
    console.error("Error Health DB:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================
   404
========================= */
app.use((req, res) => {
  req.log?.warn?.({ url: req.originalUrl }, "route_not_found");
  res.status(404).json({ error: "Not found" });
});

/* =========================
   ERROR GLOBAL
========================= */
app.use((err, req, res, _next) => {
  (req.log || logger).error({ err }, "unhandled_error");
  res.status(500).json({ error: "Internal Server Error" });
});

/* =========================
   INIT DB
========================= */
initDB();
console.log("✅ Base de datos inicializada automáticamente");

export default app;
