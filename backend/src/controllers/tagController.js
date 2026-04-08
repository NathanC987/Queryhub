import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const normalizeTagName = (value) => (typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, "-") : "");

export const getAllTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            questions: true,
            followers: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(
      tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        questionCount: tag._count.questions,
        followerCount: tag._count.followers,
      }))
    );
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
};

export const getQuestionsByTag = async (req, res) => {
  const tagName = normalizeTagName(req.params?.name);

  if (!tagName) {
    return res.status(400).json({ error: "Invalid tag name" });
  }

  try {
    const tag = await prisma.tag.findUnique({
      where: { name: tagName },
      include: {
        questions: {
          include: {
            question: {
              include: {
                author: { select: { username: true } },
                votes: true,
                tags: { include: { tag: true } },
                _count: {
                  select: { answers: true },
                },
              },
            },
          },
        },
      },
    });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    const questions = tag.questions
      .map((entry) => entry.question)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((question) => ({
        ...question,
        voteCount: question.votes.reduce((sum, vote) => sum + vote.value, 0),
        answerCount: question._count.answers,
        hasAcceptedAnswer: Boolean(question.acceptedAnswerId),
      }));

    res.json({ tag: tag.name, questions });
  } catch (error) {
    console.error("Error fetching questions by tag:", error);
    res.status(500).json({ error: "Failed to fetch questions for tag" });
  }
};

export const followTag = async (req, res) => {
  const userId = req.user.userId;
  const tagName = normalizeTagName(req.params?.name);

  if (!tagName) {
    return res.status(400).json({ error: "Invalid tag name" });
  }

  try {
    const tag = await prisma.tag.findUnique({ where: { name: tagName } });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    await prisma.userTagFollow.upsert({
      where: {
        userId_tagId: {
          userId,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        userId,
        tagId: tag.id,
      },
    });

    res.json({ message: "Tag followed", tag: tag.name });
  } catch (error) {
    console.error("Error following tag:", error);
    res.status(500).json({ error: "Failed to follow tag" });
  }
};

export const unfollowTag = async (req, res) => {
  const userId = req.user.userId;
  const tagName = normalizeTagName(req.params?.name);

  if (!tagName) {
    return res.status(400).json({ error: "Invalid tag name" });
  }

  try {
    const tag = await prisma.tag.findUnique({ where: { name: tagName } });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    await prisma.userTagFollow.deleteMany({
      where: {
        userId,
        tagId: tag.id,
      },
    });

    res.json({ message: "Tag unfollowed", tag: tag.name });
  } catch (error) {
    console.error("Error unfollowing tag:", error);
    res.status(500).json({ error: "Failed to unfollow tag" });
  }
};

export const getFollowedTags = async (req, res) => {
  const userId = req.user.userId;

  try {
    const follows = await prisma.userTagFollow.findMany({
      where: { userId },
      include: {
        tag: {
          include: {
            _count: {
              select: {
                questions: true,
                followers: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(
      follows.map((follow) => ({
        id: follow.tag.id,
        name: follow.tag.name,
        questionCount: follow.tag._count.questions,
        followerCount: follow.tag._count.followers,
      }))
    );
  } catch (error) {
    console.error("Error fetching followed tags:", error);
    res.status(500).json({ error: "Failed to fetch followed tags" });
  }
};
