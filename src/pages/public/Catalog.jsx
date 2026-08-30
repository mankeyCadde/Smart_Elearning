import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, SearchX } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CourseCard } from '../../components/domain/CourseCard';
import './Catalog.css';

// Extended Mock Data for Catalog
const MOCK_COURSES = [
  { id: 'c1', title: 'Advanced Data Science with Python', instructor: 'Dr. Sarah Chen', category: 'Data Science', level: 'Advanced', rating: 4.8, reviews: 1240, duration: '12 weeks', price: 89.99, dateAdded: '2023-01-15' },
  { id: 'c2', title: 'Full-Stack React & Node.js', instructor: 'Alex Mercer', category: 'Web Dev', level: 'Intermediate', rating: 4.9, reviews: 3100, duration: '10 weeks', price: 99.99, dateAdded: '2023-03-20' },
  { id: 'c3', title: 'UX/UI Design Principles', instructor: 'Mia Wong', category: 'Design', level: 'Beginner', rating: 4.7, reviews: 850, duration: '6 weeks', price: 49.99, dateAdded: '2023-05-10' },
  { id: 'c4', title: 'Financial Analysis Masterclass', instructor: 'James Sterling', category: 'Business', level: 'Intermediate', rating: 4.6, reviews: 420, duration: '8 weeks', price: 79.99, dateAdded: '2023-02-28' },
  { id: 'c5', title: 'Introduction to Machine Learning', instructor: 'Dr. Sarah Chen', category: 'Data Science', level: 'Beginner', rating: 4.5, reviews: 900, duration: '8 weeks', price: 0, dateAdded: '2023-06-01' },
  { id: 'c6', title: 'Advanced CSS and Sass', instructor: 'Alex Mercer', category: 'Web Dev', level: 'Advanced', rating: 4.8, reviews: 1500, duration: '4 weeks', price: 29.99, dateAdded: '2023-04-15' },
  { id: 'c7', title: 'Digital Marketing Fundamentals', instructor: 'Emma Frost', category: 'Business', level: 'Beginner', rating: 4.4, reviews: 320, duration: '5 weeks', price: 39.99, dateAdded: '2023-07-10' },
  { id: 'c8', title: 'Figma for UI Designers', instructor: 'Mia Wong', category: 'Design', level: 'Intermediate', rating: 4.9, reviews: 2100, duration: '6 weeks', price: 59.99, dateAdded: '2023-08-05' },
];

const CATEGORIES = ['Data Science', 'Web Dev', 'Design', 'Business'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' }
];

export const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'free', 'paid'
  const [sortBy, setSortBy] = useState('popular');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && CATEGORIES.includes(categoryParam)) {
      setSelectedCategories([categoryParam]);
    }
  }, [searchParams]);

  // Filtering & Sorting Logic
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...MOCK_COURSES];

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(lowerQuery) || 
        c.instructor.toLowerCase().includes(lowerQuery)
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
        result.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
      default:
        result.sort((a, b) => b.reviews - a.reviews);
        break;
    }

    return result;
  }, [searchQuery, selectedCategories, selectedLevels, priceFilter, sortBy]);

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
            {CATEGORIES.map(cat => (
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
                Showing {filteredAndSortedCourses.length} results
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
          {filteredAndSortedCourses.length > 0 ? (
            <>
              <div className="catalog-grid">
                {filteredAndSortedCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              
              <div className="catalog-pagination">
                <Button variant="secondary">Load More</Button>
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
