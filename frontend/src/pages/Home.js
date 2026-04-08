import React, { useEffect, useState } from "react";
import API from "../api";
import QuestionCard from "../components/QuestionCard";
import { Link } from "react-router-dom";

const getStoredUser = () => {
    try {
        const rawUser = localStorage.getItem("user");
        return rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
        return null;
    }
};

const Home = () => {
    const [questions, setQuestions] = useState([]);
    const [tags, setTags] = useState([]);
    const [followedTags, setFollowedTags] = useState([]);
    const [activeTag, setActiveTag] = useState("");
    const user = getStoredUser();
    const userId = user?.id ?? null;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [questionsRes, tagsRes, followedTagsRes] = await Promise.all([
                    API.get("/questions", { params: activeTag ? { tag: activeTag } : {} }),
                    API.get("/tags"),
                    userId ? API.get("/tags/following") : Promise.resolve({ data: [] }),
                ]);

                setQuestions(questionsRes.data);
                setTags(tagsRes.data);
                setFollowedTags(followedTagsRes.data || []);
            } catch (err) {
                console.error("Error fetching home data", err);
            }
        };

        fetchData();
    }, [activeTag, userId]);

    const handleTagToggle = (tagName) => {
        setActiveTag((prev) => (prev === tagName ? "" : tagName));
    };

    return (
        <div className="home-container">
            <h2 className="home-title">Latest Questions</h2>

            <div className="tag-filter-section">
                <p className="filter-title">Quick filters</p>
                <div className="tag-chip-list">
                    {tags.slice(0, 12).map((tag) => (
                        <button
                            key={tag.id}
                            type="button"
                            className={`tag-chip ${activeTag === tag.name ? "active" : ""}`}
                            onClick={() => handleTagToggle(tag.name)}
                        >
                            #{tag.name}
                        </button>
                    ))}
                </div>
                {activeTag && (
                    <p className="active-filter-text">
                        Showing questions for #{activeTag}. <button type="button" className="clear-filter-btn" onClick={() => setActiveTag("")}>Clear</button>
                    </p>
                )}
            </div>

            {user && followedTags.length > 0 && (
                <div className="tag-filter-section">
                    <p className="filter-title">Followed tags</p>
                    <div className="tag-chip-list">
                        {followedTags.map((tag) => (
                            <Link key={tag.id} to={`/tags/${tag.name}`} className="tag-link-chip">
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {questions.length === 0 ? (
                <p>No questions yet.</p>
            ) : (
                questions.map((q) => <QuestionCard key={q.id} question={q} />)
            )}
        </div>
    );
};

export default Home;