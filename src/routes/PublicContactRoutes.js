import express from "express";
import { createContactWithThreadAndNote } from "../controllers/ContactController.js";

const router = express.Router();

// POST público para formulario de contacto
router.post("/", createContactWithThreadAndNote);

export default router;
