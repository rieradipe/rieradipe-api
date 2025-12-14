import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import contactRoutes from "./ContactRoutes.js";
import notesRoutes from "./NotesRoutes.js";
import messagesRoutes from "./MessagesRoutes.js";

dotenv.config();
const router = Router();

// Admin desde .env
const adminUser = {
  email: process.env.ADMIN_USER || "rieradipe@gmail.com",
  passwordHash: process.env.ADMIN_HASHED_PASSWORD,
  role: "admin",
};

// Middleware de autenticación admin
function authAdmin(req, res, next) {
  const SECRET = process.env.JWT_SECRET;
  if (!SECRET) return res.status(500).json({ error: "JWT_SECRET no definido" });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// Login admin
router.post("/login", (req, res) => {
  const SECRET = process.env.JWT_SECRET;
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email y contraseña requeridos" });

  if (email.toLowerCase() !== adminUser.email.toLowerCase())
    return res.status(401).json({ error: "Credenciales incorrectas" });

  if (!adminUser.passwordHash)
    return res.status(500).json({ error: "Password hash no configurado" });

  const validPassword = bcrypt.compareSync(password, adminUser.passwordHash);
  if (!validPassword)
    return res.status(401).json({ error: "Credenciales incorrectas" });

  const token = jwt.sign({ role: adminUser.role }, SECRET, { expiresIn: "1h" });
  return res.json({ token });
});

// Montamos routers de contacts, notes y messages con authAdmin
router.use("/contacts", authAdmin, contactRoutes);
router.use("/notes", authAdmin, notesRoutes);
router.use("/messages", authAdmin, messagesRoutes);

export default router;
