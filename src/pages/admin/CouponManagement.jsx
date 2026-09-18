import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { apiFetch, ApiError } from '../../services/api';
import './Admin.css';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';
const money = (n) => n == null ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EMPTY_FORM = {
  code: '',
  discountType: 'PERCENT',
  value: '',
  courseId: '',
  expiresAt: '',
  maxUses: '0',
  isActive: true,
};

export const CouponManagement = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // coupon or null (create)
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = (q) => {
    setLoading(true);
    apiFetch(`/admin/coupons/${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(data => setCoupons(data || []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    apiFetch('/admin/courses/')
      .then(data => setCourses(data || []))
      .catch(() => setCourses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      value: String(coupon.value),
      courseId: coupon.courseId ? String(coupon.courseId) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      maxUses: String(coupon.maxUses),
      isActive: coupon.isActive,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || form.value === '' || Number(form.value) < 0) {
      setFormError('Code and a non-negative value are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        value: Number(form.value),
        courseId: form.courseId ? Number(form.courseId) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt + 'T23:59:59').toISOString() : null,
        maxUses: Number(form.maxUses) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await apiFetch(`/admin/coupons/${editing.id}/`, { method: 'PATCH', body: payload });
        setActionMsg(`Updated coupon ${payload.code}.`);
      } else {
        await apiFetch('/admin/coupons/', { method: 'POST', body: payload });
        setActionMsg(`Created coupon ${payload.code}.`);
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await apiFetch(`/admin/coupons/${coupon.id}/`, {
        method: 'PATCH',
        body: { isActive: !coupon.isActive },
      });
      setActionMsg(`${coupon.isActive ? 'Deactivated' : 'Activated'} ${coupon.code}.`);
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Action failed.');
    }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/admin/coupons/${confirmDelete.id}/`, { method: 'DELETE' });
      setActionMsg(`Deleted coupon ${confirmDelete.code}.`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Failed to delete coupon.');
    }
  };

  const columns = [
    { header: 'Code', field: 'code', render: (row) => <strong>{row.code}</strong> },
    {
      header: 'Discount',
      field: 'discountType',
      render: (row) => row.discountType === 'PERCENT'
        ? `${Number(row.value)}% off`
        : `$${money(row.value)} off`
    },
    { header: 'Applies to', field: 'courseTitle', render: (row) => row.courseTitle || <span style={{ color: 'var(--color-on-surface-variant)' }}>All courses</span> },
    {
      header: 'Uses',
      field: 'usedCount',
      render: (row) => `${row.usedCount}${row.maxUses ? ` / ${row.maxUses}` : ' / ∞'}`
    },
    { header: 'Expires', field: 'expiresAt', render: (row) => fmtDate(row.expiresAt) },
    {
      header: 'Status',
      field: 'isActive',
      render: (row) => (
        <Badge variant={row.isActive ? 'primary' : 'secondary'} style={{ backgroundColor: row.isActive ? '#D1FAE5' : '#F3F4F6', color: row.isActive ? '#065F46' : '#4B5563' }}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn" onClick={() => openEdit(row)} title="Edit Coupon"><Pencil size={16} /></button>
          <button className="icon-btn" onClick={() => toggleActive(row)} title={row.isActive ? 'Deactivate' : 'Activate'}>
            <Badge variant="secondary" style={{ fontSize: '11px', padding: '2px 8px' }}>{row.isActive ? 'Deactivate' : 'Activate'}</Badge>
          </button>
          <button className="icon-btn danger" onClick={() => setConfirmDelete(row)} title="Delete Coupon"><Trash2 size={16} /></button>
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
          <h1 className="headline-lg">Coupon Codes</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Create and manage discounts for course purchases.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} style={{ gap: '8px' }}>
          <Plus size={18} /> New Coupon
        </Button>
      </div>

      {actionMsg && <p className="body-sm" style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }}>{actionMsg}</p>}

      <div className="search-wrapper" style={{ marginBottom: 'var(--spacing-lg)', maxWidth: '360px' }}>
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search coupons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="notes-search-input body-md"
        />
      </div>

      {loading ? (
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading coupons...</p>
      ) : (
        <>
          <Table columns={columns} data={coupons} />
          {coupons.length === 0 && (
            <p className="body-md text-center" style={{ color: 'var(--color-on-surface-variant)', padding: 'var(--spacing-xl)' }}>
              No coupons found.
            </p>
          )}
        </>
      )}

      {isModalOpen && (
        <Modal isOpen={true} onClose={() => setIsModalOpen(false)} title={editing ? `Edit ${editing.code}` : 'Create Coupon'}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <Input
              label="Coupon Code"
              placeholder="e.g. SAVE20"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Discount Type</label>
                <select className="input-field" style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)', backgroundColor: 'var(--color-surface)' }} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FIXED">Fixed ($)</option>
                </select>
              </div>
              <Input
                label={form.discountType === 'PERCENT' ? 'Discount %' : 'Discount Amount ($)'}
                type="number"
                min="0"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Applies to Course</label>
              <select className="input-field" style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)', backgroundColor: 'var(--color-surface)' }} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">All courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <Input label="Expires On" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              <Input label="Max Uses (0 = unlimited)" type="number" min="0" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
            </div>
            <label className="body-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active (accepting redemptions)
            </label>

            {formError && <p className="body-sm" style={{ color: '#B91C1C' }}>{formError}</p>}

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Coupon'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal isOpen={true} onClose={() => setConfirmDelete(null)} title="Delete Coupon">
          <div className="modal-body">
            <p className="body-md" style={{ marginBottom: 'var(--spacing-md)' }}>
              Permanently delete coupon <strong>{confirmDelete.code}</strong>? Existing orders are preserved.
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};