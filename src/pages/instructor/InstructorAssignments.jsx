import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Edit } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import '../student/Assignments.css'; // Reuse styles

export const MOCK_INSTRUCTOR_ASSIGNMENTS = [
  {
    id: 'a1',
    title: 'Data Cleaning Project',
    courseName: 'Advanced Data Science with Python',
    dueDate: '2023-11-15',
    submissionsCount: 24,
    totalStudents: 30
  },
  {
    id: 'a2',
    title: 'Final Capstone Proposal',
    courseName: 'Advanced Data Science with Python',
    dueDate: '2023-12-01',
    submissionsCount: 5,
    totalStudents: 30
  },
  {
    id: 'a4',
    title: 'Color Palette Selection',
    courseName: 'UX/UI Design Principles',
    dueDate: '2023-10-10',
    submissionsCount: 15,
    totalStudents: 15
  }
];

export const InstructorAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState(MOCK_INSTRUCTOR_ASSIGNMENTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('Advanced Data Science with Python');
  const [newDueDate, setNewDueDate] = useState('');

  const handleCreate = () => {
    if (!newTitle || !newDueDate) return;
    
    const newAssignment = {
      id: `a${Date.now()}`,
      title: newTitle,
      courseName: newCourse,
      dueDate: newDueDate,
      submissionsCount: 0,
      totalStudents: 30
    };
    
    setAssignments(prev => [newAssignment, ...prev]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDueDate('');
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
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ gap: '8px' }}>
          <Plus size={18} /> Create Assignment
        </Button>
      </div>

      <div className="assignments-list">
        {assignments.map(assignment => (
          <Card key={assignment.id} className="assignment-card">
            <div className="assignment-card-header">
              <div>
                <h3 className="title-lg">{assignment.title}</h3>
                <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                  {assignment.courseName}
                </p>
              </div>
              <div className="assignment-meta" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span className="body-sm">Due: {assignment.dueDate}</span>
                <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}>
                  <Users size={14} /> {assignment.submissionsCount} / {assignment.totalStudents} Submitted
                </span>
              </div>
            </div>
            
            <div className="assignment-card-actions" style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
              <Button variant="secondary" style={{ gap: '8px' }}>
                <Edit size={16} /> Edit
              </Button>
              <Button variant="primary" onClick={() => navigate(`/instructor/assignment/${assignment.id}/submissions`)}>
                View Submissions
              </Button>
            </div>
          </Card>
        ))}
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
                <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Course</label>
                <select 
                  className="input-field" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)' }}
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                >
                  <option>Advanced Data Science with Python</option>
                  <option>Full-Stack React & Node.js</option>
                  <option>UX/UI Design Principles</option>
                </select>
              </div>
              <Input 
                label="Due Date" 
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate}>Create Assignment</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
