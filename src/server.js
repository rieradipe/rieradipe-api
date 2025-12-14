import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import logger from "./logger/index.js";

const PORT = process.env.PORT || 7070;

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught_exception");
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled_rejection");
});
console.log("JWT_SECRET =", process.env.JWT_SECRET);
console.log("ADMIN_USER =", process.env.ADMIN_USER);
console.log("ADMIN_HASHED_PASSWORD =", process.env.ADMIN_HASHED_PASSWORD);

app.listen(PORT, () => {
  logger.info(`🚀 API en http://localhost:${PORT}`);
});
