import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, DollarSign, Plus, Edit2, PlayCircle, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import './InstructorDashboard.css';

const MOCK_STATS = {
  totalStudents: 1250,
  activeCourses: 5,
  totalRevenue: 15400
};

const MOCK_COURSES = [
  {
    id: 'c1',
    title: 'Advanced Data Science with Python',
    status: 'Published',
    students: 450,
    rating: 4.8,
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'c2',
    title: 'Full-Stack React & Node.js',
    status: 'Published',
    students: 800,
    rating: 4.9,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'c4',
    title: 'Introduction to Machine Learning',
    status: 'Draft',
    students: 0,
    rating: 0,
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400'
  }
];

export const InstructorDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="instructor-dashboard">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="headline-lg">Instructor Dashboard</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Welcome back, Professor. Here's an overview of your school.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/instructor/course/new')} style={{ gap: '8px' }}>
          <Plus size={18} /> Create Course
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <Users size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Students</p>
            <h3 className="headline-lg">{MOCK_STATS.totalStudents.toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Active Courses</p>
            <h3 className="headline-lg">{MOCK_STATS.activeCourses}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Revenue</p>
            <h3 className="headline-lg">${MOCK_STATS.totalRevenue.toLocaleString()}</h3>
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
            <Users size={24} style={{ color: '#059669' }} />
            <span className="title-md">Mark Attendance</span>
          </Card>
          <Card className="quick-link-card">
            <Settings size={24} style={{ color: 'var(--color-on-surface-variant)' }} />
            <span className="title-md">Analytics Settings</span>
          </Card>
        </div>
      </section>

      {/* My Courses List */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2 className="title-lg">My Courses</h2>
          <Button variant="ghost">View All</Button>
        </div>
        
        <div className="instructor-courses-list">
          {MOCK_COURSES.map(course => (
            <Card key={course.id} className="instructor-course-card">
              <div className="course-card-content">
                <img src={course.thumbnail} alt={course.title} className="instructor-course-thumb" />
                <div className="instructor-course-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className="title-lg">{course.title}</h3>
                    {course.status === 'Published' ? (
                      <Badge variant="primary">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                  
                  <div className="course-meta-stats" style={{ display: 'flex', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
                    <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                      <strong>{course.students}</strong> Students
                    </span>
                    <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                      <strong>{course.rating > 0 ? course.rating : 'N/A'}</strong> Rating
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
      </section>
    </div>
  );
};
