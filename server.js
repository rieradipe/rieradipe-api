import "dotenv/config";
import express from "express";
import cors from "cors";
import db, { initDB } from "./db.js";

const app = express();
const PORT = process.env.PORT || 7070;

app.use(cors({ origin: true }));
app.use(express.json());

//Soporte para npm run init
if (process.argv.includes("--init")) {
  initDB();
  console.log("DB inicializada");
  process.exit(0);
}

//Salud (temporal)
app.get("health", (_req, res) => {
  try {
    const row = db.prepare('SELECT datetime("now")as now').get();
    res.json({ ok: true, now: row.now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () =>
  console.log("API base (sin endpoints) en http://localhost:${PORT}")
);
