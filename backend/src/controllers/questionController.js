import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const validateQuestionPayload = ({ title, body }) => {
    const normalizedTitle = normalizeString(title);
    const normalizedBody = normalizeString(body);

    if (!normalizedTitle || normalizedTitle.length < 5 || normalizedTitle.length > 200) {
        return { error: "Title must be between 5 and 200 characters" };
    }

    if (!normalizedBody || normalizedBody.length < 10) {
        return { error: "Question body must be at least 10 characters" };
    }

    return { normalizedTitle, normalizedBody };
};

export const createQuestion = async (req, res) => {
    const authorId = req.user.userId;
    const validation = validateQuestionPayload(req.body || {});

    if (validation.error) {
        return res.status(400).json({ error: validation.error });
    }

    try {
        const question = await prisma.question.create({
            data: {
                title: validation.normalizedTitle,
                body: validation.normalizedBody,
                authorId,
            },
        });
        res.status(201).json(question);
    } catch (err) {
        console.error("Create Question Error:", err);
        res.status(500).json({ error: "Failed to create question" });
    }
};

export const getAllQuestions = async (req, res) => {
    try {
        const questions = await prisma.question.findMany({
            include: {
                author: { select: { username: true } },
                votes: true,
                _count: {
                    select: { answers: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const questionsWithVotes = questions.map((question) => {
            const voteCount = Array.isArray(question.votes)
                ? question.votes.reduce((sum, v) => sum + v.value, 0)
                : 0;
            return {
                ...question,
                voteCount,
                answerCount: question._count.answers,
            };
        });

        res.json(questionsWithVotes);
    } catch (err) {
        console.error("Fetch Questions Error:", err);
        res.status(500).json({ error: "Failed to fetch questions" });
    }
};

export const updateQuestion = async (req, res) => {
    const { id } = req.params;
    const questionId = Number.parseInt(id, 10);
    const userId = req.user.userId;
    const validation = validateQuestionPayload(req.body || {});

    if (!Number.isInteger(questionId)) {
        return res.status(400).json({ error: "Invalid question id" });
    }

    if (validation.error) {
        return res.status(400).json({ error: validation.error });
    }
  
    try {
        const existing = await prisma.question.findUnique({ where: { id: questionId } });
    
        if (!existing) return res.status(404).json({ error: "Question not found" });
        if (existing.authorId !== userId) return res.status(403).json({ error: "Unauthorized" });
    
        const updated = await prisma.question.update({
            where: { id: questionId },
            data: {
                title: validation.normalizedTitle,
                body: validation.normalizedBody,
            },
        });
    
        res.json(updated);
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: "Failed to update question" });
    }
};
  
export const deleteQuestion = async (req, res) => {
    const { id } = req.params;
    const questionId = Number.parseInt(id, 10);
    const userId = req.user.userId;

    if (!Number.isInteger(questionId)) {
        return res.status(400).json({ error: "Invalid question id" });
    }
  
    try {
        const existing = await prisma.question.findUnique({ where: { id: questionId } });
    
        if (!existing) return res.status(404).json({ error: "Question not found" });
        if (existing.authorId !== userId) return res.status(403).json({ error: "Unauthorized" });
    
        await prisma.question.delete({ where: { id: questionId } });
    
        res.json({ message: "Question deleted successfully" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Failed to delete question" });
    }
};

export const getQuestionDetails = async (req, res) => {
    const { id } = req.params;
    const questionId = Number.parseInt(id, 10);

    if (!Number.isInteger(questionId)) {
        return res.status(400).json({ error: "Invalid question id" });
    }
  
    try {
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                author: { select: { username: true } },
                votes: true,
                answers: {
                    include: {
                        author: { select: { username: true } },
                        votes: true,
                    },
                },
                tags: { include: { tag: true } },
            },
        });
  
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }
  
        // Calculate vote counts
        const questionVoteCount = question.votes.reduce((sum, vote) => sum + vote.value, 0);
  
        const answersWithVotes = question.answers.map((answer) => {
            const voteCount = answer.votes.reduce((sum, vote) => sum + vote.value, 0);
            return {
                ...answer,
                voteCount,
            };
        });

        res.json({
            question: {
                id: question.id,
                title: question.title,
                body: question.body,
                author: question.author,
                authorId: question.authorId,
                voteCount: questionVoteCount,
                votes: question.votes,
                tags: question.tags,
                createdAt: question.createdAt,
            },
            answers: answersWithVotes,
        });
    } catch (error) {
        console.error("Error fetching question details:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};  