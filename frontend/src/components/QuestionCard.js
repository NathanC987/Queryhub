import React from "react";
import { Link } from "react-router-dom";

const QuestionCard = ({ question }) => {
  const voteCount = question.votes?.reduce((sum, v) => sum + v.value, 0) || 0;
  const answerCount = question._count?.answers || 0;
  const hasAcceptedAnswer = question.hasAcceptedAnswer || Boolean(question.acceptedAnswerId);

  return (
    <div className="question-card">
      <div className="question-card-header">
        <Link to={`/questions/${question.id}`} className="question-title-link">
          <h3 className="question-title">{question.title}</h3>
        </Link>
        <div className="question-meta">
          <span>{voteCount} votes</span>
          <span>{answerCount} answers</span>
        </div>
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
      <p className="question-author">Asked by <strong>{question.author.username}</strong></p>
    </div>
  );
};

export default QuestionCard;