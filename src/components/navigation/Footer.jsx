import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <span className="logo-text footer-logo">SmartLearn</span>
          <p className="body-sm footer-desc">
            Empowering global education with modern, accessible learning tools.
          </p>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4 className="label-md footer-heading">Platform</h4>
            <Link to="/catalog" className="footer-link">Course Catalog</Link>
            <Link to="/about" className="footer-link">About Us</Link>
          </div>
          <div className="footer-column">
            <h4 className="label-md footer-heading">Legal</h4>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <p className="body-sm">&copy; {new Date().getFullYear()} SmartLearn. All rights reserved.</p>
      </div>
    </footer>
  );
};
