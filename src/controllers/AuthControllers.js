import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../db.js";

// Registro
export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (existing)
      return res.status(400).json({ message: "Email ya registrado" });

    const hashed = await bcrypt.hash(password, 10);

    const info = db
      .prepare("INSERT INTO users (email, password) VALUES (?, ?)")
      .run(email, hashed);

    res.status(201).json({
      message: "Usuario creado correctamente",
      user: { id: info.lastInsertRowid, email },
    });
  } catch (err) {
    res.status(500).json({ message: "Error en registro", err });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user)
      return res.status(400).json({ message: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login correcto",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Error en login", err });
  }
};
