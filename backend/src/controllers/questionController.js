import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const MAX_TAGS_PER_QUESTION = 5;
const TAG_NAME_REGEX = /^[a-z0-9-]{1,30}$/;

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

const normalizeTagName = (value) => normalizeString(value).toLowerCase().replace(/\s+/g, "-");

const parseAndValidateTags = (tagsInput, required = false) => {
    if (tagsInput === undefined || tagsInput === null) {
        if (required) {
            return { error: "At least one tag is required" };
        }

        return { tags: undefined };
    }

    if (!Array.isArray(tagsInput)) {
        return { error: "Tags must be an array" };
    }

    const normalizedTags = [...new Set(tagsInput.map(normalizeTagName).filter(Boolean))];

    if (required && normalizedTags.length === 0) {
        return { error: "At least one tag is required" };
    }

    if (normalizedTags.length > MAX_TAGS_PER_QUESTION) {
        return { error: `A question can have up to ${MAX_TAGS_PER_QUESTION} tags` };
    }

    const invalidTag = normalizedTags.find((tag) => !TAG_NAME_REGEX.test(tag));
    if (invalidTag) {
        return {
            error: "Tags must be 1-30 chars and use lowercase letters, numbers, or hyphens",
        };
    }

    return { tags: normalizedTags };
};

const buildTagCreateData = (tags) => {
    return tags.map((name) => ({
        tag: {
            connectOrCreate: {
                where: { name },
                create: { name },
            },
        },
    }));
};

export const createQuestion = async (req, res) => {
    const authorId = req.user.userId;
    const validation = validateQuestionPayload(req.body || {});
    const tagValidation = parseAndValidateTags(req.body?.tags, true);

    if (validation.error) {
        return res.status(400).json({ error: validation.error });
    }

    if (tagValidation.error) {
        return res.status(400).json({ error: tagValidation.error });
    }

    try {
        const question = await prisma.question.create({
            data: {
                title: validation.normalizedTitle,
                body: validation.normalizedBody,
                authorId,
                tags: {
                    create: buildTagCreateData(tagValidation.tags),
                },
            },
            include: {
                tags: { include: { tag: true } },
            },
        });
        res.status(201).json(question);
    } catch (err) {
        console.error("Create Question Error:", err);
        res.status(500).json({ error: "Failed to create question" });
    }
};

export const getAllQuestions = async (req, res) => {
    const tagFilter = normalizeTagName(req.query?.tag || "");

    try {
        const questions = await prisma.question.findMany({
            where: tagFilter
                ? {
                    tags: {
                        some: {
                            tag: {
                                name: tagFilter,
                            },
                        },
                    },
                }
                : undefined,
            include: {
                author: { select: { username: true } },
                votes: true,
                tags: { include: { tag: true } },
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
                hasAcceptedAnswer: Boolean(question.acceptedAnswerId),
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
    const tagValidation = parseAndValidateTags(req.body?.tags, false);

    if (!Number.isInteger(questionId)) {
        return res.status(400).json({ error: "Invalid question id" });
    }

    if (validation.error) {
        return res.status(400).json({ error: validation.error });
    }

    if (tagValidation.error) {
        return res.status(400).json({ error: tagValidation.error });
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
                ...(tagValidation.tags !== undefined
                    ? {
                        tags: {
                            deleteMany: {},
                            create: buildTagCreateData(tagValidation.tags),
                        },
                    }
                    : {}),
            },
            include: {
                tags: { include: { tag: true } },
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

        await prisma.$transaction(async (tx) => {
            const answers = await tx.answer.findMany({
                where: { questionId },
                select: { id: true },
            });

            const answerIds = answers.map((answer) => answer.id);

            await tx.questionTag.deleteMany({ where: { questionId } });
            await tx.vote.deleteMany({ where: { questionId } });

            if (answerIds.length > 0) {
                await tx.vote.deleteMany({
                    where: {
                        answerId: {
                            in: answerIds,
                        },
                    },
                });
            }

            await tx.answer.deleteMany({ where: { questionId } });
            await tx.question.delete({ where: { id: questionId } });
        });
    
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
                acceptedAnswer: { select: { id: true } },
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
                isAccepted: question.acceptedAnswerId === answer.id,
            };
        }).sort((a, b) => {
            if (a.isAccepted && !b.isAccepted) return -1;
            if (!a.isAccepted && b.isAccepted) return 1;
            return 0;
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
                updatedAt: question.updatedAt,
                acceptedAnswerId: question.acceptedAnswerId,
            },
            answers: answersWithVotes,
        });
    } catch (error) {
        console.error("Error fetching question details:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const acceptAnswer = async (req, res) => {
    const { id } = req.params;
    const questionId = Number.parseInt(id, 10);
    const answerId = Number.parseInt(req.body?.answerId, 10);
    const userId = req.user.userId;

    if (!Number.isInteger(questionId)) {
        return res.status(400).json({ error: "Invalid question id" });
    }

    if (!Number.isInteger(answerId)) {
        return res.status(400).json({ error: "Invalid answer id" });
    }

    try {
        const question = await prisma.question.findUnique({ where: { id: questionId } });

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        if (question.authorId !== userId) {
            return res.status(403).json({ error: "Only the question owner can accept an answer" });
        }

        const answer = await prisma.answer.findUnique({ where: { id: answerId } });

        if (!answer || answer.questionId !== questionId) {
            return res.status(404).json({ error: "Answer not found for this question" });
        }

        await prisma.question.update({
            where: { id: questionId },
            data: { acceptedAnswerId: answerId },
        });

        res.json({
            message: "Answer accepted",
            questionId,
            acceptedAnswerId: answerId,
        });
    } catch (error) {
        console.error("Error accepting answer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const unacceptAnswer = async (req, res) => {
    const { id } = req.params;
    const questionId = Number.parseInt(id, 10);
    const userId = req.user.userId;

    if (!Number.isInteger(questionId)) {
        return res.status(400).json({ error: "Invalid question id" });
    }

    try {
        const question = await prisma.question.findUnique({ where: { id: questionId } });

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        if (question.authorId !== userId) {
            return res.status(403).json({ error: "Only the question owner can unaccept an answer" });
        }

        if (!question.acceptedAnswerId) {
            return res.status(400).json({ error: "No accepted answer to remove" });
        }

        await prisma.question.update({
            where: { id: questionId },
            data: { acceptedAnswerId: null },
        });

        res.json({
            message: "Accepted answer removed",
            questionId,
            acceptedAnswerId: null,
        });
    } catch (error) {
        console.error("Error unaccepting answer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
