import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";
import AnswerCard from "../components/AnswerCard";

const QuestionPage = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [questionVotes, setQuestionVotes] = useState(0);
  const [userVoteValue, setUserVoteValue] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedBody, setEditedBody] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await API.get(`/questions/${id}`);
        console.log("Fetched Question Data:", res.data.question);
        const q = res.data.question;
        setQuestion(q);

        const voteCount = q.votes ? q.votes.reduce((sum, v) => sum + v.value, 0) : 0;
        setQuestionVotes(voteCount);

        const existingVote = q.votes?.find((v) => v.userId === user?.id);
        setUserVoteValue(existingVote?.value || 0);

        setAnswers(res.data.answers);

        setEditedTitle(q.title);
        setEditedBody(q.body);

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch question", err);
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id, user?.id]);

  const handleQuestionVote = async (value) => {
    try {
      const res = await API.post("/votes/question", {
        questionId: question.id,
        value,
      });

      const newVoteValue = res.data.value;

      const votesArray = question.votes || [];

      const existingVoteIndex = votesArray.findIndex((v) => v.userId === user.id);

      let updatedVotes;
      if (existingVoteIndex !== -1) {
        if (newVoteValue === 0) {
          updatedVotes = votesArray.filter((v) => v.userId !== user.id);
        } else {
          updatedVotes = [...votesArray];
          updatedVotes[existingVoteIndex].value = newVoteValue;
        }
      } else if (newVoteValue !== 0) {
        updatedVotes = [...votesArray, { userId: user.id, value: newVoteValue }];
      } else {
        updatedVotes = votesArray;
      }

      setQuestion({ ...question, votes: updatedVotes });

      const total = updatedVotes.reduce((sum, v) => sum + v.value, 0);
      setQuestionVotes(total);
      setUserVoteValue(newVoteValue);
    } catch (err) {
      alert(err.response?.data?.error || "Vote failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post(`/answers/${id}`, { body: newAnswer });
      setAnswers([...answers, res.data]);
      setNewAnswer("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to post answer");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await API.delete(`/questions/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      alert("Question deleted.");
      window.location.href = "/";
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete question");
    }
  };

  const handleUpdate = async () => {
    try {
      await API.put(`/questions/${id}`, {
        title: editedTitle,
        body: editedBody,
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setQuestion({ ...question, title: editedTitle, body: editedBody });
      setIsEditing(false);
      alert("Question updated.");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update question");
    }
  };

  if (loading) return <div className="loading-message">Loading...</div>;
  if (!question) return <div className="loading-message">Question not found</div>;

  return (
    <div className="question-page">
      <div className="question-header">
        <div className="vote-buttons">
          <button
            onClick={() => handleQuestionVote(1)}
            className={userVoteValue === 1 ? "voted-up" : ""}
          >
            ▲
          </button>
          <span>{questionVotes}</span>
          <button
            onClick={() => handleQuestionVote(-1)}
            className={userVoteValue === -1 ? "voted-down" : ""}
          >
            ▼
          </button>
        </div>

        {/* Show editable form or static content */}
        {isEditing ? (
          <div className="edit-question-form">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="edit-title-input"
            />
            <textarea
              rows="4"
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="edit-body-textarea"
            />
            <div className="edit-actions">
              <button onClick={handleUpdate} className="btn save-btn">Save</button>
              <button onClick={() => setIsEditing(false)} className="btn cancel-btn">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="question-content">
            <h2 className="question-title">{question.title}</h2>
            <p className="question-body">{question.body}</p>
            <p className="question-meta">Asked by {question.author.username}</p>

            {/* Edit & Delete Buttons - Only for author */}
            {user?.id === question.authorId && (
              <div className="question-actions">
                <button className="btn edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                <button className="btn delete-btn" onClick={handleDelete}>Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="divider" />

      <h3 className="answers-title">Answers</h3>
      {answers.length === 0 ? (
        <p className="no-answers">No answers yet.</p>
      ) : (
        answers.map((a) => <AnswerCard key={a.id} answer={a} />)
      )}

      {user && (
        <form onSubmit={handleSubmit} className="answer-form">
          <textarea
            rows="4"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Write your answer..."
            required
            className="answer-textarea"
          />
          <button type="submit" className="answer-button">
            Post Answer
          </button>
        </form>
      )}
    </div>
  );
};

export default QuestionPage;