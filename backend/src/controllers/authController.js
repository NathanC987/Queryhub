import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

export const signup = async (req, res) => {
    const username = normalizeString(req.body?.username);
    const email = normalizeString(req.body?.email).toLowerCase();
    const password = normalizeString(req.body?.password);

    if (!username || username.length < 3 || username.length > 30) {
        return res.status(400).json({ error: "Username must be between 3 and 30 characters" });
    }

    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email" });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (!JWT_SECRET) {
        return res.status(500).json({ error: "Server auth configuration error" });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });

        res.status(201).json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Signup failed", details: err.message });
    }
};

export const login = async (req, res) => {
    const email = normalizeString(req.body?.email).toLowerCase();
    const password = normalizeString(req.body?.password);

    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email" });
    }

    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }

    if (!JWT_SECRET) {
        return res.status(500).json({ error: "Server auth configuration error" });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        res.status(500).json({ error: "Login failed", details: err.message });
    }
};