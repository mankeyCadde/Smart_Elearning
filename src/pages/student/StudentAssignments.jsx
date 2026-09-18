import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { apiFetch } from '../../services/api';
import './Assignments.css';

const formatDue = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const StudentAssignments = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/assignments/')
      .then(list => {
        if (!cancelled) setAssignments(list || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const withStatus = assignments.map(a => {
    const sub = a.mySubmission;
    const status = !sub ? 'pending' : sub.grade != null ? 'graded' : 'submitted';
    return { ...a, status, grade: sub?.grade };
  });

  const pending = withStatus.filter(a => a.status === 'pending');
  const completed = withStatus.filter(a => a.status !== 'pending');
  const displayList = activeTab === 'pending' ? pending : completed;

  return (
    <div className="assignments-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">My Assignments</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          Track and submit your coursework.
        </p>
      </div>

      <Tabs 
        tabs={[
          { id: 'pending', label: `Pending (${pending.length})` },
          { id: 'completed', label: `Completed (${completed.length})` }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <div className="assignments-list" style={{ marginTop: 'var(--spacing-lg)' }}>
        {loading ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading assignments...</p>
        ) : displayList.length === 0 ? (
          <div className="empty-state text-center" style={{ padding: 'var(--spacing-xxxl)', border: '1px dashed var(--color-outline-variant)', borderRadius: 'var(--rounded-lg)' }}>
            <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
              No assignments found in this category.
            </p>
          </div>
        ) : (
          displayList.map(assignment => (
            <Card key={assignment.id} className="assignment-card">
              <div className="assignment-card-header">
                <div>
                  <h3 className="title-lg">{assignment.title}</h3>
                  <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                    {assignment.courseTitle}
                  </p>
                </div>
                <div className="assignment-meta">
                  {assignment.status === 'pending' && (
                    <span className="body-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B45309' }}>
                      <Clock size={14} /> Due: {formatDue(assignment.dueDate)}
                    </span>
                  )}
                  {assignment.status === 'submitted' && (
                    <Badge variant="secondary">Submitted (Pending Grade)</Badge>
                  )}
                  {assignment.status === 'graded' && (
                    <Badge variant="primary">Graded: {assignment.grade} / {assignment.points}</Badge>
                  )}
                </div>
              </div>
              
              <div className="assignment-card-actions" style={{ marginTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => navigate(`/student/assignment/${assignment.id}`)}>
                  {assignment.status === 'pending' ? 'View & Submit' : 'View Details'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};