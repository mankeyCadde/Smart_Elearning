import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, TrendingUp, Users, CheckCircle, Target } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { ProgressBar } from '../../components/ui/ProgressBar';
import './Reports.css';

const MOCK_KPI = {
  enrollments: 4520,
  completionRate: 68,
  avgAttendance: 85,
  avgQuizScore: 92
};

const CHART_DATA = [
  { month: 'Jun', value: 350 },
  { month: 'Jul', value: 420 },
  { month: 'Aug', value: 580 },
  { month: 'Sep', value: 510 },
  { month: 'Oct', value: 650 },
  { month: 'Nov', value: 890 }
];

const MOCK_COURSE_PERFORMANCE = [
  { id: 'c1', course: 'Advanced Data Science', enrollments: 1250, completion: 75, avgScore: 94, attendance: '88%' },
  { id: 'c2', course: 'UX/UI Principles', enrollments: 890, completion: 82, avgScore: 89, attendance: '92%' },
  { id: 'c3', course: 'Intro to React', enrollments: 1540, completion: 61, avgScore: 85, attendance: '79%' },
  { id: 'c4', course: 'Machine Learning 101', enrollments: 840, completion: 55, avgScore: 96, attendance: '81%' },
];

export const ReportsDashboard = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState('Last 6 Months');
  const [courseFilter, setCourseFilter] = useState('All Courses');

  const maxValue = Math.max(...CHART_DATA.map(d => d.value));

  const columns = [
    { header: 'Course Name', field: 'course', render: (row) => <strong>{row.course}</strong> },
    { header: 'Total Enrollments', field: 'enrollments', render: (row) => row.enrollments.toLocaleString() },
    { header: 'Completion Rate', field: 'completion', render: (row) => `${row.completion}%` },
    { header: 'Avg. Quiz Score', field: 'avgScore', render: (row) => `${row.avgScore}%` },
    { header: 'Avg. Attendance', field: 'attendance' }
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
        
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <select 
            className="filter-select"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="All Courses">All Courses</option>
            <option value="Data Science">Data Science Category</option>
            <option value="Design">Design Category</option>
          </select>
          <select 
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="This Year">This Year</option>
          </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="reports-stats-grid">
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <Users size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Enrollments</p>
            <h3 className="headline-lg">{MOCK_KPI.enrollments.toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Avg. Completion Rate</p>
            <h3 className="headline-lg">{MOCK_KPI.completionRate}%</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Avg. Attendance</p>
            <h3 className="headline-lg">{MOCK_KPI.avgAttendance}%</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <Target size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Avg. Quiz Score</p>
            <h3 className="headline-lg">{MOCK_KPI.avgQuizScore}%</h3>
          </div>
        </Card>
      </div>

      <div className="charts-grid" style={{ marginTop: 'var(--spacing-xxl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-xl)' }}>
        
        {/* Enrollment Bar Chart (CSS-Based) */}
        <Card className="p-xl">
          <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-xl)' }}>Enrollment Trends</h2>
          <div className="css-bar-chart">
            {CHART_DATA.map((data, index) => {
              const heightPercent = (data.value / maxValue) * 100;
              return (
                <div key={index} className="chart-bar-container">
                  <span className="chart-value label-sm">{data.value}</span>
                  <div className="chart-bar-track">
                    <div className="chart-bar-fill" style={{ height: `${heightPercent}%` }}></div>
                  </div>
                  <span className="chart-label label-sm">{data.month}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Course Completion Progress */}
        <Card className="p-xl">
          <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Top Courses by Completion</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {MOCK_COURSE_PERFORMANCE.map(course => (
              <div key={course.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="label-md">{course.course}</span>
                  <span className="label-md" style={{ color: 'var(--color-primary)' }}>{course.completion}%</span>
                </div>
                <ProgressBar progress={course.completion} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed Data Table */}
      <section style={{ marginTop: 'var(--spacing-xxl)' }}>
        <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Detailed Course Performance</h2>
        <Table columns={columns} data={MOCK_COURSE_PERFORMANCE} />
      </section>

    </div>
  );
};
