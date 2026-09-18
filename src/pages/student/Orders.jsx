import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { apiFetch } from '../../services/api';

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const statusStyle = (status) => {
  if (status === 'COMPLETED') return { backgroundColor: '#D1FAE5', color: '#065F46' };
  if (status === 'REFUNDED') return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
  return {};
};

export const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiFetch('/orders/mine/')
      .then(data => { if (!cancelled) setOrders(data || []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const columns = [
    {
      header: 'Course',
      field: 'courseTitle',
      render: (row) => (
        <strong style={{ color: 'var(--color-on-surface)', cursor: 'pointer' }} onClick={() => navigate(`/course/${row.courseId}`)}>
          {row.courseTitle}
        </strong>
      )
    },
    { header: 'Coupon', field: 'couponCode', render: (row) => row.couponCode || <span style={{ color: 'var(--color-on-surface-variant)' }}>—</span> },
    { header: 'Subtotal', field: 'subtotal', render: (row) => money(row.subtotal) },
    {
      header: 'Discount',
      field: 'discount',
      render: (row) => Number(row.discount) > 0
        ? <span style={{ color: '#059669' }}>-{money(row.discount)}</span>
        : <span style={{ color: 'var(--color-on-surface-variant)' }}>—</span>
    },
    { header: 'Total Paid', field: 'total', render: (row) => <strong>{money(row.total)}</strong> },
    {
      header: 'Status',
      field: 'status',
      render: (row) => <Badge variant={row.status === 'COMPLETED' ? 'primary' : 'secondary'} style={statusStyle(row.status)}>{row.status.replace(/_/g, ' ')}</Badge>
    },
    { header: 'Date', field: 'createdAt', render: (row) => fmtDate(row.createdAt) },
  ];

  return (
    <div className="orders-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">My Orders</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          Review your purchase history and coupons used.
        </p>
      </div>

      {loading ? (
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading orders...</p>
      ) : error ? (
        <p className="body-md" style={{ color: '#B91C1C' }}>{error}</p>
      ) : (
        <>
          <Table columns={columns} data={orders} />
          {orders.length === 0 && (
            <p className="body-md text-center" style={{ color: 'var(--color-on-surface-variant)', padding: 'var(--spacing-xl)' }}>
              No orders yet. Browse the catalog to enroll in a course.
            </p>
          )}
        </>
      )}
    </div>
  );
};