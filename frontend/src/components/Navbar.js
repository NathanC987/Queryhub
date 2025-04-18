import React from "react";
import { Link, useNavigate } from "react-router-dom";
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        QueryHub
      </Link>

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