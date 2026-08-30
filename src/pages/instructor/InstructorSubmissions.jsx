import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

// Mock Submissions Data
const INITIAL_SUBMISSIONS = [
  { id: 's1', studentName: 'Alice Johnson', dateSubmitted: '2023-11-10', file: 'alice_data_cleaning.pdf', grade: 'A', status: 'graded' },
  { id: 's2', studentName: 'Bob Smith', dateSubmitted: '2023-11-12', file: 'bob_project.zip', grade: null, status: 'submitted' },
  { id: 's3', studentName: 'Charlie Brown', dateSubmitted: '2023-11-14', file: 'charlie_analysis.pdf', grade: null, status: 'submitted' },
  { id: 's4', studentName: 'Diana Prince', dateSubmitted: '-', file: null, grade: null, status: 'pending' },
];

export const InstructorSubmissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [activeGradeStudent, setActiveGradeStudent] = useState(null); // stores submission object when grading
  const [gradeInput, setGradeInput] = useState('');

  const handleOpenGrade = (submission) => {
    setActiveGradeStudent(submission);
    setGradeInput(submission.grade || '');
  };

  const handleSaveGrade = () => {
    if (!activeGradeStudent) return;
    
    setSubmissions(prev => prev.map(sub => 
      sub.id === activeGradeStudent.id 
        ? { ...sub, grade: gradeInput, status: 'graded' }
        : sub
    ));
    setActiveGradeStudent(null);
  };

  const columns = [
    { header: 'Student Name', field: 'studentName', render: (row) => <strong style={{ color: 'var(--color-on-surface)' }}>{row.studentName}</strong> },
    { 
      header: 'Status', 
      field: 'status',
      render: (row) => {
        if (row.status === 'pending') return <Badge variant="danger" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>Pending</Badge>;
        if (row.status === 'submitted') return <Badge variant="secondary">Needs Grading</Badge>;
        return <Badge variant="primary">Graded</Badge>;
      }
    },
    { header: 'Date Submitted', field: 'dateSubmitted' },
    { 
      header: 'Submission File', 
      field: 'file',
      render: (row) => row.file ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', cursor: 'pointer' }}>
          <FileText size={14} /> {row.file}
        </span>
      ) : <span style={{ color: 'var(--color-on-surface-variant)' }}>No File</span>
    },
    { 
      header: 'Grade', 
      field: 'grade',
      render: (row) => row.grade ? <strong>{row.grade}</strong> : '-'
    },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <Button 
          variant="secondary" 
          disabled={row.status === 'pending'}
          onClick={() => handleOpenGrade(row)}
        >
          {row.status === 'graded' ? 'Edit Grade' : 'Grade'}
        </Button>
      )
    }
  ];

  return (
    <div className="submissions-page">
      <Button variant="ghost" onClick={() => navigate('/instructor/assignments')} style={{ marginBottom: 'var(--spacing-md)' }}>
        <ChevronLeft size={18} /> Back to Assignments
      </Button>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Assignment Submissions</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          Review and grade student work.
        </p>
      </div>

      <section>
        <Table columns={columns} data={submissions} />
      </section>

      {/* Grading Modal */}
      {activeGradeStudent && (
        <Modal isOpen={true} onClose={() => setActiveGradeStudent(null)} title={`Grade Submission: ${activeGradeStudent.studentName}`}>
          <div className="modal-body">
            <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--rounded-md)' }}>
              <p className="label-sm" style={{ marginBottom: '4px' }}>Submitted File:</p>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', cursor: 'pointer' }}>
                <FileText size={16} /> {activeGradeStudent.file}
              </span>
            </div>
            
            <Input 
              label="Grade (e.g. A, B+, 95/100)" 
              value={gradeInput}
              onChange={(e) => setGradeInput(e.target.value)}
            />
            
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Feedback (Optional)</label>
              <textarea 
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)', minHeight: '80px', fontFamily: 'inherit' }}
                placeholder="Leave comments for the student..."
              ></textarea>
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <Button variant="ghost" onClick={() => setActiveGradeStudent(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveGrade}>Save Grade</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
