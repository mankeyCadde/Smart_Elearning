import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlayCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import './CourseProgressCard.css';

export const CourseProgressCard = ({ course }) => {
  const percentage = Math.round((course.completedLessons / course.totalLessons) * 100);
  const isCompleted = percentage === 100;

  return (
    <Card className="progress-card">
      <div className="progress-card-thumbnail">
        <div className="thumbnail-placeholder">
          <BookOpen size={48} className="thumbnail-icon" />
        </div>
      </div>
      
      <div className="progress-card-content">
        <h3 className="title-md progress-course-title">{course.title}</h3>
        <p className="body-sm progress-course-instructor">{course.instructor}</p>
        
        <div className="progress-section">
          <div className="progress-stats body-sm">
            <span>{course.completedLessons} / {course.totalLessons} lessons</span>
            <span>{percentage}%</span>
          </div>
          <ProgressBar percentage={percentage} color={isCompleted ? 'var(--color-secondary)' : 'var(--color-primary)'} />
        </div>
        
        <div className="progress-card-footer">
          {isCompleted ? (
            <Link to={`/student/course/${course.id}`} className="full-width-link">
              <Button variant="secondary" style={{ width: '100%' }}>Review Course</Button>
            </Link>
          ) : (
            <Link to={`/student/course/${course.id}/video`} className="full-width-link">
              <Button variant="primary" style={{ width: '100%', gap: '8px' }}>
                <PlayCircle size={16} /> Continue Learning
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
};
