import db from "../../db.js";
//crear nuevo
export const createContact = (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    const stmt = db.prepare(`
    INSERT INTO contacts(name, email, message, create_at)
    VALUES (?, ?, ?, datetime("now")) `);
    const info = stmt.run(name, email, message);
    res.status(201).json({
      id: this.lastID,
      name,
      email,
      message,
      create_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar el contacto" });
  }
};
//obtener todos los contactos
export const getAllContacts = (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM contacts ORDER BY create_at DESC");
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los contactos" });
  }
};
//obtener por id
export const getContactById = (req, res) => {
    const {id} = req.params;

    try {
        const stmt = db.prepare('SELECT * FROM contacts WHERE id = ?');
        const contact = stmt.get(id);

        if (!contact) {
            return res.status(404).json({error: "Contacto no encontrado"});
        }
        res.json(contact);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Error al obtener el contacto"});
    }
};

//modificar un contacto
export const updateContact = (req, res) => {
    const {id} = req.params;
    const {name, email, message } = req.body;
    if (!name && !email && !message) {
        return res.status(400).json({error: "Al menos un campo debe ser actualizado"});

    } 
        try {
            const contact = db.prepare('SELECT * FROMM contactsWHERE id = ?').get(id):
            if (!contact) {
                return res.status(404).json({error: "Contacto no encontrado"});
            }
            const stmt = db.prepare(`
                UPDATE contacts 
                SET name = ?, email = ?, message =?, WHERE id = ?
                `);
                stmt.run(
                name || contact.name,
                email || contact.email,
                message || contact.message,
                id
            );
            res.json({ message: "Contacto actualizado"});
                 } catch (err) {
         console.error(err);
         res.status(500).json({error: "Error al actualizar el contacto"});
         }
            };
            //eliminar contacto
            export const deleteContact = (req, res) => {
                const { id } = req.params;
              
                try {
                  const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
                  const info = stmt.run(id);
              
                  if (info.changes === 0) {
                    return res.status(404).json({ error: "Contacto no encontrado" });
                  }
              
                  res.json({ message: "Contacto eliminado" });
                } catch (err) {
                  console.error(err);
                  res.status(500).json({ error: "Error al eliminar el contacto" });
                }
              };


