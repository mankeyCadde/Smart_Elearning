import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SearchX, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CourseCard } from '../../components/domain/CourseCard';
import { apiFetch } from '../../services/api';
import '../public/Catalog.css';

export const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const term = searchParams.get('q') || '';
    apiFetch(`/courses/?search=${encodeURIComponent(term)}`)
      .then(data => {
        if (cancelled) return;
        setCourses((data && data.results) || data || []);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [searchParams]);

  const runSearch = (e) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <div className="container">
          <Button variant="ghost" onClick={() => navigate(-1)} style={{ gap: '8px', marginBottom: 'var(--spacing-md)' }}>
            <ArrowLeft size={18} /> Back
          </Button>
          <h1 className="headline-lg">Search Results</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            {query ? `Results for "${query}"` : 'Find courses and instructors.'}
          </p>
        </div>
      </div>

      <div className="container catalog-layout" style={{ display: 'block' }}>
        <div className="catalog-topbar" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <form className="search-container" onSubmit={runSearch} style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input body-md"
              placeholder="Search courses or instructors..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </form>
          <div className="sort-container">
            <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              Showing {loading ? '...' : courses.length} results
            </span>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto', width: '40px', height: '40px', border: '4px solid var(--color-surface-container-high)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : error ? (
          <div className="empty-state">
            <SearchX size={48} />
            <h3 className="headline-sm">Couldn't load results</h3>
            <p className="body-md">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()} style={{ marginTop: 'var(--spacing-lg)' }}>
              Retry
            </Button>
          </div>
        ) : courses.length > 0 ? (
          <div className="catalog-grid">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <SearchX size={48} />
            <h3 className="headline-sm">No results found</h3>
            <p className="body-md">We couldn't find any courses matching your search. Try different keywords.</p>
            <Button variant="primary" onClick={() => navigate('/catalog')} style={{ marginTop: 'var(--spacing-lg)' }}>
              Browse Course Catalog
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};