import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X, Eye, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { apiFetch, ApiError } from '../../services/api';
import './Admin.css';

export const CourseManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('published');
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [confirmCourse, setConfirmCourse] = useState(null); // { course, action: 'publish'|'unpublish'|'delete' }
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const load = () => {
    const published = activeTab === 'published' ? 'true' : 'false';
    setLoading(true);
    apiFetch(`/admin/courses/?published=${published}`)
      .then(data => setCourses(data || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'categories') {
      apiFetch('/instructor/categories/')
        .then(data => setCategories((data && (data.results ?? data)) || []))
        .catch(() => setCategories([]));
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const confirmAction = async () => {
    try {
      if (confirmCourse.action === 'delete') {
        await apiFetch(`/admin/courses/${confirmCourse.id}/`, { method: 'DELETE' });
        setActionMsg(`Deleted "${confirmCourse.title}".`);
      } else {
        await apiFetch(`/admin/courses/${confirmCourse.id}/`, {
          method: 'PATCH',
          body: { published: confirmCourse.action === 'publish' },
        });
        setActionMsg(confirmCourse.action === 'publish'
          ? `Published "${confirmCourse.title}".`
          : `Unpublished "${confirmCourse.title}".`);
      }
      setConfirmCourse(null);
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Action failed.');
    }
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await apiFetch('/instructor/categories/', {
        method: 'POST',
        body: { name: newCatName.trim() },
      });
      setNewCatName('');
      setIsAddCategoryOpen(false);
      setActionMsg(`Added category "${newCatName.trim()}".`);
      apiFetch('/instructor/categories/').then(data => setCategories((data && (data.results ?? data)) || [])).catch(() => {});
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Failed to create category.');
    }
  };

  const courseColumns = [
    { header: 'Course Title', field: 'title', render: (row) => <strong>{row.title}</strong> },
    { header: 'Instructor', field: 'instructorName' },
    {
      header: 'Category',
      field: 'category',
      render: (row) => categories.find(c => c.id === row.category)?.name || '—'
    },
    {
      header: 'Price',
      field: 'price',
      render: (row) => `$${Number(row.price || 0).toLocaleString()}`
    },
    {
      header: 'Rating',
      field: 'rating',
      render: (row) => `${Number(row.rating || 0).toFixed(1)} (${row.reviews || 0})`
    },
    {
      header: 'Students',
      field: 'enrolledStudents',
      render: (row) => row.enrolledStudents
    },
    { header: 'Level', field: 'level', render: (row) => row.level ? row.level[0] + row.level.slice(1).toLowerCase() : '—' },
    {
      header: 'Status',
      field: 'published',
      render: (row) => (
        <Badge variant={row.published ? 'primary' : 'secondary'} style={{ backgroundColor: row.published ? '#D1FAE5' : '#F3F4F6', color: row.published ? '#065F46' : '#4B5563' }}>
          {row.published ? 'Published' : 'Draft'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn" onClick={() => navigate(`/course/${row.id}`)} title="View Course">
            <Eye size={16} />
          </button>
          <button className="icon-btn" style={{ color: row.published ? '#B45309' : '#059669' }} onClick={() => setConfirmCourse({ ...row, action: row.published ? 'unpublish' : 'publish' })} title={row.published ? 'Unpublish' : 'Publish'}>
            {row.published ? <X size={16} /> : <Check size={16} />}
          </button>
          <button className="icon-btn danger" onClick={() => setConfirmCourse({ ...row, action: 'delete' })} title="Delete Course">
            <Trash2 size={16} />
          </button>
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
            Review, publish, and organize the course catalog.
          </p>
        </div>

        {activeTab === 'categories' && (
          <Button variant="primary" onClick={() => setIsAddCategoryOpen(true)} style={{ gap: '8px' }}>
            <Plus size={18} /> Add Category
          </Button>
        )}
      </div>

      {actionMsg && <p className="body-sm" style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }}>{actionMsg}</p>}

      <Tabs
        tabs={[
          { id: 'published', label: 'Published Courses' },
          { id: 'draft', label: 'Drafts' },
          { id: 'categories', label: 'Manage Categories' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <section style={{ marginTop: 'var(--spacing-xl)' }}>
        {activeTab === 'categories' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
            {categories.map(cat => (
              <Card key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="title-md">{cat.name}</span>
                <Badge variant="secondary">{cat.coursesCount || 0} Courses</Badge>
              </Card>
            ))}
          </div>
        ) : loading ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading courses...</p>
        ) : (
          <>
            <Table columns={courseColumns} data={courses} />
            {courses.length === 0 && (
              <div className="text-center p-xl" style={{ border: '1px dashed var(--color-outline)', borderTop: 'none' }}>
                <p className="body-md text-muted">No courses found.</p>
              </div>
            )}
          </>
        )}
      </section>

      {confirmCourse && (
        <Modal isOpen={true} onClose={() => setConfirmCourse(null)} title={
          confirmCourse.action === 'delete' ? 'Delete Course'
            : confirmCourse.action === 'publish' ? 'Publish Course' : 'Unpublish Course'
        }>
          <div className="modal-body">
            <p className="body-md" style={{ marginBottom: 'var(--spacing-md)' }}>
              {confirmCourse.action === 'delete'
                ? `Permanently delete "${confirmCourse.title}"? The course must be unpublished first.`
                : confirmCourse.action === 'publish'
                  ? `Publish "${confirmCourse.title}" to the live catalog?`
                  : `Unpublish "${confirmCourse.title}"? It will disappear from the public catalog.`}
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
              <Button variant="ghost" onClick={() => setConfirmCourse(null)}>Cancel</Button>
              <Button variant={confirmCourse.action === 'delete' ? 'danger' : 'primary'} onClick={confirmAction}>
                {confirmCourse.action === 'delete' ? 'Delete' : confirmCourse.action === 'publish' ? 'Publish' : 'Unpublish'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
              <Button variant="primary" onClick={addCategory}>Save Category</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};