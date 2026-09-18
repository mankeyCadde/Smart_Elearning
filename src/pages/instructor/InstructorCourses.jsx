import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { apiFetch } from '../../services/api';
import './InstructorDashboard.css';

export const InstructorCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/instructor/courses/')
      .then(data => {
        if (!cancelled) {
          const results = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setCourses(results);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Failed to load courses');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="instructor-dashboard">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="headline-lg">My Courses</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Manage and view all your courses.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/instructor/course/new')} style={{ gap: '8px' }}>
          <Plus size={18} /> Create Course
        </Button>
      </div>

      {loading ? (
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading your courses...</p>
      ) : error ? (
        <p className="body-md" style={{ color: 'var(--color-error)' }}>{error}</p>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', border: '1px dashed var(--color-outline-variant)', borderRadius: 'var(--rounded-md)' }}>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>You haven't created any courses yet.</p>
          <Button variant="primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/instructor/course/new')}>
            Create Your First Course
          </Button>
        </div>
      ) : (
        <div className="instructor-courses-list">
          {courses.map(course => (
            <Card key={course.id} className="instructor-course-card">
              <div className="course-card-content">
                <div className="instructor-course-info" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className="title-lg">{course.title}</h3>
                    {course.published ? (
                      <Badge variant="primary">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>

                  <div className="course-meta-stats" style={{ display: 'flex', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                      <strong>{course.enrolledStudents || 0}</strong> Students
                    </span>
                    <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                      <strong>{course.rating != null ? Number(course.rating).toFixed(1) : 'N/A'}</strong> Rating
                    </span>
                  </div>
                </div>
              </div>

              <div className="course-actions">
                <Button variant="secondary" onClick={() => navigate(`/instructor/course/${course.id}/edit`)} style={{ gap: '8px' }}>
                  <Edit2 size={16} /> Edit Curriculum
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
