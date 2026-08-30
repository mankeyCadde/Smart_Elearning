import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlayCircle, Trash2, Bookmark as BookmarkIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import './Bookmarks.css';

// Mock Data
const INITIAL_BOOKMARKS = [
  {
    id: 'b1',
    lessonId: 'l2',
    courseId: 'c1',
    courseTitle: 'Advanced Data Science with Python',
    lessonTitle: 'Python refresher',
    duration: '20:00',
    dateAdded: '2023-10-25'
  },
  {
    id: 'b2',
    lessonId: 'l4',
    courseId: 'c1',
    courseTitle: 'Advanced Data Science with Python',
    lessonTitle: 'Advanced DataFrames',
    duration: '30:00',
    dateAdded: '2023-10-24'
  },
  {
    id: 'b3',
    lessonId: 'l1',
    courseId: 'c3',
    courseTitle: 'UX/UI Design Principles',
    lessonTitle: 'Color Theory Basics',
    duration: '15:00',
    dateAdded: '2023-10-20'
  }
];

export const Bookmarks = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState(INITIAL_BOOKMARKS);
  const [searchQuery, setSearchQuery] = useState('');

  // Derived state
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery) return bookmarks;
    const lower = searchQuery.toLowerCase();
    return bookmarks.filter(b => 
      b.courseTitle.toLowerCase().includes(lower) || 
      b.lessonTitle.toLowerCase().includes(lower)
    );
  }, [bookmarks, searchQuery]);

  const handleRemove = (id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="bookmarks-page">
      <div className="dashboard-header-section bookmarks-header-flex">
        <div>
          <h1 className="headline-lg">My Bookmarks</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Quickly access your saved lessons.
          </p>
        </div>
        
        <div className="search-wrapper bookmarks-search">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search bookmarks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="notes-search-input body-md" // reusing class from notes for styling
          />
        </div>
      </div>

      <div className="bookmarks-grid">
        {filteredBookmarks.length === 0 ? (
          <div className="bookmarks-empty-state">
            <BookmarkIcon size={48} style={{ color: 'var(--color-outline)' }} />
            <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-md)' }}>
              No bookmarks found.
            </p>
          </div>
        ) : (
          filteredBookmarks.map(bookmark => (
            <Card key={bookmark.id} className="bookmark-card">
              <div className="bookmark-thumbnail">
                <PlayCircle size={32} className="bookmark-play-icon" />
                <span className="bookmark-duration label-sm">{bookmark.duration}</span>
              </div>
              <div className="bookmark-content">
                <div className="bookmark-info">
                  <p className="label-sm" style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>
                    {bookmark.courseTitle}
                  </p>
                  <h3 className="title-md">{bookmark.lessonTitle}</h3>
                  <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
                    Bookmarked on {bookmark.dateAdded}
                  </p>
                </div>
                
                <div className="bookmark-actions">
                  <Button 
                    variant="primary" 
                    onClick={() => navigate(`/student/course/${bookmark.courseId}/video`)}
                    style={{ gap: '8px', flex: 1 }}
                  >
                    <PlayCircle size={18} /> Continue Learning
                  </Button>
                  
                  <button 
                    className="icon-btn danger" 
                    onClick={() => handleRemove(bookmark.id)} 
                    title="Remove Bookmark"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
