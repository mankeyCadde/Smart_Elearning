import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { apiFetch, ApiError } from '../../services/api';
import '../student/Assignments.css';

const fmtDue = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const InstructorAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPoints, setNewPoints] = useState('100');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    apiFetch('/instructor/assignments/')
      .then(data => setAssignments(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    let cancelled = false;
    apiFetch('/instructor/courses/')
      .then(data => {
        if (!cancelled) {
          const list = (data && (data.results ?? data)) || [];
          setCourses(list);
          setNewCourseId(prev => prev || (list[0]?.id?.toString() ?? ''));
        }
      })
      .catch(() => {});
    apiFetch('/instructor/assignments/')
      .then(data => { if (!cancelled) setAssignments(data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setNewTitle(''); setNewDescription(''); setNewDueDate(''); setNewPoints('100'); setCreateError('');
    setNewCourseId(courses[0]?.id?.toString() ?? '');
    setIsCreateModalOpen(true);
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newCourseId || !newDueDate) { setCreateError('Title, course, and due date are required.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      await apiFetch('/instructor/assignments/', {
        method: 'POST',
        body: {
          title: newTitle.trim(),
          description: newDescription.trim(),
          courseId: Number(newCourseId),
          dueDate: newDueDate,
          points: Number(newPoints) || 100,
          published: true,
        },
      });
      await load();
      setIsCreateModalOpen(false);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create assignment.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="assignments-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="headline-lg">Manage Assignments</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Create assignments and track submissions.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} style={{ gap: '8px' }}>
          <Plus size={18} /> Create Assignment
        </Button>
      </div>

      <div className="assignments-list">
        {loading ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', padding: 'var(--spacing-lg)' }}>No assignments yet.</p>
        ) : (
          assignments.map(assignment => (
            <Card key={assignment.id} className="assignment-card">
                <div className="assignment-card-header">
                  <div>
                    <h3 className="title-lg">{assignment.title}</h3>
                    <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                      {assignment.courseTitle}
                    </p>
                  </div>
                  <div className="assignment-meta" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="body-sm">Due: {fmtDue(assignment.dueDate)}</span>
                    <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}>
                      <Users size={14} /> {assignment.submissionsCount || 0} submission{(assignment.submissionsCount || 0) === 1 ? '' : 's'}
                    </span>
                    {!assignment.published && <Badge variant="secondary">Draft</Badge>}
                  </div>
                </div>

                <div className="assignment-card-actions" style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                  <Button variant="primary" onClick={() => navigate(`/instructor/assignment/${assignment.id}/submissions`)} style={{ gap: '8px' }}>
                    <CheckCircle2 size={16} /> View Submissions
                  </Button>
                </div>
              </Card>
          ))
        )}
      </div>

      {isCreateModalOpen && (
        <Modal isOpen={true} onClose={() => setIsCreateModalOpen(false)} title="Create New Assignment">
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Input
                label="Assignment Title"
                placeholder="e.g. Module 1 Essay"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Description / Instructions</label>
                <textarea
                  className="input-field body-md"
                  style={{ width: '100%', minHeight: '80px', fontFamily: 'inherit' }}
                  placeholder="Provide instructions for students..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                ></textarea>
              </div>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Course</label>
                <select
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)' }}
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Due Date"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Points"
                    type="number"
                    value={newPoints}
                    onChange={(e) => setNewPoints(e.target.value)}
                  />
                </div>
              </div>
              {createError && <p className="body-sm" style={{ color: '#B91C1C' }}>{createError}</p>}
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create Assignment'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};