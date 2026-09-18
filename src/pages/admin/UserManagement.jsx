import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, ShieldAlert, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { apiFetch, ApiError } from '../../services/api';
import './Admin.css';

const ROLE_TABS = [
  { id: 'all', label: 'All Users', query: '' },
  { id: 'STUDENT', label: 'Students', query: 'STUDENT' },
  { id: 'INSTRUCTOR', label: 'Instructors', query: 'INSTRUCTOR' },
  { id: 'ADMIN', label: 'Admins', query: 'ADMIN' },
];

const roleBadge = (role) => {
  if (role === 'ADMIN') return <Badge variant="primary">Admin</Badge>;
  if (role === 'INSTRUCTOR') return <Badge variant="secondary" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>Instructor</Badge>;
  return <Badge variant="secondary">Student</Badge>;
};

export const UserManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null); // { user, action: 'suspend'|'delete' }
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = () => {
    const tab = ROLE_TABS.find(t => t.id === activeTab);
    const params = new URLSearchParams();
    if (tab?.query) params.set('role', tab.query);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    setLoading(true);
    apiFetch(`/admin/users/?${params.toString()}`)
      .then(data => setUsers(data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSearch = () => load();

  const saveEdit = async () => {
    try {
      await apiFetch(`/admin/users/${editUser.id}/`, {
        method: 'PATCH',
        body: { role: editUser.role, isActive: editUser.isActive },
      });
      setActionMsg(`Updated ${editUser.fullName}.`);
      setEditUser(null);
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Failed to update user.');
    }
  };

  const confirmAction = async () => {
    try {
      if (confirmUser.action === 'delete') {
        await apiFetch(`/admin/users/${confirmUser.id}/`, { method: 'DELETE' });
        setActionMsg(`Deleted ${confirmUser.fullName}.`);
      } else {
        await apiFetch(`/admin/users/${confirmUser.id}/`, {
          method: 'PATCH',
          body: { isActive: !confirmUser.isActive },
        });
        setActionMsg(confirmUser.isActive ? `Suspended ${confirmUser.fullName}.` : `Reactivated ${confirmUser.fullName}.`);
      }
      setConfirmUser(null);
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Action failed.');
    }
  };

  const [createForm, setCreateForm] = useState({ email: '', firstName: '', lastName: '', password: '', role: 'STUDENT' });

  const createUser = async () => {
    try {
      await apiFetch('/admin/users/', {
        method: 'POST',
        body: {
          email: createForm.email,
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          password: createForm.password,
          role: createForm.role,
          isActive: true,
        },
      });
      setActionMsg(`Created ${createForm.email}.`);
      setIsCreateOpen(false);
      setCreateForm({ email: '', firstName: '', lastName: '', password: '', role: 'STUDENT' });
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Failed to create user.');
    }
  };

  const columns = [
    { header: 'Name', field: 'fullName', render: (row) => <strong>{row.fullName || row.email}</strong> },
    { header: 'Email', field: 'email', render: (row) => <span style={{ color: 'var(--color-on-surface-variant)' }}>{row.email}</span> },
    { header: 'Role', field: 'role', render: (row) => roleBadge(row.role) },
    {
      header: 'Status',
      field: 'isActive',
      render: (row) => (
        <Badge variant={row.isActive ? 'primary' : 'danger'} style={{ backgroundColor: row.isActive ? '#D1FAE5' : '#FEE2E2', color: row.isActive ? '#065F46' : '#991B1B' }}>
          {row.isActive ? 'Active' : 'Suspended'}
        </Badge>
      )
    },
    { header: 'Joined', field: 'dateJoined', render: (row) => row.dateJoined ? new Date(row.dateJoined).toLocaleDateString() : '—' },
    { header: 'Enrollments', field: 'enrollmentsCount', render: (row) => <span style={{ color: 'var(--color-on-surface-variant)' }}>{row.enrollmentsCount}</span> },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn" onClick={() => setEditUser(row)} title="Edit Role">
            <Edit size={16} />
          </button>
          <button className="icon-btn" style={{ color: row.isActive ? '#DC2626' : '#059669' }} onClick={() => setConfirmUser({ ...row, action: 'status' })} title={row.isActive ? 'Suspend User' : 'Reactivate User'}>
            <ShieldAlert size={16} />
          </button>
          <button className="icon-btn danger" onClick={() => setConfirmUser({ ...row, action: 'delete' })} title="Delete User">
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

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 className="headline-lg">User Management</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Manage platform access and roles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', backgroundColor: 'var(--color-surface-container-lowest)', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)' }}>
            <Search size={18} style={{ color: 'var(--color-on-surface-variant)' }} />
            <input
              type="text"
              placeholder="Search users..."
              style={{ border: 'none', outline: 'none', background: 'transparent' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
          </div>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)} style={{ gap: '6px' }}>
            <Plus size={16} /> Add User
          </Button>
        </div>
      </div>

      {actionMsg && <p className="body-sm" style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }}>{actionMsg}</p>}

      <Tabs
        tabs={ROLE_TABS.map(t => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <section style={{ marginTop: 'var(--spacing-xl)' }}>
        {loading ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading users...</p>
        ) : (
          <>
            <Table columns={columns} data={users} />
            {users.length === 0 && (
              <div className="text-center p-xl" style={{ border: '1px dashed var(--color-outline)', borderTop: 'none' }}>
                <p className="body-md">No users found.</p>
              </div>
            )}
          </>
        )}
      </section>

      {editUser && (
        <Modal isOpen={true} onClose={() => setEditUser(null)} title={`Edit Role: ${editUser.fullName}`}>
          <div className="modal-body">
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Assign Role</label>
              <select
                className="input-field"
                style={{ width: '100%' }}
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editUser.isActive}
                onChange={(e) => setEditUser({ ...editUser, isActive: e.target.checked })}
              />
              <span className="body-md">Account active</span>
            </label>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button variant="primary" onClick={saveEdit}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}

      {confirmUser && (
        <Modal isOpen={true} onClose={() => setConfirmUser(null)} title={confirmUser.action === 'delete' ? 'Delete User' : confirmUser.isActive ? 'Suspend User' : 'Reactivate User'}>
          <div className="modal-body">
            <p className="body-md" style={{ marginBottom: 'var(--spacing-md)' }}>
              {confirmUser.action === 'delete'
                ? `Permanently delete ${confirmUser.fullName}? This cannot be undone.`
                : `Are you sure you want to ${confirmUser.isActive ? 'suspend' : 'reactivate'} ${confirmUser.fullName}?`}
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
              <Button variant="ghost" onClick={() => setConfirmUser(null)}>Cancel</Button>
              <Button variant={confirmUser.action === 'delete' ? 'danger' : 'primary'} onClick={confirmAction}>
                {confirmUser.action === 'delete' ? 'Delete User' : confirmUser.isActive ? 'Suspend User' : 'Reactivate User'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isCreateOpen && (
        <Modal isOpen={true} onClose={() => setIsCreateOpen(false)} title="Add New User">
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                  <Input label="First Name" value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <Input label="Last Name" value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} />
                </div>
              </div>
              <Input label="Email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              <Input label="Password" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Role</label>
                <select className="input-field" style={{ width: '100%' }} value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={createUser}>Create User</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};