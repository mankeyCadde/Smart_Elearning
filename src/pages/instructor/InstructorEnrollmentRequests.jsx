import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { apiFetch, ApiError } from '../../services/api';

export const InstructorEnrollmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/instructor/enrollment-requests/');
      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      await apiFetch(`/instructor/enrollment-requests/${id}/${action}/`, { method: 'PATCH' });
      // Update local state to reflect the change
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' } : r
      ));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const pastRequests = requests.filter(r => r.status !== 'PENDING');

  const pendingColumns = [
    {
      header: 'Student',
      field: 'studentName',
      render: (req) => (
        <div>
          <div style={{ fontWeight: '500' }}>{req.studentName}</div>
          <div className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{req.studentEmail}</div>
        </div>
      )
    },
    { header: 'Course', field: 'courseTitle' },
    { 
      header: 'Requested On', 
      field: 'enrolledAt',
      render: (req) => new Date(req.enrolledAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      field: 'actions',
      render: (req) => (
        <div style={{ textAlign: 'right' }}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleAction(req.id, 'reject')}
            disabled={actionLoading === req.id}
            style={{ color: 'var(--color-error)', marginRight: 'var(--spacing-xs)' }}
          >
            <XCircle size={16} style={{ marginRight: '4px' }} /> Reject
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleAction(req.id, 'accept')}
            disabled={actionLoading === req.id}
          >
            <CheckCircle size={16} style={{ marginRight: '4px' }} /> Accept
          </Button>
        </div>
      )
    }
  ];

  const pastColumns = [
    {
      header: 'Student',
      field: 'studentName',
      render: (req) => <div style={{ fontWeight: '500' }}>{req.studentName}</div>
    },
    { header: 'Course', field: 'courseTitle' },
    {
      header: 'Status',
      field: 'status',
      render: (req) => (
        <Badge variant={req.status === 'ACCEPTED' ? 'success' : 'error'}>
          {req.status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
        </Badge>
      )
    }
  ];

  return (
    <div className="container" style={{ padding: 'var(--spacing-xl) 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="headline-lg">Enrollment Requests</h1>
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Review and manage student requests to join your courses.
          </p>
        </div>
      </div>

      <Card style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
        <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>Pending Requests</h2>
        {loading ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading requests...</p>
        ) : pendingRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <UserPlus size={48} style={{ color: 'var(--color-outline)', marginBottom: 'var(--spacing-sm)' }} />
            <p className="body-lg">No pending requests</p>
            <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>You're all caught up!</p>
          </div>
        ) : (
          <Table columns={pendingColumns} data={pendingRequests} keyField="id" />
        )}
      </Card>

      {pastRequests.length > 0 && (
        <Card style={{ padding: 'var(--spacing-xl)' }}>
          <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>Recently Processed</h2>
          <Table columns={pastColumns} data={pastRequests.slice(0, 10)} keyField="id" />
        </Card>
      )}
    </div>
  );
};
