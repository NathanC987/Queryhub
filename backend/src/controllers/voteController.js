import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const parseVoteValue = (rawValue) => Number.parseInt(rawValue, 10);

const voteResponse = ({ userId, targetType, targetId, value }) => ({
    userId,
    targetType,
    targetId,
    value,
});

export const voteOnQuestion = async (req, res) => {
    const questionId = Number.parseInt(req.body?.questionId, 10);
    const value = parseVoteValue(req.body?.value);
    const userId = req.user.userId;

    if (!Number.isInteger(questionId)) {
        return res.status(400).json({ error: "Invalid question id" });
    }

    if (![1, -1].includes(value)) {
        return res.status(400).json({ error: "Invalid vote value" });
    }

    try {
        const existingVote = await prisma.vote.findFirst({
            where: { userId, questionId },
        });

        if (existingVote) {
            if (existingVote.value === value) {
                await prisma.vote.delete({ where: { id: existingVote.id } });
                return res.json(
                    voteResponse({
                        userId,
                        targetType: "question",
                        targetId: questionId,
                        value: 0,
                    })
                );
            } else {
                await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { value },
                });
            }
        } else {
            await prisma.vote.create({
                data: { userId, questionId, value },
            });
        }

        res.json(
            voteResponse({
                userId,
                targetType: "question",
                targetId: questionId,
                value,
            })
        );
    } catch (error) {
        console.error("Error voting on question:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const voteOnAnswer = async (req, res) => {
    const answerId = Number.parseInt(req.body?.answerId, 10);
    const value = parseVoteValue(req.body?.value);
    const userId = req.user.userId;

    if (!Number.isInteger(answerId)) {
        return res.status(400).json({ error: "Invalid answer id" });
    }

    if (![1, -1].includes(value)) {
        return res.status(400).json({ error: "Invalid vote value" });
    }

    try {
        const existingVote = await prisma.vote.findFirst({
            where: { userId, answerId },
        });

        if (existingVote) {
            if (existingVote.value === value) {
                await prisma.vote.delete({ where: { id: existingVote.id } });
                return res.json(
                    voteResponse({
                        userId,
                        targetType: "answer",
                        targetId: answerId,
                        value: 0,
                    })
                );
            } else {
                await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { value },
                });
            }
        } else {
            await prisma.vote.create({
                data: { userId, answerId, value },
            });
        }

        res.json(
            voteResponse({
                userId,
                targetType: "answer",
                targetId: answerId,
                value,
            })
        );
    } catch (error) {
        console.error("Error voting on answer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};