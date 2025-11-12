import express from "express";
import {
  getNotesByThread,
  createNote,
} from "../controllers/NotesController.js";

const router = express.Router();

//threads
router.get("/:thread_id", getNotesByThread);
router.post("/:thread_id", createNote);
export default router;
