import bcrypt from "bcrypt";

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_HASHED_PASSWORD = process.env.ADMIN_HASHED_PASSWORD;
const API_TOKEN = process.env.API_TOKEN; // token simple para la app

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No autorizado" });
  }

  // 1. Autenticación tipo Bearer (APP)
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    if (!API_TOKEN) {
      return res
        .status(500)
        .json({ error: "SERVER: No hay API_TOKEN configurado" });
    }

    if (token !== API_TOKEN) {
      return res.status(401).json({ error: "Token inválido" });
    }

    return next();
  }

  // 2. Autenticación tipo Basic (panel administrativo)
  if (authHeader.startsWith("Basic ")) {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    const [user, password] = credentials.split(":");

    if (user !== ADMIN_USER) {
      return res.status(401).json({ error: "Usuario incorrecto" });
    }

    const valid = await bcrypt.compare(password, ADMIN_HASHED_PASSWORD);
    if (!valid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    return next();
  }

  return res
    .status(401)
    .json({ error: "Método de autenticación no soportado" });
};
