import React, { useState } from 'react';
import { Bell, Check, Info, BookOpen, FileText, MessageSquare, MessageCircle, Award, Star, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { useNotifications } from '../../context/NotificationContext';
import './Notifications.css';

export const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  const filteredNotifications = notifications.filter(n => {
    const matchesTab = activeTab === 'all' || (activeTab === 'unread' && !n.isRead);
    const matchesCategory = categoryFilter === 'All Categories' || n.category === categoryFilter;
    return matchesTab && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'System': return <Info size={20} style={{ color: '#2563EB' }} />;
      case 'Course Updates': return <BookOpen size={20} style={{ color: '#059669' }} />;
      case 'Assignments': return <FileText size={20} style={{ color: '#D97706' }} />;
      case 'Quizzes': return <CheckCircle size={20} style={{ color: '#7C3AED' }} />;
      case 'Discussions': return <MessageCircle size={20} style={{ color: '#0891B2' }} />;
      case 'Reviews': return <Star size={20} style={{ color: '#F59E0B' }} />;
      case 'Messages': return <MessageSquare size={20} style={{ color: '#DB2777' }} />;
      case 'Achievements': return <Award size={20} style={{ color: '#059669' }} />;
      default: return <Bell size={20} style={{ color: 'var(--color-on-surface-variant)' }} />;
    }
  };

  return (
    <div className="notifications-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 className="headline-lg">Notifications</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Stay updated with your courses and account activity.
          </p>
        </div>
        <Button variant="secondary" onClick={markAllAsRead} style={{ gap: '8px' }}>
          <Check size={18} /> Mark All as Read
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <Tabs 
          tabs={[
            { id: 'all', label: 'All Notifications' },
            { id: 'unread', label: 'Unread Only' }
          ]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
        
        <select 
          className="category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All Categories">All Categories</option>
          <option value="System">System</option>
          <option value="Course Updates">Course Updates</option>
          <option value="Assignments">Assignments</option>
          <option value="Quizzes">Quizzes</option>
          <option value="Discussions">Discussions</option>
          <option value="Reviews">Reviews</option>
          <option value="Messages">Messages</option>
          <option value="Achievements">Achievements</option>
        </select>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="text-center p-xl" style={{ border: '1px dashed var(--color-outline)', borderRadius: 'var(--rounded-md)' }}>
            <Bell size={48} style={{ color: 'var(--color-outline)', margin: '0 auto var(--spacing-md)' }} />
            <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <Card key={notification.id} className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}>
              <div className="notification-icon">
                {getCategoryIcon(notification.category)}
              </div>
              <div className="notification-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="title-md">{notification.title}</h3>
                  <span className="label-sm timestamp">{notification.time}</span>
                </div>
                <p className="body-md notification-msg">{notification.message}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-md)' }}>
                  <Badge variant="secondary" style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
                    {notification.category}
                  </Badge>
                  {!notification.isRead && (
                    <Button variant="ghost" onClick={() => markAsRead(notification.id)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
              {!notification.isRead && <div className="unread-dot"></div>}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
