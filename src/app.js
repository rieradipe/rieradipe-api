// src/app.js
import express from "express";
import cors from "cors";
import adminRoutes from "./routes/AdminRoutes.js";

import logger from "./logger/index.js";
import httpLogger from "./middleware/httpLogger.js";

const app = express();
console.log("BACKEND CARGADO DESDE ESTA RUTA");

// Middlewares
app.use(express.json());
app.use(cors({ origin: true }));
app.use(httpLogger);

// Panel admin oculto
app.use("/panel-secreto-7f4d2a1b/api/admin", adminRoutes);

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

// Error global
app.use((err, req, res, next) => {
  (req.log || logger).error({ err }, "unhandled_error");
  res.status(500).json({ error: "Internal Server Error" });
});

// Inicializar DB si se pasa --init
if (process.argv.includes("--init")) {
  initDB();
  logger.info("DB inicializada");
  process.exit(0);
}

export default app;
