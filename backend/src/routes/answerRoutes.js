import express from "express";
import { addAnswer, getAnswersByQuestion } from "../controllers/answerController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, addAnswer);

router.get("/:questionId", getAnswersByQuestion);

export default router;