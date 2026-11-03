import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { apiFetch, apiDownload, ApiError } from '../../services/api';

export const InstructorSubmissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeGradeStudent, setActiveGradeStudent] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradeError, setGradeError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    apiFetch(`/instructor/assignments/${id}/submissions/`)
      .then(data => setSubmissions(data || []))
      .catch(() => {});

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch(`/assignments/${id}/`).catch(() => null),
      apiFetch(`/instructor/assignments/${id}/submissions/`).catch(() => []),
    ])
      .then(([asg, subs]) => {
        if (cancelled) return;
        setAssignment(asg);
        setSubmissions(subs || []);
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleOpenGrade = (submission) => {
    setActiveGradeStudent(submission);
    setGradeInput(submission.grade ?? '');
    setFeedbackInput(submission.feedback || '');
    setGradeError('');
  };

  const handleSaveGrade = async () => {
    if (!activeGradeStudent) return;
    if (gradeInput === '' || Number(gradeInput) < 0) { setGradeError('Enter a valid grade.'); return; }
    setSaving(true);
    setGradeError('');
    try {
      await apiFetch(`/instructor/assignment-submissions/${activeGradeStudent.id}/grade/`, {
        method: 'POST',
        body: { grade: Number(gradeInput), feedback: feedbackInput.trim() },
      });
      await load();
      setActiveGradeStudent(null);
    } catch (err) {
      setGradeError(err instanceof ApiError ? err.message : 'Failed to save grade.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (submission) => {
    if (!submission.file) return;
    try {
      await apiDownload(submission.file, `submission-${submission.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to download submission.');
    }
  };

  const columns = [
    { header: 'Student Name', field: 'studentName', render: (row) => <strong style={{ color: 'var(--color-on-surface)' }}>{row.studentName}</strong> },
    {
      header: 'Status',
      field: 'status',
      render: (row) => (
        row.status === 'GRADED'
          ? <Badge variant="primary">Graded</Badge>
          : <Badge variant="secondary">Needs Grading</Badge>
      )
    },
    {
      header: 'Date Submitted',
      field: 'submittedAt',
      render: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '—'
    },
    {
      header: 'Submission',
      field: 'content',
      render: (row) => {
        if (row.file) {
          return (
            <button type="button" onClick={() => handleDownload(row)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
              <FileText size={14} /> <Download size={14} /> View File
            </button>
          );
        }
        if (row.content) return <span style={{ maxWidth: '240px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.content}</span>;
        return <span style={{ color: 'var(--color-on-surface-variant)' }}>No file</span>;
      }
    },
    {
      header: 'Grade',
      field: 'grade',
      render: (row) => row.grade != null ? <strong>{row.grade} / {assignment?.points ?? '—'}</strong> : '-'
    },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <Button variant="secondary" onClick={() => handleOpenGrade(row)}>
          {row.status === 'GRADED' ? 'Edit Grade' : 'Grade'}
        </Button>
      )
    }
  ];

  if (loading) return <p className="p-xl body-md">Loading submissions...</p>;
  if (error) return <div className="p-xl text-center"><p className="body-md" style={{ color: '#B91C1C' }}>{error}</p></div>;

  return (
    <div className="submissions-page">
      <Button variant="ghost" onClick={() => navigate('/instructor/assignments')} style={{ marginBottom: 'var(--spacing-md)' }}>
        <ChevronLeft size={18} /> Back to Assignments
      </Button>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">{assignment?.title || 'Assignment Submissions'}</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          Review and grade student work.
        </p>
      </div>

      <section>
        <Table columns={columns} data={submissions} />
        {submissions.length === 0 && (
          <p className="body-md text-center" style={{ color: 'var(--color-on-surface-variant)', padding: 'var(--spacing-xl)' }}>
            No submissions yet.
          </p>
        )}
      </section>

      {activeGradeStudent && (
        <Modal isOpen={true} onClose={() => setActiveGradeStudent(null)} title={`Grade Submission: ${activeGradeStudent.studentName}`}>
          <div className="modal-body">
            {activeGradeStudent.content && (
              <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--rounded-md)' }}>
                <p className="label-sm" style={{ marginBottom: '4px' }}>Student's response:</p>
                <p className="body-md" style={{ whiteSpace: 'pre-wrap' }}>{activeGradeStudent.content}</p>
              </div>
            )}

            <Input
              label={`Grade (0 – ${assignment?.points ?? 'max'})`}
              type="number"
              value={gradeInput}
              onChange={(e) => setGradeInput(e.target.value)}
              error={gradeError}
            />

            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Feedback (Optional)</label>
              <textarea
                className="input-field body-md"
                style={{ width: '100%', minHeight: '80px', fontFamily: 'inherit' }}
                placeholder="Leave comments for the student..."
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
              ></textarea>
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <Button variant="ghost" onClick={() => setActiveGradeStudent(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveGrade} disabled={saving}>{saving ? 'Saving...' : 'Save Grade'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};