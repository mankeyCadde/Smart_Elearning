import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlayCircle, Trash2, Bookmark as BookmarkIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../services/api';
import './Bookmarks.css';

export const Bookmarks = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiFetch('/bookmarks/')
      .then(data => { if (!cancelled) setBookmarks(data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery) return bookmarks;
    const lower = searchQuery.toLowerCase();
    return bookmarks.filter(b =>
      (b.courseTitle || '').toLowerCase().includes(lower) ||
      (b.lessonTitle || '').toLowerCase().includes(lower)
    );
  }, [bookmarks, searchQuery]);

  const handleRemove = async (id) => {
    try {
      await apiFetch(`/bookmarks/${id}/`, { method: 'DELETE' });
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      window.alert(err.message || 'Failed to remove bookmark.');
    }
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
            className="notes-search-input body-md"
          />
        </div>
      </div>

      <div className="bookmarks-grid">
        {loading ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading bookmarks...</p>
        ) : filteredBookmarks.length === 0 ? (
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
                <span className="bookmark-duration label-sm">{bookmark.sectionTitle || 'Lesson'}</span>
              </div>
              <div className="bookmark-content">
                <div className="bookmark-info">
                  <p className="label-sm" style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>
                    {bookmark.courseTitle}
                  </p>
                  <h3 className="title-md">{bookmark.lessonTitle}</h3>
                  <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
                    Bookmarked on {new Date(bookmark.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="bookmark-actions">
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/student/course/${bookmark.courseId}/video?lesson=${bookmark.lessonId}`)}
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