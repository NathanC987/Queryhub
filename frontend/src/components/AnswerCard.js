import React, { useState } from "react";
import API from "../api";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};

const AnswerCard = ({ answer }) => {
  const user = getStoredUser();

  const initialVoteCount = answer.votes
    ? answer.votes.reduce((sum, v) => sum + v.value, 0)
    : 0;

  const existingUserVote = answer.votes?.find((v) => v.userId === user?.id);
  const [votes, setVotes] = useState(initialVoteCount);
  const [userVoteValue, setUserVoteValue] = useState(existingUserVote?.value || 0);

  const handleVote = async (value) => {
    if (!user) {
      alert("Please log in to vote");
      return;
    }

    try {
      const res = await API.post("/votes/answer", {
        answerId: answer.id,
        value,
      });

      const newVoteValue = res.data.value;
      const oldValue = userVoteValue;

      setVotes((prev) => prev - oldValue + newVoteValue);
      setUserVoteValue(newVoteValue);
    } catch (err) {
      alert(err.response?.data?.error || "Vote failed");
    }
  };

  return (
    <div className="answer-card">
      <div className="vote-buttons">
        <button
          onClick={() => handleVote(1)}
          className={userVoteValue === 1 ? "voted-up" : ""}
        >
          ▲
        </button>
        <span>{votes}</span>
        <button
          onClick={() => handleVote(-1)}
          className={userVoteValue === -1 ? "voted-down" : ""}
        >
          ▼
        </button>
      </div>
      <p>{answer.body}</p>
      <p className="answer-meta">Answered by {answer.author ? answer.author.username : "Unknown"}</p>
    </div>
  );
};

export default AnswerCard;