import db from "./db.js";

const contacts = [
  {
    name: "Jordi",
    email: "jordi@mail.com",
    phone: "600111222",
    source: "web",
    message: "Hola, este es Jordi",
  },
  {
    name: "Ana",
    email: "ana@mail.com",
    phone: "600333444",
    source: "web",
    message: "Hola, este es Ana",
  },
];

contacts.forEach((c) => {
  const contactStmt = db.prepare(
    "INSERT INTO contacts(name, email, phone, source) VALUES (?, ?, ?, ?)"
  );
  const info = contactStmt.run(c.name, c.email, c.phone, c.source);

  const contactId = info.lastInsertRowid;

  const threadStmt = db.prepare(
    "INSERT INTO threads(contact_id, title, status) VALUES (?, ?, ?)"
  );
  const tinfo = threadStmt.run(contactId, "Hilo inicial", "open");
  const threadId = tinfo.lastInsertRowid;

  const noteStmt = db.prepare(
    "INSERT INTO notes(thread_id, body, direction, medium) VALUES (?, ?, ?, ?)"
  );
  noteStmt.run(threadId, c.message, "inbound", "web");
});

console.log("✅ Datos de prueba insertados");
