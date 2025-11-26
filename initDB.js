// initDB.js
import Database from "better-sqlite3";
import fs from "fs";

// Importamos la base de datos desde tu db.js
import db from "./db.js"; // asegúrate de que la ruta sea correcta

export function initDB() {
  try {
    // Leemos el esquema SQL
    const schema = fs.readFileSync("./schema.sql", "utf8");

    // Activamos claves foráneas
    db.exec("PRAGMA foreign_keys = ON;");

    // Ejecutamos el esquema para crear tablas
    db.exec(schema);

    console.log("Base de datos inicializada correctamente.");
  } catch (err) {
    console.error("Error al inicializar la base de datos:", err);
  }
}

// Ejecutamos la función al llamar al script
initDB();
