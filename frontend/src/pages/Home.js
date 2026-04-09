import React, { useEffect, useState } from "react";
import API from "../api";
import QuestionCard from "../components/QuestionCard";
import { Link, useSearchParams } from "react-router-dom";

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
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("q")?.trim() || "";
    const statusFilter = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sort") || "newest";
    const selectedTags = (() => {
        const tagsParam = searchParams.get("tags");
        const normalized = tagsParam ? [...new Set(tagsParam.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))] : [];
        const legacyTag = searchParams.get("tag");
        if (legacyTag && !normalized.includes(legacyTag)) {
            normalized.push(legacyTag);
        }
        return normalized;
    })();
    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const user = getStoredUser();
    const userId = user?.id ?? null;

    const updateParams = (mutator) => {
        const next = new URLSearchParams(searchParams);
        mutator(next);
        setSearchParams(next);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [questionsRes, tagsRes, followedTagsRes] = await Promise.all([
                    API.get("/questions", {
                        params: {
                            ...(selectedTags.length > 0 ? { tags: selectedTags.join(",") } : {}),
                            ...(searchQuery ? { q: searchQuery } : {}),
                            status: statusFilter,
                            sort: sortBy,
                            page,
                            limit: 10,
                        },
                    }),
                    API.get("/tags"),
                    userId ? API.get("/tags/following") : Promise.resolve({ data: [] }),
                ]);

                setQuestions(questionsRes.data?.items || []);
                setPagination(questionsRes.data?.pagination || {
                    page: 1,
                    totalItems: 0,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                });
                setTags(tagsRes.data);
                setFollowedTags(followedTagsRes.data || []);
            } catch (err) {
                console.error("Error fetching home data", err);
            }
        };

        fetchData();
    }, [page, searchQuery, selectedTags, sortBy, statusFilter, userId]);

    const handleTagToggle = (tagName) => {
        updateParams((params) => {
            const current = params.get("tags")
                ? [...new Set(params.get("tags").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
                : [];

            const exists = current.includes(tagName);
            const nextTags = exists ? current.filter((tag) => tag !== tagName) : [...current, tagName];

            params.delete("tag");
            if (nextTags.length === 0) {
                params.delete("tags");
            } else {
                params.set("tags", nextTags.join(","));
            }
            params.delete("page");
        });
    };

    const handleStatusSelect = (statusValue) => {
        updateParams((params) => {
            if (statusValue === "all") {
                params.delete("status");
            } else {
                params.set("status", statusValue);
            }
            params.delete("page");
        });
    };

    const handleSortCheckbox = (sortValue) => {
        updateParams((params) => {
            const currentSort = params.get("sort") || "newest";
            if (currentSort === sortValue) {
                params.delete("sort");
            } else {
                params.set("sort", sortValue);
            }
            params.delete("page");
        });
    };

    const clearAllFilters = () => {
        updateParams((params) => {
            params.delete("q");
            params.delete("status");
            params.delete("sort");
            params.delete("tag");
            params.delete("tags");
            params.delete("page");
        });
        setIsFilterPanelOpen(false);
    };

    const handlePageChange = (nextPage) => {
        updateParams((params) => {
            if (nextPage <= 1) {
                params.delete("page");
            } else {
                params.set("page", String(nextPage));
            }
        });
    };

    return (
        <div className="home-container">
            <h2 className="home-title">Latest Questions</h2>

            <div className="home-summary-row">
                <p className="total-questions-text">{pagination.totalItems || 0} questions</p>

                <div className="home-inline-filters">
                    <div className="status-filter-bar" role="tablist" aria-label="Question status filters">
                        {["all", "answered", "unanswered", "solved", "unsolved"].map((status) => (
                            <button
                                key={status}
                                type="button"
                                className={`status-filter-btn ${statusFilter === status ? "active" : ""}`}
                                onClick={() => handleStatusSelect(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="filter-open-btn"
                        onClick={() => setIsFilterPanelOpen((prev) => !prev)}
                    >
                        Filter
                    </button>

                    <button type="button" className="clear-all-filters-btn" onClick={clearAllFilters}>
                        Reset
                    </button>
                </div>
            </div>

            {isFilterPanelOpen && (
                <div className="inline-filter-panel">
                    <div className="inline-filter-block sort-column">
                        <p className="inline-filter-heading">Sort</p>
                        <div className="sort-radio-list">
                            {[
                                { value: "newest", label: "Newest" },
                                { value: "oldest", label: "Oldest" },
                                { value: "most-votes", label: "Most Votes" },
                                { value: "most-answers", label: "Most Answers" },
                                { value: "recently-updated", label: "Recently Updated" },
                            ].map((option) => (
                                <label key={option.value} className="sort-radio-option">
                                    <input
                                        type="radio"
                                        name="sort-option"
                                        checked={sortBy === option.value}
                                        onChange={() => handleSortCheckbox(option.value)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="inline-filter-block tags-column">
                        <p className="inline-filter-heading">Tag filters</p>
                        <div className="tag-chip-list">
                            {tags.slice(0, 16).map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    className={`tag-chip ${selectedTags.includes(tag.name) ? "active" : ""}`}
                                    onClick={() => handleTagToggle(tag.name)}
                                >
                                    #{tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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

            {pagination.totalPages > 1 && (
                <div className="pagination-controls">
                    <button
                        type="button"
                        className="pagination-btn"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!pagination.hasPrevPage}
                    >
                        Previous
                    </button>
                    <span className="pagination-info">Page {pagination.page} of {pagination.totalPages}</span>
                    <button
                        type="button"
                        className="pagination-btn"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!pagination.hasNextPage}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Home;