import express from "express";
import { NotesController } from "../controllers/NotesController.js";

const router = express.Router();

//threads
router.get("/", NotesController.getAllNotes);
router.get("/thread/:threadId", NotesController.getNotesByThread);
router.post("/", NotesController.createNote);
router.delete("/:Id", NotesController.deleteNote);
router.get("/thread/:threadId", NotesController.getNotesByThread);
export default router;
