import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Home, CheckSquare, Award, BookMarked, ClipboardList, User, X, Tag, Receipt, FileQuestion, UserPlus } from 'lucide-react';
import './Sidebar.css';

export const Sidebar = ({ role = 'STUDENT', isOpen, onClose }) => {
  const getLinks = () => {
    switch (role) {
      case 'INSTRUCTOR':
        return [
          { to: '/instructor/dashboard', label: 'Dashboard', icon: Home },
          { to: '/instructor/courses', label: 'My Courses', icon: BookOpen },
          { to: '/instructor/enrollment-requests', label: 'Enrollment Requests', icon: UserPlus },
          { to: '/instructor/quiz-builder', label: 'Quiz Builder', icon: FileQuestion },
          { to: '/instructor/assignments', label: 'Assignments', icon: CheckSquare },
          { to: '/instructor/attendance', label: 'Attendance', icon: ClipboardList },
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
          { to: '/admin/users', label: 'User Management', icon: User },
          { to: '/admin/courses', label: 'Course Management', icon: BookOpen },
          { to: '/admin/coupons', label: 'Coupon Codes', icon: Tag },
        ];
      case 'STUDENT':
      default:
        return [
          { to: '/student/dashboard', label: 'Dashboard', icon: Home },
          { to: '/student/courses', label: 'My Courses', icon: BookOpen },
          { to: '/student/assignments', label: 'Assignments', icon: CheckSquare },
          { to: '/student/bookmarks', label: 'Bookmarks', icon: BookMarked },
          { to: '/student/certificates', label: 'Certificates', icon: Award },
          { to: '/student/orders', label: 'My Orders', icon: Receipt },
        ];
    }
  };

  const links = getLinks();

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="logo-text">SmartLearn</span>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="sidebar-icon" size={20} />
                <span className="sidebar-link-text">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
