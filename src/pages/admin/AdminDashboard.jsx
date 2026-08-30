import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, DollarSign, ShieldAlert, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import './Admin.css';

const MOCK_STATS = {
  totalUsers: 14500,
  activeCourses: 342,
  totalRevenue: 285000,
  pendingApprovals: 12
};

const RECENT_ACTIVITY = [
  { id: 1, type: 'signup', user: 'Emma Watson', role: 'Student', time: '10 mins ago' },
  { id: 2, type: 'approval', course: 'Advanced React Patterns', instructor: 'Dan A.', time: '1 hour ago' },
  { id: 3, type: 'signup', user: 'Michael Scott', role: 'Instructor', time: '3 hours ago' },
  { id: 4, type: 'report', user: 'System', message: 'Weekly backup completed', time: '5 hours ago' }
];

export const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Admin Dashboard</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          Platform overview and quick metrics.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="admin-stats-grid">
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <Users size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Users</p>
            <h3 className="headline-lg">{MOCK_STATS.totalUsers.toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Active Courses</p>
            <h3 className="headline-lg">{MOCK_STATS.activeCourses}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Pending Approvals</p>
            <h3 className="headline-lg">{MOCK_STATS.pendingApprovals}</h3>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Revenue</p>
            <h3 className="headline-lg">${MOCK_STATS.totalRevenue.toLocaleString()}</h3>
          </div>
        </Card>
      </div>

      <div className="admin-dashboard-layout" style={{ display: 'flex', gap: 'var(--spacing-xl)', marginTop: 'var(--spacing-xxl)' }}>
        
        {/* Quick Management Links */}
        <div style={{ flex: 2 }}>
          <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>Management Modules</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            
            <Card className="admin-module-card" onClick={() => navigate('/admin/users')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-on-surface)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="title-md">User Management</h3>
                  <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Manage students, instructors, and admins.</p>
                </div>
              </div>
              <ChevronRight style={{ color: 'var(--color-outline)' }} />
            </Card>

            <Card className="admin-module-card" onClick={() => navigate('/admin/courses')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-on-surface)' }}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="title-md">Course Management & Approvals</h3>
                  <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Review pending courses and manage categories.</p>
                </div>
              </div>
              <ChevronRight style={{ color: 'var(--color-outline)' }} />
            </Card>

          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ flex: 1 }}>
          <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>Recent Activity</h2>
          <Card className="p-xl">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {RECENT_ACTIVITY.map(act => (
                <div key={act.id} style={{ display: 'flex', gap: 'var(--spacing-md)', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 'var(--spacing-md)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: act.type === 'signup' ? '#2563EB' : act.type === 'approval' ? '#D97706' : '#6B7280', marginTop: '6px' }}></div>
                  <div>
                    {act.type === 'signup' && <p className="body-sm"><strong>{act.user}</strong> joined as a {act.role}.</p>}
                    {act.type === 'approval' && <p className="body-sm">Course <strong>{act.course}</strong> submitted for review.</p>}
                    {act.type === 'report' && <p className="body-sm">{act.message}</p>}
                    <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" style={{ width: '100%', marginTop: 'var(--spacing-md)' }}>View Full Audit Log</Button>
          </Card>
        </div>

      </div>
    </div>
  );
};
