import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import logger from "./logger/index.js";

const PORT = process.env.PORT || 7070;
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught_exception");
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled_rejection");
});

if (process.env.NODE_ENV !== "production") {
  console.log("JWT_SECRET =", process.env.JWT_SECRET);
  console.log("ADMIN_USER =", process.env.ADMIN_USER);
  console.log("ADMIN_HASHED_PASSWORD =", process.env.ADMIN_HASHED_PASSWORD);
}

app.listen(PORT, () => {
  logger.info(`🚀 API corriendo en ${API_URL}`);
});
