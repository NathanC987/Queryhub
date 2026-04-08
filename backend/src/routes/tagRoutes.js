import express from "express";
import {
  getAllTags,
  getQuestionsByTag,
  followTag,
  unfollowTag,
  getFollowedTags,
} from "../controllers/tagController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllTags);
router.get("/following", authenticateToken, getFollowedTags);
router.get("/:name/questions", getQuestionsByTag);
router.post("/:name/follow", authenticateToken, followTag);
router.delete("/:name/follow", authenticateToken, unfollowTag);

export default router;
