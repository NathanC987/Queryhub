import React, { useState } from "react";
import API from "../api";
import MarkdownContent from "./MarkdownContent";
import { formatDateOnly, formatEditedMeta } from "../utils/dateMeta";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};

const AnswerCard = ({ answer, isAccepted, canAccept, onAccept, onUnaccept }) => {
  const user = getStoredUser();
  const answeredOn = formatDateOnly(answer.createdAt);
  const editedMeta = formatEditedMeta(answer.createdAt, answer.updatedAt);

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
    <div className={`answer-card ${isAccepted ? "accepted-answer-card" : ""}`}>
      <div className="answer-card-top-row">
        {isAccepted && <span className="accepted-answer-badge">Accepted Answer</span>}
        {canAccept && (
          isAccepted ? (
            <button onClick={onUnaccept} className="accept-answer-btn unaccept-answer-btn">
              Unaccept
            </button>
          ) : (
            <button onClick={onAccept} className="accept-answer-btn">
              Accept
            </button>
          )
        )}
      </div>
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
      <MarkdownContent content={answer.body} />
      <p className="answer-meta">
        Answered by <strong>{answer.author ? answer.author.username : "Unknown"}</strong> on {answeredOn}
        {editedMeta}
      </p>
    </div>
  );
};

export default AnswerCard;