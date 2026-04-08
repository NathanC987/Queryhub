import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

export const addAnswer = async (req, res) => {
    const questionId = Number.parseInt(req.body?.questionId, 10);
    const body = normalizeString(req.body?.body);
    const userId = req.user.userId;

    if (!Number.isInteger(questionId)) {
        return res.status(400).json({ error: "Invalid question id" });
    }

    if (!body || body.length < 5) {
        return res.status(400).json({ error: "Answer body must be at least 5 characters" });
    }

    try {
        const question = await prisma.question.findUnique({ where: { id: questionId } });

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        const newAnswer = await prisma.answer.create({
            data: {
                body,
                questionId,
                authorId: userId,
            },
            include: {
                author: {
                    select: { username: true },
                },
                votes: true,
            },
        });

        const voteCount = newAnswer.votes.reduce((sum, vote) => sum + vote.value, 0);
        res.status(201).json({ ...newAnswer, voteCount });
    } catch (err) {
        console.error("Error adding answer:", err);
        res.status(500).json({ error: "Could not post answer" });
    }
};

export const getAnswersByQuestion = async (req, res) => {
    const { questionId } = req.params;
    const parsedQuestionId = Number.parseInt(questionId, 10);

    if (!Number.isInteger(parsedQuestionId)) {
        return res.status(400).json({ error: "Invalid question id" });
    }

    try {
        const answers = await prisma.answer.findMany({
            where: { questionId: parsedQuestionId },
            include: {
                author: { select: { username: true } },
                votes: true,
            },
        });

        const answersWithVotes = answers.map((answer) => ({
            ...answer,
            voteCount: answer.votes.reduce((sum, vote) => sum + vote.value, 0),
        }));

        res.json(answersWithVotes);
    } catch (err) {
        console.error("Error fetching answers:", err);
        res.status(500).json({ error: "Could not fetch answers" });
    }
};