import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const AskQuestion = () => {
  const [formData, setFormData] = useState({ title: "", body: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/questions", formData);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to post question");
    }
  };

  return (
    <div className="ask-container">
      <h2 className="page-title">Ask a Question</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
          className="input"
        />
        <textarea
          name="body"
          placeholder="Question details..."
          value={formData.body}
          onChange={handleChange}
          required
          rows="6"
          className="textarea"
        />
        <button type="submit" className="question-button">
          Post Question
        </button>
      </form>
    </div>
  );
};

export default AskQuestion;