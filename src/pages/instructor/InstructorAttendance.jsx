import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { apiFetch } from '../../services/api';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';

export const InstructorAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/instructor/courses/')
      .then(data => {
        const list = (data && (data.results ?? data)) || [];
        setCourses(list);
        setSelectedCourseId(prev => prev || list[0]?.id?.toString() || '');
      })
      .catch(() => {});
  }, []);

  const loadRoster = async () => {
    if (!selectedCourseId || !selectedDate) return;
    setLoading(true);
    setError('');
    try {
      const [roster, attendance] = await Promise.all([
        apiFetch(`/analytics/instructor/courses/${selectedCourseId}/students/`),
        apiFetch(`/courses/${selectedCourseId}/attendance/?date=${selectedDate}`).catch(() => []),
      ]);
      setCourseTitle(roster.courseTitle || '');
      const recordByStudent = {};
      (attendance || []).forEach(a => { recordByStudent[a.studentId] = a; });
      const combined = (roster.students || []).map(s => ({
        id: s.studentId,
        studentName: s.studentName,
        studentEmail: s.studentEmail,
        progress: s.progress,
        attendanceSessions: s.attendanceSessions,
        checkedInAt: recordByStudent[s.studentId]?.checkedInAt || null,
        checkedOutAt: recordByStudent[s.studentId]?.checkedOutAt || null,
        status: recordByStudent[s.studentId]?.checkedInAt ? 'present' : 'absent',
      }));
      setRows(combined);
    } catch (err) {
      setError(err.message || 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId && selectedDate) loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, selectedDate]);

  const presentCount = rows.filter(r => r.status === 'present').length;
  const absentCount = rows.length - presentCount;

  const columns = [
    { header: 'Student Name', field: 'studentName', render: (row) => <span style={{ fontWeight: 500 }}>{row.studentName}</span> },
    { header: 'Email', field: 'studentEmail' },
    {
      header: 'Status',
      field: 'status',
      render: (row) => (
        row.status === 'present'
          ? <Badge variant="secondary">Present</Badge>
          : <Badge variant="danger" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Absent</Badge>
      )
    },
    { header: 'Check In', field: 'checkedInAt', render: (row) => fmtTime(row.checkedInAt) },
    { header: 'Check Out', field: 'checkedOutAt', render: (row) => fmtTime(row.checkedOutAt) },
    { header: '%', field: 'progress', render: (row) => `${row.progress}%` },
  ];

  return (
    <div className="instructor-attendance-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Course Attendance</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
          Review attendance for live sessions.
        </p>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', flex: 1, minWidth: '200px' }}>
            <label className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Select Course</label>
            <select
              className="body-md"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-lowest)' }}
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', flex: 1, minWidth: '200px' }}>
            <label className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Session Date</label>
            <input
              type="date"
              className="body-md"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-lowest)' }}
            />
          </div>

          <Button variant="secondary" style={{ height: '40px' }} onClick={loadRoster} disabled={loading}>
            {loading ? 'Loading...' : 'Load Roster'}
          </Button>
        </div>
        {error && <p className="body-sm" style={{ color: '#B91C1C', marginTop: 'var(--spacing-sm)' }}>{error}</p>}
      </Card>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <h2 className="title-lg">Class Roster</h2>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              {courseTitle} · {new Date(selectedDate).toLocaleDateString()}
            </p>
          </div>
          <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            {rows.length} students · <strong style={{ color: 'var(--color-secondary)' }}>{presentCount} present</strong> · <strong style={{ color: '#DC2626' }}>{absentCount} absent</strong>
          </span>
        </div>

        <Table columns={columns} data={rows} />
      </section>
    </div>
  );
};