import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

// Mock Data
const MOCK_ATTENDANCE_HISTORY = [
  { id: 1, date: '2023-10-25', course: 'Advanced Data Science with Python', session: 'Module 3, Live QA', status: 'present' },
  { id: 2, date: '2023-10-23', course: 'Full-Stack React & Node.js', session: 'React Hooks Deep Dive', status: 'present' },
  { id: 3, date: '2023-10-18', course: 'Advanced Data Science with Python', session: 'Module 2, Live QA', status: 'late' },
  { id: 4, date: '2023-10-16', course: 'UX/UI Design Principles', session: 'Wireframing Workshop', status: 'absent' },
  { id: 5, date: '2023-10-11', course: 'Advanced Data Science with Python', session: 'Module 1, Live QA', status: 'present' },
];

export const StudentAttendance = () => {
  // Derived Stats
  const total = MOCK_ATTENDANCE_HISTORY.length;
  const presentCount = MOCK_ATTENDANCE_HISTORY.filter(r => r.status === 'present').length;
  const absentCount = MOCK_ATTENDANCE_HISTORY.filter(r => r.status === 'absent').length;
  const lateCount = MOCK_ATTENDANCE_HISTORY.filter(r => r.status === 'late').length;
  const attendancePercentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  // Table Columns config
  const columns = [
    { header: 'Date', field: 'date' },
    { header: 'Course', field: 'course' },
    { header: 'Session / Lesson', field: 'session' },
    { 
      header: 'Status', 
      field: 'status',
      render: (row) => {
        switch (row.status) {
          case 'present':
            return <Badge variant="secondary">Present</Badge>;
          case 'absent':
            return <Badge variant="danger" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Absent</Badge>;
          case 'late':
            return <Badge variant="warning" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>Late</Badge>;
          default:
            return <span>{row.status}</span>;
        }
      }
    }
  ];

  return (
    <div className="attendance-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">My Attendance</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
          Track your live session attendance history.
        </p>
      </div>

      {/* Stats Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xxl)' }}>
        <Card className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: '50%' }}>
            <span className="headline-sm">{attendancePercentage}%</span>
          </div>
          <div>
            <h3 className="title-md">Overall</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Attendance Rate</p>
          </div>
        </Card>

        <Card className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}>
          <div style={{ color: 'var(--color-secondary)' }}><CheckCircle size={32} /></div>
          <div>
            <h3 className="headline-md">{presentCount}</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Present</p>
          </div>
        </Card>

        <Card className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}>
          <div style={{ color: '#D97706' }}><Clock size={32} /></div>
          <div>
            <h3 className="headline-md">{lateCount}</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Late</p>
          </div>
        </Card>

        <Card className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}>
          <div style={{ color: '#DC2626' }}><XCircle size={32} /></div>
          <div>
            <h3 className="headline-md">{absentCount}</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Absent</p>
          </div>
        </Card>
      </div>

      {/* History Table */}
      <section>
        <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Attendance History</h2>
        <Table columns={columns} data={MOCK_ATTENDANCE_HISTORY} />
      </section>
    </div>
  );
};
