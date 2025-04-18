import express from "express";
import { voteOnQuestion, voteOnAnswer } from "../controllers/voteController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/question", authenticateToken, voteOnQuestion);

router.post("/answer", authenticateToken, voteOnAnswer);

export default router;