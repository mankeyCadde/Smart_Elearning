import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X, Eye, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import './Admin.css';

const MOCK_COURSES = [
  { id: 'c1', title: 'Advanced Data Science', instructor: 'Bob Smith', category: 'Data Science', status: 'Published', date: '2023-11-01' },
  { id: 'c2', title: 'Intro to React', instructor: 'Dan A.', category: 'Web Dev', status: 'Pending Approval', date: '2023-11-28' },
  { id: 'c3', title: 'UX/UI Principles', instructor: 'Sarah J.', category: 'Design', status: 'Pending Approval', date: '2023-11-29' },
  { id: 'c4', title: 'Machine Learning 101', instructor: 'Bob Smith', category: 'Data Science', status: 'Published', date: '2023-10-15' },
];

const MOCK_CATEGORIES = [
  { id: 'cat1', name: 'Web Development', count: 45 },
  { id: 'cat2', name: 'Data Science', count: 32 },
  { id: 'cat3', name: 'Design', count: 18 },
  { id: 'cat4', name: 'Business', count: 12 },
];

export const CourseManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('published');
  
  // Modals
  const [approveCourse, setApproveCourse] = useState(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Course Filtering
  const filteredCourses = MOCK_COURSES.filter(c => 
    activeTab === 'published' ? c.status === 'Published' : c.status === 'Pending Approval'
  );

  const courseColumns = [
    { header: 'Course Title', field: 'title', render: (row) => <strong>{row.title}</strong> },
    { header: 'Instructor', field: 'instructor' },
    { header: 'Category', field: 'category' },
    { 
      header: 'Status', 
      field: 'status',
      render: (row) => (
        <Badge variant={row.status === 'Published' ? 'primary' : 'danger'} style={{ backgroundColor: row.status === 'Published' ? '#D1FAE5' : '#FEF3C7', color: row.status === 'Published' ? '#065F46' : '#B45309' }}>
          {row.status}
        </Badge>
      )
    },
    { header: 'Date', field: 'date' },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn" onClick={() => navigate(`/course/${row.id}`)} title="View Course Details">
            <Eye size={16} />
          </button>
          {row.status === 'Pending Approval' && (
            <>
              <button className="icon-btn" style={{ color: '#059669' }} onClick={() => setApproveCourse(row)} title="Approve Course">
                <Check size={16} />
              </button>
              <button className="icon-btn danger" onClick={() => alert('Course Rejected')} title="Reject Course">
                <X size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="admin-page">
      <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: 'var(--spacing-md)' }}>
        <ChevronLeft size={18} /> Back to Dashboard
      </Button>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="headline-lg">Course Management</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Review pending courses and manage catalog categories.
          </p>
        </div>
        
        {activeTab === 'categories' && (
          <Button variant="primary" onClick={() => setIsAddCategoryOpen(true)} style={{ gap: '8px' }}>
            <Plus size={18} /> Add Category
          </Button>
        )}
      </div>

      <Tabs 
        tabs={[
          { id: 'published', label: 'Published Courses' },
          { id: 'pending', label: 'Pending Approvals' },
          { id: 'categories', label: 'Manage Categories' }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <section style={{ marginTop: 'var(--spacing-xl)' }}>
        {activeTab === 'categories' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
            {MOCK_CATEGORIES.map(cat => (
              <Card key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="title-md">{cat.name}</span>
                <Badge variant="secondary">{cat.count} Courses</Badge>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <Table columns={courseColumns} data={filteredCourses} />
            {filteredCourses.length === 0 && (
              <div className="text-center p-xl" style={{ border: '1px dashed var(--color-outline)', borderTop: 'none' }}>
                <p className="body-md text-muted">No courses found in this category.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Approvals Modal */}
      {approveCourse && (
        <Modal isOpen={true} onClose={() => setApproveCourse(null)} title={`Approve Course: ${approveCourse.title}`}>
          <div className="modal-body">
            <p className="body-md" style={{ marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to approve this course and publish it to the live catalog?
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
              <Button variant="ghost" onClick={() => setApproveCourse(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => { alert('Course Approved & Published!'); setApproveCourse(null); }}>Approve Course</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Modal */}
      {isAddCategoryOpen && (
        <Modal isOpen={true} onClose={() => setIsAddCategoryOpen(false)} title="Add New Category">
          <div className="modal-body">
            <Input 
              label="Category Name" 
              placeholder="e.g. Graphic Design"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
              <Button variant="ghost" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => { alert('Category Created'); setIsAddCategoryOpen(false); setNewCatName(''); }}>Save Category</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
