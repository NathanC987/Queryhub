import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        © {new Date().getFullYear()} QueryHub · Built by Nathan
      </div>
    </footer>
  );
};

export default Footer;
