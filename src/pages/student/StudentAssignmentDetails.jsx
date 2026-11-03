import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, ChevronLeft, CheckCircle, File, Download, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { apiFetch, apiDownload, ApiError } from '../../services/api';

const formatDue = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

export const StudentAssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Submission state
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/assignments/${id}/`)
      .then(data => {
        if (cancelled) return;
        setAssignment(data);
        if (data.mySubmission) {
          setContent(data.mySubmission.content || '');
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setSubmitError('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile && !content.trim()) return;
    setIsSubmitting(true);
    setSubmitError('');
    const formData = new FormData();
    if (content.trim()) formData.append('content', content.trim());
    if (selectedFile) formData.append('file', selectedFile);
    try {
      const updated = await apiFetch(`/assignments/${id}/`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      setAssignment(updated);
      setSelectedFile(null);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    const file = assignment?.mySubmission?.file;
    if (!file) return;
    try {
      await apiDownload(file, `submission-${assignment.id}`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to download submission.');
    }
  };

  if (loading) return <p className="p-xl body-md">Loading assignment...</p>;
  if (error || !assignment) {
    return (
      <div className="p-xl text-center">
        <h2 className="headline-md">Assignment unavailable</h2>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{error || 'Assignment not found.'}</p>
        <Button variant="primary" onClick={() => navigate('/student/assignments')} style={{ marginTop: 'var(--spacing-md)' }}>Back to Assignments</Button>
      </div>
    );
  }

  const sub = assignment.mySubmission;
  const status = !sub ? 'pending' : sub.grade != null ? 'graded' : 'submitted';

  return (
    <div className="assignment-details-page">
      <Button variant="ghost" onClick={() => navigate('/student/assignments')} style={{ marginBottom: 'var(--spacing-md)' }}>
        <ChevronLeft size={18} /> Back to Assignments
      </Button>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="label-sm" style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>
            {assignment.courseTitle}
          </p>
          <h1 className="headline-lg">{assignment.title}</h1>
        </div>
        
        <div className="status-badge">
          {status === 'pending' && <Badge variant="danger" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>Pending Submission</Badge>}
          {status === 'submitted' && <Badge variant="secondary">Submitted</Badge>}
          {status === 'graded' && <Badge variant="primary">Graded: {sub.grade} / {assignment.points}</Badge>}
        </div>
      </div>

      <div className="assignment-layout" style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
        {/* Left Column: Instructions */}
        <div style={{ flex: '2 1 400px' }}>
          <Card className="p-xl">
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>Instructions</h2>
            <div className="body-lg" style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
              <p>{assignment.description || 'No instructions provided yet.'}</p>
            </div>
            
            {status === 'graded' && sub.feedback && (
              <div style={{ marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--rounded-md)' }}>
                <h4 className="title-sm" style={{ marginBottom: '4px' }}>Instructor Feedback</h4>
                <p className="body-md">{sub.feedback}</p>
                <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                  Graded {sub.gradedAt ? new Date(sub.gradedAt).toLocaleDateString() : ''} · {sub.grade} / {assignment.points} points
                </p>
              </div>
            )}
            
            <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-outline-variant)' }}>
              <h3 className="title-md" style={{ marginBottom: 'var(--spacing-sm)' }}>Due Date</h3>
              <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                {assignment.dueDate ? formatDue(assignment.dueDate) : '—'} · {assignment.points} points
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Submission Form */}
        <div style={{ flex: '1 1 300px' }}>
          <Card className="p-xl">
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Your Submission</h2>
            
            {status === 'pending' ? (
              <div className="submission-form">
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Submission Text</label>
                  <textarea
                    className="input-field"
                    rows="4"
                    placeholder="Write your answer here (or attach a file)"
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setSubmitError(''); }}
                  ></textarea>
                </div>
                <div
                  className="file-upload-area"
                  style={{
                    border: '2px dashed var(--color-outline-variant)',
                    borderRadius: 'var(--rounded-lg)',
                    padding: 'var(--spacing-xl)',
                    textAlign: 'center',
                    marginBottom: 'var(--spacing-lg)',
                    backgroundColor: 'var(--color-surface-container-lowest)'
                  }}
                >
                  {selectedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <File size={32} style={{ color: 'var(--color-primary)' }} />
                      <span className="body-md">{selectedFile.name}</span>
                      <Button variant="ghost" onClick={() => setSelectedFile(null)}><X size={14} /> Remove File</Button>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-md)' }} />
                      <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-md)' }}>
                        Click to browse for a file.
                      </p>
                      <input
                        type="file"
                        id="file-upload"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file-upload">
                        <span className="btn btn-secondary">Browse Files</span>
                      </label>
                    </>
                  )}
                </div>

                {submitError && <p className="body-sm" style={{ color: '#B91C1C', marginBottom: 'var(--spacing-sm)' }}>{submitError}</p>}

                <Button
                  variant="primary"
                  style={{ width: '100%' }}
                  disabled={(!selectedFile && !content.trim()) || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              </div>
            ) : (
              <div className="submission-success text-center">
                <CheckCircle size={48} style={{ color: 'var(--color-primary)', margin: '0 auto var(--spacing-md)' }} />
                <h3 className="title-md" style={{ marginBottom: 'var(--spacing-sm)' }}>Submission Received</h3>
                <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {status === 'graded' ? `Graded: ${sub.grade} / ${assignment.points}` : 'Your submission is under review.'} 
                </p>
                <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                  Submitted {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ''}
                </p>
                {sub.content && <p className="body-sm" style={{ marginTop: 'var(--spacing-sm)' }}>{sub.content.length > 120 ? sub.content.slice(0, 120) + '…' : sub.content}</p>}
                {(status !== 'graded') && (
                  <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)', width: '100%' }} onClick={() => setAssignment({ ...assignment, mySubmission: null })}>
                    Edit Submission
                  </Button>
                )}
                {sub.file && (
                  <Button variant="secondary" style={{ width: '100%', marginTop: 'var(--spacing-sm)', gap: '8px' }} onClick={handleDownload}>
                    <Download size={16} /> Download Submission
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};