import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { Sidebar } from '../components/navigation/Sidebar';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../context/NotificationContext';
import './DashboardLayout.css';
import '../pages/common/Notifications.css'; // For dropdown styles

export const DashboardLayout = ({ role = 'STUDENT' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewAll = () => {
    setIsDropdownOpen(false);
    navigate(`/${role.toLowerCase()}/notifications`);
  };

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

            <Button variant="ghost" onClick={() => navigate(`/${role.toLowerCase()}/profile`)} style={{ gap: '8px' }}>
              <User size={18} /> Profile
            </Button>
          </div>
        </header>
        <main className="dashboard-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
