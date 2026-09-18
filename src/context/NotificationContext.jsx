import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

function formatTime(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  const diffMs = Date.now() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hours ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} days ago`;
  return then.toLocaleDateString();
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const updatingRef = useRef(false);

  const load = useCallback(async () => {
    if (updatingRef.current) return;
    updatingRef.current = true;
    try {
      const [list, count] = await Promise.all([
        apiFetch('/notifications/'),
        apiFetch('/notifications/unread-count/'),
      ]);
      setNotifications((list || []).map(n => ({ ...n, time: formatTime(n.time) })));
      setUnreadCount(count && typeof count.unreadCount === 'number' ? count.unreadCount : 0);
    } catch {
      // Ignore transient failures; next poll will retry.
    } finally {
      updatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user, load]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    apiFetch(`/notifications/${id}/read/`, { method: 'POST' }).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    apiFetch('/notifications/read-all/', { method: 'POST' }).catch(() => {});
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, markAllAsRead, unreadCount, refresh: load }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);