import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { apiFetch } from '../../services/api';

export const QuizHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiFetch('/submissions/')
      .then(data => { if (!cancelled) setHistory(data || []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const columns = [
    {
      header: 'Quiz Title',
      field: 'quizTitle',
      render: (row) => (
        <strong style={{ color: 'var(--color-on-surface)', cursor: 'pointer' }} onClick={() => navigate(`/student/quiz/${row.quizId}`)}>
          {row.quizTitle}
        </strong>
      )
    },
    { header: 'Course', field: 'courseTitle' },
    {
      header: 'Date Taken',
      field: 'date',
      render: (row) => {
        const raw = row.completedAt || row.startedAt;
        return raw ? new Date(raw).toLocaleDateString() : '—';
      }
    },
    {
      header: 'Attempt',
      field: 'attemptNumber',
      render: (row) => <span>#{(row.attemptNumber || 1)}</span>
    },
    {
      header: 'Score',
      field: 'score',
      render: (row) => (
        row.score != null
          ? <span>{row.score}%</span>
          : <span style={{ color: 'var(--color-on-surface-variant)' }}>—</span>
      )
    },
    {
      header: 'Status',
      field: 'status',
      render: (row) => {
        if (row.score != null) {
          return row.score >= 50
            ? <Badge variant="secondary">Passed</Badge>
            : <Badge variant="danger" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Not Passed</Badge>;
        }
        if (row.status === 'IN_PROGRESS') {
          return <Badge variant="warning" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>In Progress</Badge>;
        }
        return <Badge variant="secondary">{row.status || 'Submitted'}</Badge>;
      }
    }
  ];

  return (
    <div className="quiz-history-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Quiz History</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          Review your past assessment performance.
        </p>
      </div>

      {loading ? (
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading quiz history...</p>
      ) : error ? (
        <p className="body-md" style={{ color: '#B91C1C' }}>{error}</p>
      ) : (
        <section>
          <Table columns={columns} data={history} />
          {history.length === 0 && (
            <p className="body-md text-center" style={{ color: 'var(--color-on-surface-variant)', padding: 'var(--spacing-xl)' }}>
              No quiz attempts yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
};