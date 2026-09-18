import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle, BookOpen, Award, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { CourseProgressCard } from '../../components/domain/CourseProgressCard';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import './Dashboard.css';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/enrollments/mine/')
      .then(list => {
        if (!cancelled) setEnrolled((list || []).filter(e => e.status === 'ACCEPTED'));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const courses = enrolled.map(e => ({
    id: e.courseId,
    title: e.courseTitle,
    instructor: e.instructorName,
    totalLessons: e.lessonCount || 0,
    completedLessons: e.completedLessonsCount || 0,
    progress: e.progress || 0,
    enrolledAt: e.enrolledAt,
  }));

  // Derived stats
  const coursesInProgress = courses.filter(c => c.progress > 0 && c.progress < 100).length;
  const coursesCompleted = courses.filter(c => c.progress === 100).length;
  const totalLessonsFinished = courses.reduce((acc, curr) => acc + curr.completedLessons, 0);

  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || '';
  const recentCourse = courses
    .filter(c => c.progress < 100)
    .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))[0];

  const recentPercentage = recentCourse ? Math.round(recentCourse.progress) : 0;

  return (
    <div className="student-dashboard">
      <div className="dashboard-header-section">
        <h1 className="headline-lg">Welcome back{firstName ? `, ${firstName}` : ''}!</h1>
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
            <h3 className="headline-md">{loading ? '…' : coursesInProgress}</h3>
            <p className="body-sm">Courses in Progress</p>
          </div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-icon-wrapper teal">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3 className="headline-md">{loading ? '…' : coursesCompleted}</h3>
            <p className="body-sm">Courses Completed</p>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon-wrapper amber">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h3 className="headline-md">{loading ? '…' : totalLessonsFinished}</h3>
            <p className="body-sm">Lessons Finished</p>
          </div>
        </Card>
      </div>

      {/* Continue Learning Highlight */}
      {!loading && recentCourse && (
        <section className="dashboard-section">
          <h2 className="title-lg section-title">Continue Learning</h2>
          <Card className="continue-learning-card">
            <div className="continue-thumbnail">
              <PlayCircle size={48} className="thumbnail-play-icon" />
            </div>
            <div className="continue-content">
              <div className="continue-info">
                <Badge variant="primary" style={{ marginBottom: 'var(--spacing-xs)' }}>In Progress</Badge>
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
          {loading ? (
            <p className="body-md" style={{ gridColumn: '1 / -1', color: 'var(--color-on-surface-variant)', padding: 'var(--spacing-xl)' }}>
              Loading your courses...
            </p>
          ) : courses.length === 0 ? (
            <div className="empty-state text-center" style={{ gridColumn: '1 / -1', padding: 'var(--spacing-xxl)', border: '1px dashed var(--color-outline-variant)', borderRadius: 'var(--rounded-md)' }}>
              <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>You are not enrolled in any courses yet.</p>
              <Link to="/catalog">
                <Button variant="primary" style={{ marginTop: 'var(--spacing-md)' }}>Browse Catalog</Button>
              </Link>
            </div>
          ) : (
            courses.map(course => (
              <CourseProgressCard key={course.id} course={course} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};