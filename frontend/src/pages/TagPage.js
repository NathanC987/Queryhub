import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api";
import QuestionCard from "../components/QuestionCard";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};

const TagPage = () => {
  const { name } = useParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const user = getStoredUser();
  const userId = user?.id ?? null;

  useEffect(() => {
    const loadTagData = async () => {
      setLoading(true);

      try {
        const [tagQuestionsRes, followedTagsRes] = await Promise.all([
          API.get(`/tags/${name}/questions`),
          userId ? API.get("/tags/following") : Promise.resolve({ data: [] }),
        ]);

        setQuestions(tagQuestionsRes.data.questions || []);

        if (userId) {
          setIsFollowing(
            (followedTagsRes.data || []).some((tag) => tag.name === name)
          );
        }
      } catch (error) {
        console.error("Failed to load tag page", error);
      } finally {
        setLoading(false);
      }
    };

    loadTagData();
  }, [name, userId]);

  const handleFollowToggle = async () => {
    if (!user) {
      alert("Please log in to follow tags");
      return;
    }

    try {
      if (isFollowing) {
        await API.delete(`/tags/${name}/follow`);
        setIsFollowing(false);
      } else {
        await API.post(`/tags/${name}/follow`);
        setIsFollowing(true);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to update tag follow state");
    }
  };

  if (loading) {
    return <div className="loading-message">Loading tag page...</div>;
  }

  return (
    <div className="home-container">
      <div className="tag-page-header">
        <div>
          <h2 className="home-title">Tag: #{name}</h2>
          <Link to="/" className="tag-back-link">Back to all questions</Link>
        </div>
        {user && (
          <button className={`tag-follow-btn ${isFollowing ? "is-following" : ""}`} onClick={handleFollowToggle}>
            {isFollowing ? "Following" : "Follow tag"}
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <p>No questions found for this tag yet.</p>
      ) : (
        questions.map((q) => <QuestionCard key={q.id} question={q} />)
      )}
    </div>
  );
};

export default TagPage;
