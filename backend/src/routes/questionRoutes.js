import express from "express";
import { createQuestion, getAllQuestions, updateQuestion, deleteQuestion, getQuestionDetails } from "../controllers/questionController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, createQuestion);
router.get("/", getAllQuestions);
router.put("/:id", authenticateToken, updateQuestion);
router.delete("/:id", authenticateToken, deleteQuestion);
router.get("/:id", getQuestionDetails);

export default router;