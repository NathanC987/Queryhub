import React, { useState } from "react";
import API from "../api";

const AnswerCard = ({ answer }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  const initialVoteCount = answer.votes
    ? answer.votes.reduce((sum, v) => sum + v.value, 0)
    : 0;

  const existingUserVote = answer.votes?.find((v) => v.userId === user?.id);
  const [votes, setVotes] = useState(initialVoteCount);
  const [userVoteValue, setUserVoteValue] = useState(existingUserVote?.value || 0);

  const handleVote = async (value) => {
    try {
      const res = await API.post("/votes/answer", {
        answerId: answer.id,
        value,
      });

      const newVoteValue = res.data.value;
      const oldValue = userVoteValue;

      setVotes((prev) => prev - oldValue + newVoteValue);
      setUserVoteValue(newVoteValue);

      const existingVote = answer.votes?.find((v) => v.userId === user.id);
      if (existingVote) {
        existingVote.value = newVoteValue;
      } else {
        answer.votes = [...(answer.votes || []), { userId: user.id, value: newVoteValue }];
      }
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