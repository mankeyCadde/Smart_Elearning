import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiFetch, ApiError } from '../../services/api';

export const EnrollmentConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get('courseId');

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    apiFetch(`/courses/${courseId}/`)
      .then(data => { if (!cancelled) setCourse(data); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId]);

  const confirmEnroll = async () => {
    if (!courseId) return;
    if (Number(course?.price) > 0) {
      navigate(`/student/checkout/${courseId}`);
      return;
    }
    setEnrolling(true);
    try {
      await apiFetch('/enrollments/', { method: 'POST', body: { courseId: Number(courseId) } });
      navigate(`/student/enrollment-successful?courseId=${courseId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enrollment failed. Please try again.');
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="p-xl text-center"><p className="body-md">Loading course...</p></div>;
  }

  if (!courseId || (!course && !error)) {
    return (
      <div className="p-xl text-center" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Card style={{ padding: 'var(--spacing-xxl)' }}>
          <h2 className="headline-md">No course selected</h2>
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', margin: 'var(--spacing-md) 0' }}>
            Choose a course from the catalog to enroll.
          </p>
          <Button variant="primary" onClick={() => navigate('/catalog')}>Browse Catalog</Button>
        </Card>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="p-xl text-center" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Card style={{ padding: 'var(--spacing-xxl)' }}>
          <h2 className="headline-md">Course unavailable</h2>
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', margin: 'var(--spacing-md) 0' }}>{error}</p>
          <Button variant="primary" onClick={() => navigate('/catalog')}>Browse Catalog</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Confirm Enrollment</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          Review the course before you enroll.
        </p>
      </div>

      <Card style={{ padding: 'var(--spacing-xl)' }}>
        <h2 className="title-lg">{course.title}</h2>
        <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', margin: '6px 0 var(--spacing-md)' }}>
          {course.category || 'Course'} · {course.level || 'Beginner'} · Taught by {course.instructorName || 'SmartLearn Team'}
        </p>
        <p className="body-md" style={{ marginBottom: 'var(--spacing-lg)' }}>{course.description}</p>

        <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="body-md">Price</span>
            <span className="title-md">{Number(course.price) > 0 ? `$${course.price}` : 'Free'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Button variant="ghost" style={{ flex: 1 }} onClick={() => navigate(`/course/${course.id}`)}>Cancel</Button>
          <Button variant="primary" style={{ flex: 1 }} onClick={confirmEnroll} disabled={enrolling}>
            {enrolling ? (<><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enrolling...</>) : Number(course.price) > 0 ? 'Continue to Checkout' : 'Confirm & Enroll'}
          </Button>
        </div>
        {error && <p className="body-sm" style={{ color: '#DC2626', marginTop: 'var(--spacing-md)', textAlign: 'center' }}>{error}</p>}
      </Card>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: 'var(--spacing-lg)', color: 'var(--color-on-surface-variant)' }}>
        <CheckCircle size={16} color="var(--color-primary)" />
        <p className="body-sm">
          {Number(course.price) > 0
            ? 'Paid courses require checkout and a verified payment.'
            : 'Free courses require instructor approval.'}
        </p>
      </div>
    </div>
  );
};