import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import '../styles/Navbar.css';

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setSearchText(q);
  }, [location.search]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    const params = new URLSearchParams(location.pathname === "/" ? location.search : "");

    if (!trimmed) {
      params.delete("q");
    } else {
      params.set("q", trimmed);
    }

    params.delete("page");

    const query = params.toString();
    navigate(query ? `/?${query}` : "/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        QueryHub
      </Link>

      <form onSubmit={handleSearchSubmit} className="navbar-search-form">
        <input
          type="text"
          className="navbar-search-input"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search questions..."
        />
      </form>

      <div className="navbar-links">
        {user && <span className="greeting">Hello, {user.username}</span>}
        <Link to="/">Home</Link>
        {user ? (
          <>
            <Link to="/ask">Ask</Link>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;