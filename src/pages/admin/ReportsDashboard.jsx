import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Users, BookOpen, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { apiFetch } from '../../services/api';
import './Reports.css';

export const ReportsDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch('/analytics/admin/dashboard/').catch(() => null),
      apiFetch('/admin/courses/').catch(() => []),
    ])
      .then(([d, list]) => {
        if (cancelled) return;
        setData(d);
        setCourses(list || []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="reports-page p-xl"><p className="body-md">Loading reports...</p></div>;
  }

  const categories = data?.categories || [];
  const maxCatEnroll = categories.reduce((m, c) => Math.max(m, c.enrollments || 0), 0);
  const topCourses = [...courses]
    .sort((a, b) => (b.enrolledStudents || 0) - (a.enrolledStudents || 0))
    .slice(0, 5);
  const maxEnroll = topCourses.reduce((m, c) => Math.max(m, c.enrolledStudents || 0), 0);

  const filtered = courseFilter === 'all' ? courses : courses.filter(c => String(c.category || '') === courseFilter);

  const columns = [
    { header: 'Course Name', field: 'title', render: (row) => <strong>{row.title}</strong> },
    { header: 'Instructor', field: 'instructorName' },
    {
      header: 'Enrollments',
      field: 'enrolledStudents',
      render: (row) => (row.enrolledStudents || 0).toLocaleString()
    },
    {
      header: 'Price',
      field: 'price',
      render: (row) => `$${Number(row.price || 0).toLocaleString()}`
    },
    {
      header: 'Rating',
      field: 'rating',
      render: (row) => `${Number(row.rating || 0).toFixed(1)} (${row.reviews || 0})`
    },
    {
      header: 'Status',
      field: 'published',
      render: (row) => row.published ? 'Published' : 'Draft'
    }
  ];

  return (
    <div className="reports-page">
      <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: 'var(--spacing-md)' }}>
        <ChevronLeft size={18} /> Back to Admin Dashboard
      </Button>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 className="headline-lg">Reports & Analytics</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Track platform performance and student engagement.
          </p>
        </div>

        <select
          className="filter-select"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="all">All Courses</option>
          {categories.map(c => (
            <option key={c.category} value={c.category}>{c.category}</option>
          ))}
        </select>
      </div>

      <div className="reports-stats-grid">
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <Users size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Students</p>
            <h3 className="headline-lg">{(data?.users?.total || 0).toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Enrollments</p>
            <h3 className="headline-lg">{(data?.enrollments?.total || 0).toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Quizzes Taken</p>
            <h3 className="headline-lg">{(data?.assessments?.submissions || 0).toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Revenue</p>
            <h3 className="headline-lg">${Number(data?.enrollments?.revenue || 0).toLocaleString()}</h3>
          </div>
        </Card>
      </div>

      <div className="charts-grid" style={{ marginTop: 'var(--spacing-xxl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-xl)' }}>

        {/* Category Engagement Bar Chart */}
        <Card className="p-xl">
          <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-xl)' }}>Enrollment by Category</h2>
          {categories.length === 0 ? (
            <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>No category data yet.</p>
          ) : (
            <div className="css-bar-chart">
              {categories.map((c, index) => {
                const heightPercent = maxCatEnroll ? (c.enrollments / maxCatEnroll) * 100 : 0;
                return (
                  <div key={index} className="chart-bar-container">
                    <span className="chart-value label-sm">{c.enrollments}</span>
                    <div className="chart-bar-track">
                      <div className="chart-bar-fill" style={{ height: `${heightPercent}%` }}></div>
                    </div>
                    <span className="chart-label label-sm">{c.category}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Top Courses by Enrollments */}
        <Card className="p-xl">
          <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Top Courses by Enrollments</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {topCourses.length === 0 ? (
              <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>No courses yet.</p>
            ) : (
              topCourses.map(course => (
                <div key={course.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="label-md">{course.title}</span>
                    <span className="label-md" style={{ color: 'var(--color-primary)' }}>{course.enrolledStudents || 0}</span>
                  </div>
                  <ProgressBar progress={maxEnroll ? Math.round(((course.enrolledStudents || 0) / maxEnroll) * 100) : 0} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <section style={{ marginTop: 'var(--spacing-xxl)' }}>
        <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Detailed Course Performance</h2>
        <Table columns={columns} data={filtered} />
      </section>
    </div>
  );
};