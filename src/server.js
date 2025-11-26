// src/server.js
import "dotenv/config";
import app from "./app.js";
import logger from "./logger/index.js";
import { initDB } from "../db.js";

const PORT = process.env.PORT || 7070;

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught_exception");
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled_rejection");
});

app.listen(PORT, () => {
  logger.info(`🚀 API en http://localhost:${PORT}`);
});
