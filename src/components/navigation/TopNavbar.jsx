import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import './TopNavbar.css';

export const TopNavbar = () => {
  return (
    <nav className="top-navbar">
      <div className="container top-navbar-container">
        <Link to="/" className="top-navbar-logo">
          <span className="logo-text">SmartLearn</span>
        </Link>
        <div className="top-navbar-links">
          <Link to="/catalog" className="nav-link">Course Catalog</Link>
          <div className="nav-actions">
            <Link to="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
