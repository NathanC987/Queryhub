import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const MAX_TAGS = 5;

const normalizeTagName = (value) => value.trim().toLowerCase().replace(/\s+/g, "-");

const AskQuestion = () => {
  const [formData, setFormData] = useState({ title: "", body: "", tags: [] });
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await API.get("/tags");
        setAvailableTags(res.data || []);
      } catch (error) {
        console.error("Failed to fetch tags", error);
      }
    };

    fetchTags();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.tags.length === 0) {
      alert("Please add at least one tag");
      return;
    }

    try {
      await API.post("/questions", formData);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to post question");
    }
  };

  const addTag = (rawTag) => {
    const tag = normalizeTagName(rawTag);
    if (!tag) return;

    if (formData.tags.includes(tag)) {
      setTagInput("");
      return;
    }

    if (formData.tags.length >= MAX_TAGS) {
      alert(`You can add up to ${MAX_TAGS} tags`);
      return;
    }

    setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setTagInput("");
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const filteredSuggestions = availableTags
    .filter((tag) => tag.name.includes(normalizeTagName(tagInput)))
    .filter((tag) => !formData.tags.includes(tag.name))
    .slice(0, 8);

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
          placeholder="Question details in Markdown..."
          value={formData.body}
          onChange={handleChange}
          required
          rows="6"
          className="textarea"
        />
        <p className="markdown-help-text">
          Supports Markdown: headings, lists, links, inline code, and fenced code blocks.
        </p>

        <div className="tag-input-section">
          <label className="tag-label">Tags (up to 5)</label>
          <div className="tag-input-row">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Type a tag and press Enter"
              className="input"
            />
            <button type="button" className="tag-add-btn" onClick={() => addTag(tagInput)}>
              Add tag
            </button>
          </div>

          {filteredSuggestions.length > 0 && (
            <div className="tag-suggestion-list">
              {filteredSuggestions.map((tag) => (
                <button key={tag.id} type="button" className="tag-suggestion-chip" onClick={() => addTag(tag.name)}>
                  #{tag.name}
                </button>
              ))}
            </div>
          )}

          <div className="tag-chip-list">
            {formData.tags.map((tag) => (
              <span key={tag} className="tag-chip selected">
                #{tag}
                <button type="button" className="tag-remove-btn" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" className="question-button">
          Post Question
        </button>
      </form>
    </div>
  );
};

export default AskQuestion;