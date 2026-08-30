import React, { createContext, useState, useContext } from 'react';

const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'New Course Announcement', message: 'Check out the new Advanced React course.', category: 'System', isRead: false, time: '10 mins ago' },
  { id: 'n2', title: 'Assignment Graded', message: 'Your Data Science project was graded.', category: 'Course Updates', isRead: false, time: '1 hour ago' },
  { id: 'n3', title: 'Upcoming Deadline', message: 'Final essay is due tomorrow at 11:59 PM.', category: 'Assignments', isRead: true, time: '1 day ago' },
  { id: 'n4', title: 'Welcome to SmartLearn', message: 'Thanks for joining our learning platform!', category: 'System', isRead: true, time: '1 week ago' },
];

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, markAllAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
