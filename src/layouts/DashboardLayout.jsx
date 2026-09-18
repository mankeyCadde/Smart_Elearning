import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { Sidebar } from '../components/navigation/Sidebar';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';
import '../pages/common/Notifications.css'; // For dropdown styles

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  INSTRUCTOR: '/instructor/dashboard',
  STUDENT: '/student/dashboard',
};

export const DashboardLayout = ({ role = 'STUDENT' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const { user, loading, role: userRole, logout } = useAuth();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewAll = () => {
    setIsDropdownOpen(false);
    navigate(`/${role.toLowerCase()}/notifications`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (userRole !== role) return <Navigate to={ROLE_HOME[userRole] || '/login'} replace />;

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main-wrapper">
        <header className="dashboard-header">
          <div className="dashboard-header-search">
            {/* Search bar placeholder */}
          </div>
          <div className="dashboard-header-actions" style={{ position: 'relative' }}>
            
            {/* Notification Bell */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button 
                className="icon-btn" 
                style={{ position: 'relative', marginRight: 'var(--spacing-md)' }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    backgroundColor: 'var(--color-primary)', color: 'white',
                    fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isDropdownOpen && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <span className="title-md">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="label-sm" style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p className="body-sm text-center" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-on-surface-variant)' }}>
                        No notifications.
                      </p>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div key={n.id} className={`dropdown-item ${n.isRead ? '' : 'unread'}`}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong className="label-sm">{n.title}</strong>
                              <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)', fontSize: '11px' }}>{n.time}</span>
                            </div>
                            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '2px', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="dropdown-footer">
                    <Button variant="ghost" onClick={handleViewAll} style={{ width: '100%', padding: '4px' }}>
                      View all notifications
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                className="icon-btn user-chip"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: 'var(--rounded-full)', border: '1px solid var(--color-outline-variant)' }}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'var(--color-primary)', color: 'white',
                  fontSize: '12px', fontWeight: '600'
                }}>
                  {(user.firstName?.[0] || user.fullName?.[0] || 'U').toUpperCase()}
                </span>
                <span className="label-md" style={{ color: 'var(--color-on-surface)' }}>
                  {user.firstName || user.fullName || user.email}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="notification-dropdown" style={{ right: 0 }}>
                  <Link
                    to={`/${role.toLowerCase()}/profile`}
                    className="dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                    style={{ textDecoration: 'none', color: 'var(--color-on-surface)' }}
                  >
                    <span className="body-md">My Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item"
                    style={{ textDecoration: 'none', color: '#B91C1C', background: 'none', border: 'none', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <LogOut size={16} />
                    <span className="body-md">Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="dashboard-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};