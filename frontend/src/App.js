import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './styles/main.css';
import Navbar from "./components/Navbar";
import Footer from './components/Footer';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AskQuestion from "./pages/AskQuestion";
import QuestionPage from "./pages/QuestionPage";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/ask" element={<AskQuestion />} />
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;