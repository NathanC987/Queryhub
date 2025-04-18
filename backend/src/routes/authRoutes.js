import express from "express";
import { signup, login } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticateToken, (req, res) => {
    res.json({ message: "Welcome!", user: req.user });
});

export default router;