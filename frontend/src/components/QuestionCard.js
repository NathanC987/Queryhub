import React from "react";
import { Link } from "react-router-dom";
import { formatDateOnly, formatEditedMeta } from "../utils/dateMeta";

const QuestionCard = ({ question }) => {
  const voteCount = question.votes?.reduce((sum, v) => sum + v.value, 0) || 0;
  const answerCount = question._count?.answers || 0;
  const hasAcceptedAnswer = question.hasAcceptedAnswer || Boolean(question.acceptedAnswerId);
  const askedOn = formatDateOnly(question.createdAt);
  const editedMeta = formatEditedMeta(question.createdAt, question.updatedAt);

  return (
    <div className="question-card">
      <div className="question-card-header">
        <div className="question-card-stats">
          <span>{voteCount} votes</span>
          <span>{answerCount} answers</span>
        </div>
        <Link to={`/questions/${question.id}`} className="question-title-link">
          <h3 className="question-title">{question.title}</h3>
        </Link>
      </div>
      <p className="question-body">{question.body.slice(0, 150)}...</p>
      {question.tags?.length > 0 && (
        <div className="tag-chip-list compact">
          {question.tags.map((entry) => (
            <Link key={entry.id} to={`/tags/${entry.tag.name}`} className="tag-link-chip">
              #{entry.tag.name}
            </Link>
          ))}
        </div>
      )}
      {hasAcceptedAnswer && <p className="question-solved-badge">Solved</p>}
      <p className="question-author">
        Asked by <strong>{question.author.username}</strong> on {askedOn}
        {editedMeta}
      </p>
    </div>
  );
};

export default QuestionCard;