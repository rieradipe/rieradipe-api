import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const transport = pino.transport({
  targets: [
    ...(isDev
      ? [
          {
            target: "pino-pretty",
            level: "debug",
            options: { colorize: true, translateTime: "SYS:standard" },
          },
        ]
      : []),
    {
      target: "pino/file",
      level: "info",
      options: { destination: "logs/app-log", mkdir: true },
    },
    {
      target: "pino/file",
      level: "error",
      options: { destination: "logs/error.log", mkdir: true },
    },
  ],
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    //oculta credenciales y tokens en cualquier punto del objeto
    redact: {
      paths: [
        "password",
        "pass",
        "*.password",
        ".*pass",
        "token",
        ".accesToken",
        "refreshhToken",
        "authorization",
        "req.headers.autorization",
        "smtp.auth.user",
        "smtp.auth.pass",
        "config.smtp.auth.user",
        "config.smtp.auth.pass",
      ],
      censor: ["REDACTED"],
    },
    base: {
      service: process.env.SERVICE_NAME || "albaweb-back",
    },
  },
  transport
);
export default logger;
