import db from "../../db";

export const getMessages = (req, res) => {
  const query =
    "SELECT id, name, email, message, create_at, status FROM contacts ORDER BY create_at DESC";
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, data: rows });
  });
};
