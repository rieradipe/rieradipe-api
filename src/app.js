import express from "express";
import httpLogger from "./middleware/httpLogger.js";
import logger from "logger/Index.js";

const app = express();

//midelwarebase
app.use(express.json());
app.use(httpLogger);

//solo probar que el log funciona
app.get("/health", (req, res) => {
  req, log.info("healthcheck endpoint called");
  res.json({ ok: true });
});
//si la ruta no existe
app.use((req, res) => {
  req.log.warn({ url: req.originalUrl }, "route_not_found");
  res.status(404).json({ error: "Not found" });
});

//manejador global
app.use((err, req, res, next) => {
  req.log.error({ err }, "unhandled_error");
  res.status(500).json({ error: "Internal Server Error" });
});

//captura errores no controlados
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught_exception");
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled_rejection");
});
export default app;
