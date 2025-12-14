import express from "express";
import { NotesController } from "../controllers/NotesController.js";

const router = express.Router();

router.get("/", NotesController.getAllNotes);
router.get("/thread/:threadId", NotesController.getNotesByThread);
router.post("/", NotesController.createNote);
router.delete("/:id", NotesController.deleteNote);

export default router;
