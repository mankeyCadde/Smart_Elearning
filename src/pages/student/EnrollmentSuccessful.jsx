import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../services/api';

export const EnrollmentSuccessful = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get('courseId');
  const [courseTitle, setCourseTitle] = useState('');

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    apiFetch('/enrollments/mine/')
      .then(data => {
        if (cancelled) return;
        const match = (data || []).find(e => String(e.courseId) === String(courseId));
        if (match) setCourseTitle(match.courseTitle);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [courseId]);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <Card style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <CheckCircle size={64} color="var(--color-primary)" style={{ margin: '0 auto var(--spacing-lg)' }} />
        <h1 className="headline-lg" style={{ marginBottom: 'var(--spacing-sm)' }}>You're Enrolled!</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-xl)' }}>
          {courseTitle ? `You're ready to start learning in "${courseTitle}".` : 'Your enrollment was successful. Start learning now!'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          {courseId && (
            <Button variant="primary" onClick={() => navigate(`/student/course/${courseId}/video`)}>
              Start Learning
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};