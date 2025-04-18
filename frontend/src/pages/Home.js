import React, { useEffect, useState } from "react";
import API from "../api";
import QuestionCard from "../components/QuestionCard";

const Home = () => {
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await API.get("/questions");
                setQuestions(res.data);
            } catch (err) {
                console.error("Error fetching questions", err);
            }
        };

        fetchQuestions();
    }, []);

    return (
        <div className="home-container">
            <h2 className="home-title">Latest Questions</h2>
            {questions.length === 0 ? (
                <p>No questions yet.</p>
            ) : (
                questions.map((q) => <QuestionCard key={q.id} question={q} />)
            )}
        </div>
    );
};

export default Home;