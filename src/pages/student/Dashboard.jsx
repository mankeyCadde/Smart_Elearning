import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle, BookOpen, Award, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { CourseProgressCard } from '../../components/domain/CourseProgressCard';
import './Dashboard.css';

// Mock Enrolled Courses Data
const MOCK_ENROLLED_COURSES = [
  {
    id: 'c1',
    title: 'Advanced Data Science with Python',
    instructor: 'Dr. Sarah Chen',
    totalLessons: 42,
    completedLessons: 12,
    lastWatched: '2023-10-25T14:30:00Z',
    thumbnail: 'placeholder'
  },
  {
    id: 'c2',
    title: 'Full-Stack React & Node.js Bootcamp',
    instructor: 'Alex Mercer',
    totalLessons: 85,
    completedLessons: 85,
    lastWatched: '2023-09-10T09:00:00Z',
    thumbnail: 'placeholder'
  },
  {
    id: 'c3',
    title: 'UX/UI Design Principles',
    instructor: 'Mia Wong',
    totalLessons: 24,
    completedLessons: 2,
    lastWatched: '2023-10-20T11:15:00Z',
    thumbnail: 'placeholder'
  }
];

export const Dashboard = () => {
  const navigate = useNavigate();

  // Derived stats
  const coursesInProgress = MOCK_ENROLLED_COURSES.filter(c => c.completedLessons > 0 && c.completedLessons < c.totalLessons).length;
  const coursesCompleted = MOCK_ENROLLED_COURSES.filter(c => c.completedLessons === c.totalLessons).length;
  const totalLessonsFinished = MOCK_ENROLLED_COURSES.reduce((acc, curr) => acc + curr.completedLessons, 0);

  // Get most recently watched incomplete course
  const recentCourse = MOCK_ENROLLED_COURSES
    .filter(c => c.completedLessons < c.totalLessons)
    .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched))[0];

  const recentPercentage = recentCourse ? Math.round((recentCourse.completedLessons / recentCourse.totalLessons) * 100) : 0;

  return (
    <div className="student-dashboard">
      <div className="dashboard-header-section">
        <h1 className="headline-lg">Welcome back, Student!</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          Ready to continue your learning journey?
        </p>
      </div>

      {/* Overall Stats Row */}
      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-icon-wrapper blue">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <h3 className="headline-md">{coursesInProgress}</h3>
            <p className="body-sm">Courses in Progress</p>
          </div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-icon-wrapper teal">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3 className="headline-md">{coursesCompleted}</h3>
            <p className="body-sm">Courses Completed</p>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon-wrapper amber">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h3 className="headline-md">{totalLessonsFinished}</h3>
            <p className="body-sm">Lessons Finished</p>
          </div>
        </Card>
      </div>

      {/* Continue Learning Highlight */}
      {recentCourse && (
        <section className="dashboard-section">
          <h2 className="title-lg section-title">Continue Learning</h2>
          <Card className="continue-learning-card">
            <div className="continue-thumbnail">
              <PlayCircle size={48} className="thumbnail-play-icon" />
            </div>
            <div className="continue-content">
              <div className="continue-info">
                <Badge variant="primary" style={{ marginBottom: 'var(--spacing-xs)' }}>Recently Watched</Badge>
                <h3 className="headline-sm">{recentCourse.title}</h3>
                <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-md)' }}>
                  {recentCourse.instructor}
                </p>
                
                <div className="continue-progress-area">
                  <div className="progress-labels body-sm">
                    <span>Progress</span>
                    <span>{recentPercentage}%</span>
                  </div>
                  <ProgressBar percentage={recentPercentage} size="lg" />
                  <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
                    {recentCourse.completedLessons} of {recentCourse.totalLessons} lessons completed
                  </p>
                </div>
              </div>
              <div className="continue-action">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => navigate(`/student/course/${recentCourse.id}/video`)}
                  style={{ gap: '8px' }}
                >
                  <PlayCircle size={20} /> Resume Course
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* My Courses Grid */}
      <section className="dashboard-section">
        <div className="section-header-flex">
          <h2 className="title-lg section-title">My Courses</h2>
          <Link to="/student/courses" className="text-link label-lg">View All</Link>
        </div>
        <div className="courses-progress-grid">
          {MOCK_ENROLLED_COURSES.length === 0 ? (
            <div className="empty-state text-center" style={{ gridColumn: '1 / -1', padding: 'var(--spacing-xxl)', border: '1px dashed var(--color-outline-variant)', borderRadius: 'var(--rounded-md)' }}>
              <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>You are not enrolled in any courses yet.</p>
              <Link to="/catalog">
                <Button variant="primary" style={{ marginTop: 'var(--spacing-md)' }}>Browse Catalog</Button>
              </Link>
            </div>
          ) : (
            MOCK_ENROLLED_COURSES.map(course => (
              <CourseProgressCard key={course.id} course={course} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
