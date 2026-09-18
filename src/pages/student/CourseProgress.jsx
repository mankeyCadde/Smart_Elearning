import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle, MinusCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { apiFetch } from '../../services/api';

export const CourseProgress = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/courses/${id}/content/`)
      .then(data => {
        if (cancelled) return;
        setCourse(data.course);
        setSections(data.sections || []);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="p-xl text-center"><p className="body-md">Loading progress...</p></div>;
  }

  if (error || !course) {
    return (
      <div className="p-xl text-center">
        <h2 className="headline-md">Cannot load progress</h2>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{error || 'This course is unavailable.'}</p>
        <Button variant="primary" onClick={() => navigate('/student/dashboard')} style={{ marginTop: 'var(--spacing-md)' }}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const allLessons = sections.flatMap(s => s.lessons);
  const completedCount = allLessons.filter(l => l.progress?.completed).length;
  const totalCount = allLessons.length;
  const overall = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const sectionProgress = sections.map(section => {
    const done = section.lessons.filter(l => l.progress?.completed).length;
    const pct = section.lessons.length ? Math.round((done / section.lessons.length) * 100) : 0;
    return { ...section, done, pct };
  });

  return (
    <div style={{ maxWidth: '900px' }}>
      <Button variant="ghost" onClick={() => navigate(`/student/course/${course.id}`)} style={{ gap: '8px', marginBottom: 'var(--spacing-md)' }}>
        <ArrowLeft size={18} /> Back to Course
      </Button>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Course Progress</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          {course.title}
        </p>
      </div>

      <Card style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          <div>
            <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Overall Completion</p>
            <p className="headline-md" style={{ marginTop: '4px' }}>{overall}%</p>
          </div>
          <Button variant="primary" onClick={() => navigate(`/student/course/${course.id}/video`)} style={{ gap: '8px' }}>
            <PlayCircle size={16} /> Continue Learning
          </Button>
        </div>
        <ProgressBar percentage={overall} size="lg" />
        <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-sm)' }}>
          {completedCount} of {totalCount} lessons completed
        </p>
      </Card>

      <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>By Section</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {sectionProgress.map(section => (
          <Card key={section.id} style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
              <h3 className="title-md">{section.title}</h3>
              <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                {section.done}/{section.lessons.length} · {section.pct}%
              </span>
            </div>
            <ProgressBar percentage={section.pct} />
            <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column' }}>
              {section.lessons.map(lesson => {
                const isDone = lesson.progress?.completed;
                return (
                  <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                    {isDone ? <CheckCircle size={16} color="var(--color-primary)" /> : <MinusCircle size={16} color="var(--color-outline)" />}
                    <span className="body-md" style={{ color: isDone ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)' }}>
                      {lesson.title}
                    </span>
                    {isDone && lesson.progress?.completedAt && (
                      <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)', marginLeft: 'auto' }}>
                        {new Date(lesson.progress.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};