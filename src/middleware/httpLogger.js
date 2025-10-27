// src/middleware/httpLogger.js
import pinoHttp from "pino-http";
import logger from "../logger/index.js";
import crypto from "crypto";

const genReqId = (req, res) => {
  const fromHeader = req.headers["x-request-id"];
  if (fromHeader) return fromHeader;
  const id = crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
  res.setHeader("x-request-id", id);
  return id;
};

const httpLogger = pinoHttp({
  logger,
  genReqId,

  // Nivel según código/errores
  customLogLevel(res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  // ✅ Mensaje al RECIBIR (aquí sí tenemos req seguro)
  customReceivedMessage(req, res) {
    const url = req.originalUrl || req.url || "";
    return `${req.method} ${url} received`;
  },

  // ✅ Mensaje al COMPLETAR (NO usamos res.req)
  customSuccessMessage(res) {
    return `-> ${res.statusCode}`;
  },

  // (opcional) Mensaje cuando hay error
  customErrorMessage(err, res) {
    return `request errored -> ${res?.statusCode || 500}`;
  },

  // Props extra
  customProps(req) {
    return {
      userId: req.user?.id,
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
    };
  },

  serializers: {},
});

export default httpLogger;
