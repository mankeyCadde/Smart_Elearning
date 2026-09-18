import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, LogIn, LogOut } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { apiFetch } from '../../services/api';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '';

export const StudentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const loadRecords = () =>
    apiFetch('/attendance/mine/')
      .then(data => setRecords(data || []))
      .catch(() => {});

  useEffect(() => {
    let cancelled = false;
    apiFetch('/enrollments/mine/')
      .then(data => {
        if (!cancelled) setCourses(data || []);
      })
      .catch(() => {});
    apiFetch('/attendance/mine/')
      .then(data => { if (!cancelled) setRecords(data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const todayKey = new Date().toLocaleDateString();
  const todayRecords = records.filter(r => fmtDate(r.sessionDate) === todayKey);
  const activeToday = selectedCourseId ? todayRecords.find(r => r.courseId === Number(selectedCourseId)) : null;
  const inToday = activeToday?.checkedInAt || null;
  const outToday = activeToday?.checkedOutAt || null;

  const checkIn = async () => {
    if (!selectedCourseId) { setActionErr('Select a course first.'); return; }
    setActionMsg(''); setActionErr('');
    try {
      await apiFetch('/attendance/check-in/', { method: 'POST', body: { courseId: Number(selectedCourseId) } });
      setActionMsg('Checked in successfully.');
      await loadRecords();
    } catch (err) {
      setActionErr(err.message || 'Check-in failed.');
    }
  };

  const checkOut = async () => {
    if (!selectedCourseId) { setActionErr('Select a course first.'); return; }
    setActionMsg(''); setActionErr('');
    try {
      await apiFetch('/attendance/check-out/', { method: 'POST', body: { courseId: Number(selectedCourseId) } });
      setActionMsg('Checked out successfully.');
      await loadRecords();
    } catch (err) {
      setActionErr(err.message || 'Check-out failed.');
    }
  };

  const total = records.length;
  const presentCount = records.filter(r => r.checkedInAt).length;
  const withOut = records.filter(r => r.checkedOutAt).length;
  const attendancePercentage = total > 0 ? Math.round((presentCount / total) * 100) : 100;

  const columns = [
    { header: 'Date', field: 'sessionDate', render: (row) => fmtDate(row.sessionDate) },
    { header: 'Course', field: 'courseTitle' },
    {
      header: 'Check In',
      field: 'checkedInAt',
      render: (row) => row.checkedInAt ? fmtTime(row.checkedInAt) : <span style={{ color: 'var(--color-on-surface-variant)' }}>—</span>
    },
    {
      header: 'Check Out',
      field: 'checkedOutAt',
      render: (row) => row.checkedOutAt ? fmtTime(row.checkedOutAt) : <span style={{ color: 'var(--color-on-surface-variant)' }}>—</span>
    },
    {
      header: 'Status',
      field: 'status',
      render: (row) => {
        if (!row.checkedInAt) return <Badge variant="danger" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Absent</Badge>;
        if (row.checkedOutAt) return <Badge variant="secondary">Completed Session</Badge>;
        return <Badge variant="warning" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>Present</Badge>;
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

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xxl)' }}>
        <Card className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: '50%' }}>
            <span className="headline-sm">{attendancePercentage}%</span>
          </div>
          <div>
            <h3 className="title-md">Overall</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Sessions attended</p>
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
            <h3 className="headline-md">{withOut}</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Completed Sessions</p>
          </div>
        </Card>
      </div>

      {/* Today check-in panel */}
      <Card className="p-xl" style={{ marginBottom: 'var(--spacing-xxl)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-lg)', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="title-lg" style={{ marginBottom: '4px' }}>Today's Session</h2>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              {inToday
                ? `Checked in at ${fmtTime(inToday)}${outToday ? ` · checked out at ${fmtTime(outToday)}` : ''}`
                : 'Not checked in yet today.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 400px', justifyContent: 'flex-end' }}>
            <select
              className="input-field body-md"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{ minWidth: '240px' }}
            >
              <option value="">Select a course...</option>
              {courses.map(c => (
                <option key={c.courseId} value={c.courseId}>{c.courseTitle}</option>
              ))}
            </select>
            <Button variant="primary" onClick={checkIn} disabled={!!inToday} style={{ gap: '8px' }}>
              <LogIn size={16} /> Check In
            </Button>
            <Button variant="secondary" onClick={checkOut} disabled={!inToday || !!outToday} style={{ gap: '8px' }}>
              <LogOut size={16} /> Check Out
            </Button>
          </div>
        </div>
        {actionMsg && <p className="body-sm" style={{ color: 'var(--color-primary)', marginTop: 'var(--spacing-sm)' }}>{actionMsg}</p>}
        {actionErr && <p className="body-sm" style={{ color: '#B91C1C', marginTop: 'var(--spacing-sm)' }}>{actionErr}</p>}
      </Card>

      {/* History Table */}
      <section>
        <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Attendance History</h2>
        {loading ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading attendance...</p>
        ) : (
          <Table columns={columns} data={records} />
        )}
      </section>
    </div>
  );
};