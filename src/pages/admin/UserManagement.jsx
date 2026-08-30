import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import './Admin.css';

const MOCK_USERS = [
  { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Student', status: 'Active', joined: '2023-11-10' },
  { id: 'u2', name: 'Bob Smith', email: 'bob@example.com', role: 'Instructor', status: 'Active', joined: '2023-10-05' },
  { id: 'u3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Student', status: 'Suspended', joined: '2023-09-15' },
  { id: 'u4', name: 'Diana Prince', email: 'diana@example.com', role: 'Admin', status: 'Active', joined: '2022-01-20' },
  { id: 'u5', name: 'Evan Davis', email: 'evan@example.com', role: 'Student', status: 'Active', joined: '2023-11-25' },
];

export const UserManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for modals
  const [suspendUser, setSuspendUser] = useState(null); // stores user obj when suspending
  const [editUser, setEditUser] = useState(null);

  // Filter users based on tabs and search
  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesTab = activeTab === 'all' || user.role.toLowerCase() === activeTab;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const columns = [
    { header: 'Name', field: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Email', field: 'email', render: (row) => <span style={{ color: 'var(--color-on-surface-variant)' }}>{row.email}</span> },
    { 
      header: 'Role', 
      field: 'role',
      render: (row) => {
        if (row.role === 'Admin') return <Badge variant="primary">Admin</Badge>;
        if (row.role === 'Instructor') return <Badge variant="secondary" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>Instructor</Badge>;
        return <Badge variant="secondary">Student</Badge>;
      }
    },
    { 
      header: 'Status', 
      field: 'status',
      render: (row) => (
        <Badge variant={row.status === 'Active' ? 'primary' : 'danger'} style={{ backgroundColor: row.status === 'Active' ? '#D1FAE5' : '#FEE2E2', color: row.status === 'Active' ? '#065F46' : '#991B1B' }}>
          {row.status}
        </Badge>
      )
    },
    { header: 'Joined', field: 'joined' },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn" onClick={() => setEditUser(row)} title="Edit Role">
            <Edit size={16} />
          </button>
          {row.status === 'Active' ? (
            <button className="icon-btn danger" onClick={() => setSuspendUser(row)} title="Suspend User">
              <ShieldAlert size={16} />
            </button>
          ) : (
            <button className="icon-btn" style={{ color: '#059669' }} onClick={() => alert('User reactivated')} title="Reactivate User">
              <ShieldAlert size={16} />
            </button>
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

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 className="headline-lg">User Management</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Manage platform access and roles.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', backgroundColor: 'var(--color-surface-container-lowest)', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)' }}>
          <Search size={18} style={{ color: 'var(--color-on-surface-variant)' }} />
          <input 
            type="text" 
            placeholder="Search users..." 
            style={{ border: 'none', outline: 'none', background: 'transparent' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs 
        tabs={[
          { id: 'all', label: 'All Users' },
          { id: 'student', label: 'Students' },
          { id: 'instructor', label: 'Instructors' },
          { id: 'admin', label: 'Admins' }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <section style={{ marginTop: 'var(--spacing-xl)' }}>
        <Table columns={columns} data={filteredUsers} />
        {filteredUsers.length === 0 && (
          <div className="text-center p-xl" style={{ border: '1px dashed var(--color-outline)', borderTop: 'none' }}>
            <p className="body-md">No users found matching your search.</p>
          </div>
        )}
      </section>

      {/* Modals */}
      {suspendUser && (
        <Modal isOpen={true} onClose={() => setSuspendUser(null)} title="Suspend User">
          <div className="modal-body">
            <p className="body-md" style={{ marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to suspend <strong>{suspendUser.name}</strong>? They will no longer be able to log in.
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
              <Button variant="ghost" onClick={() => setSuspendUser(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { alert('User suspended'); setSuspendUser(null); }}>Suspend User</Button>
            </div>
          </div>
        </Modal>
      )}

      {editUser && (
        <Modal isOpen={true} onClose={() => setEditUser(null)} title={`Edit Role: ${editUser.name}`}>
          <div className="modal-body">
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Assign Role</label>
              <select className="input-field" style={{ width: '100%' }} defaultValue={editUser.role}>
                <option value="Student">Student</option>
                <option value="Instructor">Instructor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
              <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => { alert('Role updated'); setEditUser(null); }}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
