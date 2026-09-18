import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, BookOpen, Award } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CourseCard } from '../../components/domain/CourseCard';
import { apiFetch } from '../../services/api';
import './Home.css';

export const Home = () => {
  const [popularCourses, setPopularCourses] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    
    // Fetch Popular Courses
    apiFetch('/courses/')
      .then(data => {
        if (!cancelled) {
          const list = (data && data.results) || data || [];
          const sorted = [...list].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
          setPopularCourses(sorted.slice(0, 4).map(c => ({ ...c, isPopular: true })));
        }
      })
      .catch(() => {});
      
    // Fetch Categories
    apiFetch('/courses/categories/')
      .then(data => {
        if (!cancelled) {
          const list = (data && data.results) || data || [];
          setCategories(list.slice(0, 4));
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="display-sm hero-title">
              Master New Skills with <span className="text-highlight">Academic Precision</span>
            </h1>
            <p className="body-lg hero-subtitle">
              Join thousands of learners achieving their goals with world-class courses designed by industry experts.
            </p>
            
            <div className="hero-search">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input 
                  type="text" 
                  className="search-input body-md" 
                  placeholder="What do you want to learn today?" 
                />
                <Button variant="primary">Search</Button>
              </div>
            </div>

            <div className="hero-actions">
              <Link to="/register">
                <Button variant="primary" size="lg">Start Learning Now</Button>
              </Link>
              <Link to="/catalog">
                <Button variant="secondary" size="lg">Browse Catalog</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="container stats-container">
          <div className="stat-item">
            <Users className="stat-icon" size={32} />
            <h3 className="headline-md stat-value">50K+</h3>
            <p className="body-sm stat-label">Active Students</p>
          </div>
          <div className="stat-item">
            <BookOpen className="stat-icon" size={32} />
            <h3 className="headline-md stat-value">1,200+</h3>
            <p className="body-sm stat-label">Quality Courses</p>
          </div>
          <div className="stat-item">
            <Award className="stat-icon" size={32} />
            <h3 className="headline-md stat-value">300+</h3>
            <p className="body-sm stat-label">Expert Instructors</p>
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="headline-lg">Top Categories</h2>
            <Link to="/catalog" className="text-link label-lg">View All Categories</Link>
          </div>
          <div className="categories-grid">
            {categories.map(category => (
              <Link to={`/catalog?category=${category.name}`} key={category.id} className="category-card">
                <h3 className="title-md">{category.name}</h3>
                <p className="body-sm">{category._courses_count} Courses</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="courses-section">
        <div className="container">
          <div className="section-header">
            <h2 className="headline-lg">Popular Courses</h2>
            <Link to="/catalog" className="text-link label-lg">Explore All Courses</Link>
          </div>
          <div className="courses-grid">
            {popularCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Instructor Callout */}
      <section className="instructor-callout-section">
        <div className="container callout-container">
          <div className="callout-content">
            <h2 className="headline-lg">Become an Instructor</h2>
            <p className="body-lg">
              Share your knowledge with millions of students worldwide. We provide the tools and support you need to teach what you love.
            </p>
            <Link to="/register?role=instructor">
              <Button variant="primary" size="lg" style={{ marginTop: 'var(--spacing-lg)' }}>
                Start Teaching Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
