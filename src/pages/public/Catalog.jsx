import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, SearchX } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CourseCard } from '../../components/domain/CourseCard';
import { apiFetch } from '../../services/api';
import './Catalog.css';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' }
];

const DEFAULT_CATEGORIES = ['Data Science', 'Web Dev', 'Design', 'Business'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'free', 'paid'
  const [sortBy, setSortBy] = useState('popular');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Fetch courses from API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch('/courses/')
      .then(data => {
        if (cancelled) return;
        const list = (data && data.results) || data || [];
        setCourses(list);
        const cats = [...new Set(list.map(c => c.category).filter(Boolean))];
        if (cats.length > 0) setCategories(cats);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
  }, [searchParams]);

  // Filtering & Sorting Logic
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(lowerQuery) || 
        (c.instructorName || '').toLowerCase().includes(lowerQuery)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(c => selectedCategories.includes(c.category));
    }

    // Level filter
    if (selectedLevels.length > 0) {
      result = result.filter(c => selectedLevels.includes(c.level));
    }

    // Price filter
    if (priceFilter === 'free') {
      result = result.filter(c => c.price === 0);
    } else if (priceFilter === 'paid') {
      result = result.filter(c => c.price > 0);
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
      default:
        result.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
        break;
    }

    return result;
  }, [courses, searchQuery, selectedCategories, selectedLevels, priceFilter, sortBy]);

  // Handlers
  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleLevel = (lvl) => {
    setSelectedLevels(prev => 
      prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedLevels([]);
    setPriceFilter('all');
    setSearchParams({});
  };

  const loadingView = (
    <div className="empty-state">
      <div className="spinner" style={{ margin: '0 auto', width: '40px', height: '40px', border: '4px solid var(--color-surface-container-high)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const errorView = (
    <div className="empty-state">
      <SearchX size={48} />
      <h3 className="headline-sm">Couldn't load courses</h3>
      <p className="body-md">{error}</p>
      <Button variant="primary" onClick={() => window.location.reload()} style={{ marginTop: 'var(--spacing-lg)' }}>
        Retry
      </Button>
    </div>
  );

  return (
    <div className="catalog-page">
      {/* Catalog Header */}
      <div className="catalog-header">
        <div className="container">
          <h1 className="headline-lg">Course Catalog</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Explore our comprehensive collection of courses and master new skills.
          </p>
        </div>
      </div>

      <div className="container catalog-layout">
        {/* Mobile Filter Toggle */}
        <div className="mobile-filter-toggle">
          <Button 
            variant="secondary" 
            onClick={() => setIsMobileFiltersOpen(true)}
            style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' }}
          >
            <Filter size={18} /> Filters
          </Button>
        </div>

        {/* Sidebar Filters */}
        <aside className={`catalog-sidebar ${isMobileFiltersOpen ? 'open' : ''}`}>
          <div className="sidebar-header-mobile">
            <h3 className="title-md">Filters</h3>
            <button className="icon-btn" onClick={() => setIsMobileFiltersOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="filter-group">
            <h4 className="label-lg filter-title">Category</h4>
            {categories.map(cat => (
              <label key={cat} className="filter-checkbox body-sm">
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4 className="label-lg filter-title">Level</h4>
            {LEVELS.map(lvl => (
              <label key={lvl} className="filter-checkbox body-sm">
                <input 
                  type="checkbox" 
                  checked={selectedLevels.includes(lvl)}
                  onChange={() => toggleLevel(lvl)}
                />
                {lvl}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4 className="label-lg filter-title">Price</h4>
            <label className="filter-radio body-sm">
              <input type="radio" name="price" checked={priceFilter === 'all'} onChange={() => setPriceFilter('all')} />
              All
            </label>
            <label className="filter-radio body-sm">
              <input type="radio" name="price" checked={priceFilter === 'free'} onChange={() => setPriceFilter('free')} />
              Free
            </label>
            <label className="filter-radio body-sm">
              <input type="radio" name="price" checked={priceFilter === 'paid'} onChange={() => setPriceFilter('paid')} />
              Paid
            </label>
          </div>

          <Button variant="ghost" onClick={clearFilters} style={{ width: '100%', marginTop: 'var(--spacing-md)' }}>
            Clear All Filters
          </Button>
        </aside>

        {/* Main Content */}
        <main className="catalog-main">
          {/* Top Bar */}
          <div className="catalog-topbar">
            <div className="search-container">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="search-input body-md"
                placeholder="Search courses or instructors..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="sort-container">
              <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                Showing {loading ? '...' : filteredAndSortedCourses.length} results
              </span>
              <select 
                className="sort-select body-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Area */}
          {loading ? loadingView : error ? errorView : filteredAndSortedCourses.length > 0 ? (
            <>
              <div className="catalog-grid">
                {filteredAndSortedCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              
              <div className="catalog-pagination">
                <Button variant="secondary" disabled>All courses loaded</Button>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-state-icon">
                <SearchX size={48} />
              </div>
              <h3 className="headline-sm">No courses found</h3>
              <p className="body-md">
                We couldn't find any courses matching your current filters and search query.
              </p>
              <Button variant="primary" onClick={clearFilters} style={{ marginTop: 'var(--spacing-lg)' }}>
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>
      
      {/* Mobile Overlay */}
      {isMobileFiltersOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileFiltersOpen(false)}></div>
      )}
    </div>
  );
};