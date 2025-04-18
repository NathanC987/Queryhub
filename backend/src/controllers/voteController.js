import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const voteOnQuestion = async (req, res) => {
    const { questionId, value } = req.body;
    const userId = req.user.userId;

    if (![1, -1].includes(value)) {
        return res.status(400).json({ error: "Invalid vote value" });
    }

    try {
        const existingVote = await prisma.vote.findFirst({
            where: { userId, questionId },
        });

        let vote;

        if (existingVote) {
            // If vote already exists, update it
            if (existingVote.value === value) {
                // Toggle off the vote
                await prisma.vote.delete({ where: { id: existingVote.id } });
                return res.json({ value: 0 });
            } else {
                // Change the vote
                vote = await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { value },
                });
            }
        } else {
            // Else, create new vote
            vote = await prisma.vote.create({
                data: { userId, questionId, value },
            });
        }

        res.json({ userId, questionId, value });
    } catch (error) {
        console.error("Error voting on question:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const voteOnAnswer = async (req, res) => {
    const { answerId, value } = req.body;
    const userId = req.user.userId;

    if (![1, -1].includes(value)) {
        return res.status(400).json({ error: "Invalid vote value" });
    }

    try {
        const existingVote = await prisma.vote.findFirst({
            where: { userId, answerId },
        });

        let vote;

        if (existingVote) {
            if (existingVote.value === value) {
                // Toggle off the vote
                await prisma.vote.delete({ where: { id: existingVote.id } });
                return res.json({ value: 0 });
            } else {
                // Change the vote
                vote = await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { value },
                });
            }
        } else {
            vote = await prisma.vote.create({
                data: { userId, answerId, value },
            });
        }

        res.json(vote);
    } catch (error) {
        console.error("Error voting on answer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};