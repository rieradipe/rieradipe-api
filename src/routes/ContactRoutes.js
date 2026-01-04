// src/routes/ContactRoutes.js
import express from "express";
import {
  createContactWithThreadAndNote,
  getAllContacts,
  getContactById,
  getFullContact,
  updateContact,
  deleteContact,
} from "../controllers/ContactController.js";

const router = express.Router();

// CREAR contacto + hilo + nota
router.post("/", createContactWithThreadAndNote);

// LISTAR todos los contactos
router.get("/", getAllContacts);

// DETALLE simple por ID
router.get("/:id", getContactById);

// DETALLE completo (contacto + hilos + notas)
router.get("/:id/full", getFullContact);

// ACTUALIZAR contacto
router.put("/:id", updateContact);

// ELIMINAR contacto
router.delete("/:id", deleteContact);

export default router;
