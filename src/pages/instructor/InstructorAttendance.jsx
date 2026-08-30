import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';

// Mock Roster Data for Instructor
const INITIAL_ROSTER = [
  { id: 's1', name: 'Alice Johnson', email: 'alice@example.com', status: 'present' },
  { id: 's2', name: 'Bob Smith', email: 'bob@example.com', status: 'present' },
  { id: 's3', name: 'Charlie Brown', email: 'charlie@example.com', status: 'absent' },
  { id: 's4', name: 'Diana Prince', email: 'diana@example.com', status: 'late' },
  { id: 's5', name: 'Evan Wright', email: 'evan@example.com', status: 'present' },
];

export const InstructorAttendance = () => {
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [selectedCourse, setSelectedCourse] = useState('c1');
  const [selectedDate, setSelectedDate] = useState('2023-10-30');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleStatusChange = (studentId, newStatus) => {
    setRoster(prev => prev.map(student => 
      student.id === studentId ? { ...student, status: newStatus } : student
    ));
    setSaveSuccess(false); // reset success message on edit
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const columns = [
    { header: 'Student Name', field: 'name', render: (row) => <span style={{ fontWeight: 500 }}>{row.name}</span> },
    { header: 'Email', field: 'email' },
    { 
      header: 'Mark Attendance', 
      field: 'status',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="body-sm">
            <input 
              type="radio" 
              name={`status-${row.id}`} 
              checked={row.status === 'present'} 
              onChange={() => handleStatusChange(row.id, 'present')} 
              style={{ accentColor: 'var(--color-secondary)' }}
            />
            Present
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="body-sm">
            <input 
              type="radio" 
              name={`status-${row.id}`} 
              checked={row.status === 'late'} 
              onChange={() => handleStatusChange(row.id, 'late')} 
              style={{ accentColor: '#D97706' }}
            />
            Late
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="body-sm">
            <input 
              type="radio" 
              name={`status-${row.id}`} 
              checked={row.status === 'absent'} 
              onChange={() => handleStatusChange(row.id, 'absent')} 
              style={{ accentColor: '#DC2626' }}
            />
            Absent
          </label>
        </div>
      )
    }
  ];

  return (
    <div className="instructor-attendance-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Manage Attendance</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
          Record student attendance for live sessions.
        </p>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', flex: 1, minWidth: '200px' }}>
            <label className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Select Course</label>
            <select 
              className="body-md" 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-lowest)' }}
            >
              <option value="c1">Advanced Data Science with Python</option>
              <option value="c2">Full-Stack React & Node.js</option>
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

          <Button variant="secondary" style={{ height: '40px' }}>Load Roster</Button>
        </div>
      </Card>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2 className="title-lg">Class Roster</h2>
          <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{roster.length} Students</span>
        </div>
        
        <Table columns={columns} data={roster} />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
          {saveSuccess && <span className="body-sm" style={{ color: 'var(--color-secondary)' }}>Attendance saved successfully!</span>}
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </section>
    </div>
  );
};
