import express from "express";
import {
  createContactWithThreadAndNote,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
} from "../controllers/ContactController.js";

const router = express.Router();

router.post("/", createContactWithThreadAndNote);

router.get("/", getAllContacts);
router.get("/:id", getContactById);
router.patch("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
