import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle2, ClipboardList, CalendarCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Table } from '../../components/ui/Table';
import { apiFetch } from '../../services/api';

export const AdminCourseReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/analytics/instructor/courses/${id}/students/`)
      .then(res => { if (!cancelled) setData(res); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="p-xl text-center"><p className="body-md">Loading report...</p></div>;
  }

  if (error || !data) {
    return (
      <div className="p-xl text-center">
        <h2 className="headline-md">Cannot load course report</h2>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{error || 'Course not found.'}</p>
        <Button variant="primary" onClick={() => navigate('/admin/dashboard')} style={{ marginTop: 'var(--spacing-md)' }}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const students = data.students || [];
  const avgProgress = students.length
    ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
    : 0;
  const quizTaken = students.reduce((sum, s) => sum + (s.quiz?.taken || 0), 0);
  const quizPassed = students.reduce((sum, s) => sum + (s.quiz?.passed || 0), 0);
  const quizPassRate = quizTaken ? Math.round((quizPassed / quizTaken) * 100) : 0;
  const attendanceSessions = students.reduce((sum, s) => sum + (s.attendanceSessions || 0), 0);

  const columns = [
    { header: 'Student', field: 'studentName', render: (s) => (
      <div>
        <span className="title-sm">{s.studentName}</span>
        <div className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{s.studentEmail}</div>
      </div>
    ) },
    { header: 'Progress', field: 'progress', render: (s) => (
      <div style={{ minWidth: '120px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span className="label-sm">{s.progress}%</span>
          <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{s.completedLessons}/{data.totalLessons || 0}</span>
        </div>
        <ProgressBar percentage={s.progress} />
      </div>
    ) },
    { header: 'Quiz', field: 'quiz', render: (s) => (
      <span className="body-sm">
        {s.quiz?.taken ? `${s.quiz.passed}/${s.quiz.taken} passed (${s.quiz.passRate ?? 0}%)` : '—'}
      </span>
    ) },
    { header: 'Attendance', field: 'attendanceSessions', render: (s) => (
      <span className="body-sm">{s.attendanceSessions} sessions</span>
    ) },
    { header: 'Last Activity', field: 'lastActivity', render: (s) => (
      <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
        {s.lastActivity ? new Date(s.lastActivity).toLocaleDateString() : '—'}
      </span>
    ) },
  ];

  const summary = [
    { icon: <Users size={20} />, label: 'Enrolled Students', value: students.length },
    { icon: <CheckCircle2 size={20} />, label: 'Average Progress', value: `${avgProgress}%` },
    { icon: <ClipboardList size={20} />, label: 'Quiz Pass Rate', value: `${quizPassRate}%` },
    { icon: <CalendarCheck size={20} />, label: 'Attendance Sessions', value: attendanceSessions },
  ];

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} style={{ gap: '8px', marginBottom: 'var(--spacing-md)' }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </Button>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Course Report</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          {data.courseTitle} · {data.totalLessons || 0} lessons
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        {summary.map(item => (
          <Card key={item.label} style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: 'var(--color-primary)' }}>
              {item.icon}
            </div>
            <p className="headline-md">{item.value}</p>
            <p className="label-md" style={{ color: 'var(--color-on-surface-variant)' }}>{item.label}</p>
          </Card>
        ))}
      </div>

      <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>Student Engagement</h2>
      <Table columns={columns} data={students} keyField="studentId" />
    </div>
  );
};