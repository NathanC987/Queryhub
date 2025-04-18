import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const addAnswer = async (req, res) => {
    const { questionId, body } = req.body;
    const userId = req.user.userId;

    try {
        const newAnswer = await prisma.answer.create({
            data: {
                body,
                questionId,
                authorId: userId,
            },
        });
        res.status(201).json(newAnswer);
    } catch (err) {
        console.error("Error adding answer:", err);
        res.status(500).json({ error: "Could not post answer" });
    }
};

export const getAnswersByQuestion = async (req, res) => {
    const { questionId } = req.params;

    try {
        const answers = await prisma.answer.findMany({
            where: { questionId: parseInt(questionId) },
            include: {
                author: { select: { username: true } },
            },
        });
        res.json(answers);
    } catch (err) {
        console.error("Error fetching answers:", err);
        res.status(500).json({ error: "Could not fetch answers" });
    }
};