import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, BookOpen } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import './CourseCard.css';

export const CourseCard = ({ course }) => {
  return (
    <Card className="course-card">
      <Link to={`/course/${course.id}`} className="course-card-link">
        <div className="course-card-thumbnail">
          {/* Placeholder for actual image */}
          <div className="thumbnail-placeholder">
            <BookOpen size={48} className="thumbnail-icon" />
          </div>
          <div className="course-card-badges">
            <Badge variant="primary">{course.category}</Badge>
            {course.isPopular && <Badge variant="secondary">Popular</Badge>}
          </div>
        </div>
        
        <div className="course-card-content">
          <h3 className="title-md course-title">{course.title}</h3>
          <p className="body-sm course-instructor">{course.instructor}</p>
          
          <div className="course-meta">
            <div className="course-rating">
              <Star size={14} className="star-icon" fill="currentColor" />
              <span className="label-sm">{course.rating} ({course.reviews})</span>
            </div>
            <div className="course-duration">
              <Clock size={14} />
              <span className="label-sm">{course.duration}</span>
            </div>
          </div>
          
          <div className="course-footer">
            <span className="label-lg course-price">
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
};
