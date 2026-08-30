import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, BookOpen, Award } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CourseCard } from '../../components/domain/CourseCard';
import './Home.css';

// Mock Data
const MOCK_CATEGORIES = [
  { id: 1, name: 'Data Science', count: '120 Courses' },
  { id: 2, name: 'Web Development', count: '240 Courses' },
  { id: 3, name: 'Business', count: '85 Courses' },
  { id: 4, name: 'Design', count: '110 Courses' },
];

const MOCK_COURSES = [
  {
    id: 'c1',
    title: 'Advanced Data Science with Python',
    instructor: 'Dr. Sarah Chen',
    category: 'Data Science',
    rating: 4.8,
    reviews: 1240,
    duration: '12 weeks',
    price: 89.99,
    isPopular: true
  },
  {
    id: 'c2',
    title: 'Full-Stack React & Node.js Bootcamp',
    instructor: 'Alex Mercer',
    category: 'Web Dev',
    rating: 4.9,
    reviews: 3100,
    duration: '10 weeks',
    price: 99.99,
    isPopular: true
  },
  {
    id: 'c3',
    title: 'UX/UI Design Principles',
    instructor: 'Mia Wong',
    category: 'Design',
    rating: 4.7,
    reviews: 850,
    duration: '6 weeks',
    price: 49.99,
    isPopular: false
  },
  {
    id: 'c4',
    title: 'Financial Analysis Masterclass',
    instructor: 'James Sterling',
    category: 'Business',
    rating: 4.6,
    reviews: 420,
    duration: '8 weeks',
    price: 79.99,
    isPopular: false
  }
];

export const Home = () => {
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
            {MOCK_CATEGORIES.map(category => (
              <Link to={`/catalog?category=${category.name}`} key={category.id} className="category-card">
                <h3 className="title-md">{category.name}</h3>
                <p className="body-sm">{category.count}</p>
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
            {MOCK_COURSES.map(course => (
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
