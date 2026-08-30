import React from 'react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

const MOCK_QUIZ_HISTORY = [
  { id: 1, title: 'Module 1 Assessment: Python Basics', course: 'Advanced Data Science with Python', date: '2023-10-20', score: 85, passed: true },
  { id: 2, title: 'Midterm Exam', course: 'Full-Stack React & Node.js', date: '2023-10-15', score: 92, passed: true },
  { id: 3, title: 'Color Theory Quiz', course: 'UX/UI Design Principles', date: '2023-10-10', score: 60, passed: false },
  { id: 4, title: 'Module 2 Assessment: Pandas', course: 'Advanced Data Science with Python', date: '2023-10-05', score: 100, passed: true },
];

export const QuizHistory = () => {
  const columns = [
    { header: 'Quiz Title', field: 'title', render: (row) => <strong style={{ color: 'var(--color-on-surface)' }}>{row.title}</strong> },
    { header: 'Course', field: 'course' },
    { header: 'Date Taken', field: 'date' },
    { header: 'Score', field: 'score', render: (row) => <span>{row.score}%</span> },
    { 
      header: 'Status', 
      field: 'passed',
      render: (row) => (
        row.passed 
          ? <Badge variant="secondary">Passed</Badge> 
          : <Badge variant="danger" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Failed</Badge>
      )
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

      <section>
        <Table columns={columns} data={MOCK_QUIZ_HISTORY} />
      </section>
    </div>
  );
};
