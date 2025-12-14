import express from "express";
import {
  getAllContacts,
  getContactById,
  getFullContact,
  updateContact,
  deleteContact,
} from "../controllers/ContactController.js";

const router = express.Router();

// LISTADO
router.get("/", getAllContacts);

// DETALLE SIMPLE
router.get("/:id", getContactById);

// DETALLE COMPLETO (CLAVE PARA EL PANEL)
router.get("/:id/full", getFullContact);

// ACTUALIZAR
router.put("/:id", updateContact);

// ELIMINAR
router.delete("/:id", deleteContact);

export default router;
