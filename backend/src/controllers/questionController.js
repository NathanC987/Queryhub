import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createQuestion = async (req, res) => {
    const { title, body } = req.body;
    const authorId = req.user.userId;

    try {
        const question = await prisma.question.create({
            data: { title, body, authorId },
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
    const { title, body } = req.body;
    const { id } = req.params;
    const userId = req.user.userId;
  
    try {
        const existing = await prisma.question.findUnique({ where: { id: parseInt(id) } });
    
        if (!existing) return res.status(404).json({ error: "Question not found" });
        if (existing.authorId !== userId) return res.status(403).json({ error: "Unauthorized" });
    
        const updated = await prisma.question.update({
            where: { id: parseInt(id) },
            data: { title, body },
        });
    
        res.json(updated);
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: "Failed to update question" });
    }
};
  
export const deleteQuestion = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
  
    try {
        const existing = await prisma.question.findUnique({ where: { id: parseInt(id) } });
    
        if (!existing) return res.status(404).json({ error: "Question not found" });
        if (existing.authorId !== userId) return res.status(403).json({ error: "Unauthorized" });
    
        await prisma.question.delete({ where: { id: parseInt(id) } });
    
        res.json({ message: "Question deleted successfully" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Failed to delete question" });
    }
};

export const getQuestionDetails = async (req, res) => {
    const { id } = req.params;
  
    try {
        const question = await prisma.question.findUnique({
            where: { id: parseInt(id) },
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