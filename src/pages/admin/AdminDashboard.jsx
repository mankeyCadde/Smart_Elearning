import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, DollarSign, ClipboardCheck, ChevronRight, Tag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../services/api';
import './Admin.css';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleString() : '';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState({ enrollments: [], submissions: [], attendance: [] });

  useEffect(() => {
    let cancelled = false;
    apiFetch('/analytics/admin/dashboard/')
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => {});
    apiFetch('/analytics/admin/activity/')
      .then(a => { if (!cancelled) setActivity(a || {}); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const users = data?.users || {};
  const courses = data?.courses || {};
  const enrollments = data?.enrollments || {};
  const assessments = data?.assessments || {};

  const activityItems = [
    ...(activity.enrollments || []).map(e => ({ key: `enroll-${e.courseId}-${e.studentEmail}`, type: 'enrollment', text: `${e.studentName} enrolled in "${e.courseTitle}"`, time: fmtTime(e.at) })),
    ...(activity.submissions || []).map(s => ({ key: `sub-${s.studentEmail}-${s.quizTitle}`, type: 'submission', text: `${s.studentName} scored ${s.score ?? '—'}% on "${s.quizTitle}"`, time: fmtTime(s.at) })),
    ...(activity.attendance || []).map(a => ({ key: `att-${a.studentEmail}-${a.sessionDate}`, type: 'attendance', text: `${a.studentName} checked in for "${a.courseTitle}"`, time: fmtTime(a.checkedInAt) })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

  const dotColor = (type) => type === 'enrollment' ? '#2563EB' : type === 'submission' ? '#7C3AED' : '#059669';

  return (
    <div className="admin-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Admin Dashboard</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          Platform overview and quick metrics.
        </p>
      </div>

      <div className="admin-stats-grid">
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <Users size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Users</p>
            <h3 className="headline-lg">{(users.total || 0).toLocaleString()}</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              {users.students || 0} students · {users.instructors || 0} instructors · {users.admins || 0} admins
            </p>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Courses</p>
            <h3 className="headline-lg">{courses.total || 0}</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              {courses.published || 0} published · {courses.unpublished || 0} drafts
            </p>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
            <ClipboardCheck size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Assessments</p>
            <h3 className="headline-lg">{assessments.submissions || 0}</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              {assessments.quizzes || 0} quizzes · {assessments.gradedSubmissions || 0} graded
            </p>
          </div>
        </Card>
        <Card className="stat-box">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Revenue</p>
            <h3 className="headline-lg">${Number(enrollments.revenue || 0).toLocaleString()}</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              {enrollments.total || 0} enrollments
            </p>
          </div>
        </Card>
      </div>

      <div className="admin-dashboard-layout" style={{ display: 'flex', gap: 'var(--spacing-xl)', marginTop: 'var(--spacing-xxl)' }}>

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
                  <h3 className="title-md">Course Management</h3>
                  <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Review, publish, and manage courses.</p>
                </div>
              </div>
              <ChevronRight style={{ color: 'var(--color-outline)' }} />
            </Card>

            <Card className="admin-module-card" onClick={() => navigate('/admin/reports')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-on-surface)' }}>
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <h3 className="title-md">Reports & Analytics</h3>
                  <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Platform-wide engagement and revenue.</p>
                </div>
              </div>
              <ChevronRight style={{ color: 'var(--color-outline)' }} />
            </Card>

            <Card className="admin-module-card" onClick={() => navigate('/admin/coupons')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-on-surface)' }}>
                  <Tag size={24} />
                </div>
                <div>
                  <h3 className="title-md">Coupon Codes</h3>
                  <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Create and manage course discounts.</p>
                </div>
              </div>
              <ChevronRight style={{ color: 'var(--color-outline)' }} />
            </Card>

          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>Recent Activity</h2>
          <Card className="p-xl">
            {activityItems.length === 0 ? (
              <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>No recent activity yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {activityItems.map(act => (
                  <div key={act.key} style={{ display: 'flex', gap: 'var(--spacing-md)', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 'var(--spacing-md)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor(act.type), marginTop: '6px' }}></div>
                    <div>
                      <p className="body-sm">{act.text}</p>
                      <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" style={{ width: '100%', marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/admin/reports')}>View Reports</Button>
          </Card>
        </div>

      </div>
    </div>
  );
};