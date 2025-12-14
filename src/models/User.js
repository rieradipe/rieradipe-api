// src/models/User.js

import bcrypt from "bcrypt";
import db from "../../db.js";
// Crear usuario
export const createUser = (email, password) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
  return stmt.run(email, hashedPassword);
};

// Buscar usuario por email
export const findUserByEmail = (email) => {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email);
};

// Verificar contraseña
export const verifyPassword = (password, hashed) => {
  return bcrypt.compareSync(password, hashed);
};
