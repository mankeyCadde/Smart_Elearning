import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import './TopNavbar.css';

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  INSTRUCTOR: '/instructor/dashboard',
  STUDENT: '/student/dashboard',
};

export const TopNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="top-navbar">
      <div className="container top-navbar-container">
        <Link to="/" className="top-navbar-logo">
          <span className="logo-text">SmartLearn</span>
        </Link>
        <div className="top-navbar-links">
          <Link to="/catalog" className="nav-link">Course Catalog</Link>
          <div className="nav-actions">
            {user ? (
              <>
                <Link to={(ROLE_HOME[user.role] || '/student/dashboard')}>
                  <Button variant="ghost">My Dashboard</Button>
                </Link>
                <Button variant="secondary" onClick={handleLogout}>Log Out</Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Log In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};