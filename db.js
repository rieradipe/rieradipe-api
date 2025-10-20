import Database from "better-sqlite3";
import fs from "fs";

const DB_PATH = "./data.sqlite";

const db = new Database(DB_PATH);

export function initDB() {
  const schema = fs.readFileSync("./schema.sql", "utf8");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(schema);
  return db;
}
export default db;
