// src/app.js
import express from "express";
import cors from "cors";
import db, { initDB } from "../db.js";
import logger from "./logger/index.js";
import httpLogger from "./middleware/httpLogger.js";
import contactRoutes from "./routes/ContactRoutes.js";
import messagesRoutes from "./routes/MessagesRoutes.js";
import notesRoutes from "./routes/NotesRoutes.js";

const app = express();

// Middlewares base
app.use(express.json());
app.use(cors({ origin: true }));
app.use(httpLogger);

// Rutas
app.use("/api/contacts", contactRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/notes", notesRoutes);

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

// Manejador global de errores
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
