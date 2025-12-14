import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "data.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

const db = new Database(DB_PATH);

export function initDB() {
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(schema);
  return db;
}

export default db;
