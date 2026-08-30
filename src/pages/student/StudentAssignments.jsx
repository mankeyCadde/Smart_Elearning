import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import './Assignments.css';

export const MOCK_STUDENT_ASSIGNMENTS = [
  {
    id: 'a1',
    title: 'Data Cleaning Project',
    courseName: 'Advanced Data Science with Python',
    dueDate: '2023-11-15',
    status: 'pending' // 'pending' | 'submitted' | 'graded'
  },
  {
    id: 'a2',
    title: 'Final Capstone Proposal',
    courseName: 'Advanced Data Science with Python',
    dueDate: '2023-12-01',
    status: 'pending'
  },
  {
    id: 'a3',
    title: 'React Portfolio',
    courseName: 'Full-Stack React & Node.js',
    dueDate: '2023-10-01',
    status: 'graded',
    grade: 'A'
  },
  {
    id: 'a4',
    title: 'Color Palette Selection',
    courseName: 'UX/UI Design Principles',
    dueDate: '2023-10-10',
    status: 'submitted'
  }
];

export const StudentAssignments = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');

  const pending = MOCK_STUDENT_ASSIGNMENTS.filter(a => a.status === 'pending');
  const completed = MOCK_STUDENT_ASSIGNMENTS.filter(a => a.status !== 'pending');

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
        {displayList.length === 0 ? (
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
                    {assignment.courseName}
                  </p>
                </div>
                <div className="assignment-meta">
                  {assignment.status === 'pending' && (
                    <span className="body-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B45309' }}>
                      <Clock size={14} /> Due: {assignment.dueDate}
                    </span>
                  )}
                  {assignment.status === 'submitted' && (
                    <Badge variant="secondary">Submitted (Pending Grade)</Badge>
                  )}
                  {assignment.status === 'graded' && (
                    <Badge variant="primary">Grade: {assignment.grade}</Badge>
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
