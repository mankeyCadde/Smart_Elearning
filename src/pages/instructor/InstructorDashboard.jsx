import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, DollarSign, Plus, Edit2, PlayCircle, ClipboardList, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './InstructorDashboard.css';

export const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/analytics/instructor/dashboard/')
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const summary = data?.summary || {};
  const courses = data?.courses || [];

  return (
    <div className="instructor-dashboard">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="headline-lg">Instructor Dashboard</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Welcome back, {user?.fullName?.split(' ')[0] || 'Professor'}. Here's an overview of your courses.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/instructor/course/new')} style={{ gap: '8px' }}>
          <Plus size={18} /> Create Course
        </Button>
      </div>

      {loading ? (
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading analytics...</p>
      ) : (
        <>
      {/* KPI Stats */}
      <div className="stats-grid">
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <Users size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Students</p>
            <h3 className="headline-lg">{(summary.totalStudents || 0).toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Active Courses</p>
            <h3 className="headline-lg">{summary.publishedCourses || 0}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Revenue</p>
            <h3 className="headline-lg">${Number(summary.totalRevenue || 0).toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Lessons</p>
            <h3 className="headline-lg">{summary.totalLessons || 0}</h3>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <section style={{ margin: 'var(--spacing-xxl) 0' }}>
        <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>Quick Actions</h2>
        <div className="quick-links-grid">
          <Card className="quick-link-card" onClick={() => navigate('/instructor/assignments')}>
            <PlayCircle size={24} style={{ color: 'var(--color-primary)' }} />
            <span className="title-md">Grade Assignments</span>
          </Card>
          <Card className="quick-link-card" onClick={() => navigate('/instructor/attendance')}>
            <UserCheck size={24} style={{ color: '#059669' }} />
            <span className="title-md">View Attendance</span>
          </Card>
        </div>
      </section>

      {/* My Courses List */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2 className="title-lg">My Courses</h2>
          <Button variant="secondary" onClick={() => navigate('/instructor/courses')} size="sm">View All</Button>
        </div>

        <div className="instructor-courses-list">
          {courses.length === 0 ? (
            <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', padding: 'var(--spacing-lg)' }}>
              You haven't created any courses yet.
            </p>
          ) : (
            courses.map(course => (
              <Card key={course.courseId} className="instructor-course-card">
                <div className="course-card-content">
                  <div className="instructor-course-info" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="title-lg">{course.courseTitle}</h3>
                      {course.published ? (
                        <Badge variant="primary">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </div>

                    <div className="course-meta-stats" style={{ display: 'flex', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                      <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                        <strong>{course.enrolledStudents}</strong> Students
                      </span>
                      <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                        <strong>{course.rating != null ? Number(course.rating).toFixed(1) : 'N/A'}</strong> Rating
                      </span>
                      <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                        <strong>{course.totalLessons}</strong> Lessons
                      </span>
                      {course.averageProgress != null && (
                        <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                          <strong>{course.averageProgress}%</strong> Avg progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="course-actions">
                  <Button variant="secondary" onClick={() => navigate(`/instructor/course/${course.courseId}/edit`)} style={{ gap: '8px' }}>
                    <Edit2 size={16} /> Edit Curriculum
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
      </>
      )}
    </div>
  );
};