import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, FileText, CheckCircle, BookOpen, Lightbulb, ChevronRight, PenTool } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import { apiFetch } from '../../services/api';

const lessonIcon = (type, isDone) => {
  if (isDone) return <CheckCircle size={16} color="var(--color-primary)" />;
  if (type === 'VIDEO') return <PlayCircle size={16} />;
  if (type === 'QUIZ') return <Lightbulb size={16} />;
  if (type === 'ASSIGNMENT') return <PenTool size={16} />;
  return <FileText size={16} />;
};

export const EnrolledCourse = () => {
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
    return <div className="p-xl text-center"><p className="body-md">Loading course...</p></div>;
  }

  if (error || !course) {
    return (
      <div className="p-xl text-center">
        <h2 className="headline-md">Cannot access this course</h2>
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
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const bookmarkCount = allLessons.filter(l => l.bookmarked).length;
  const noteCount = allLessons.reduce((sum, l) => sum + (l.notesCount || 0), 0);

  return (
    <div>
      <Card className="enrolled-course-hero" style={{ padding: 'var(--spacing-xxl)', marginBottom: 'var(--spacing-xl)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-lg)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <p className="label-sm" style={{ color: 'var(--color-primary)', marginBottom: '8px' }}>
              {course.category || 'Course'} · {course.level || 'Beginner'}
            </p>
            <h1 className="headline-lg" style={{ marginBottom: '8px' }}>{course.title}</h1>
            <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', maxWidth: '560px' }}>
              {course.description}
            </p>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-sm)' }}>
              Taught by <strong>{course.instructorName || 'SmartLearn Team'}</strong> · {totalCount} lessons · {sections.length} sections
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={() => navigate(`/student/course/${course.id}/video`)} style={{ gap: '8px', whiteSpace: 'nowrap' }}>
            <PlayCircle size={18} /> Continue Learning
          </Button>
        </div>
        <div style={{ marginTop: 'var(--spacing-xl)', maxWidth: '420px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span className="label-md">Progress</span>
            <span className="label-md" style={{ color: 'var(--color-on-surface-variant)' }}>{progress}% · {completedCount}/{totalCount} lessons</span>
          </div>
          <ProgressBar percentage={progress} />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Sections</p>
          <p className="headline-sm" style={{ marginTop: '4px' }}>{sections.length}</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Lessons Completed</p>
          <p className="headline-sm" style={{ marginTop: '4px' }}>{completedCount} / {totalCount}</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Bookmarks</p>
          <p className="headline-sm" style={{ marginTop: '4px' }}>{bookmarkCount}</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Notes</p>
          <p className="headline-sm" style={{ marginTop: '4px' }}>{noteCount}</p>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h2 className="title-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} /> Course Content
        </h2>
        <Button variant="ghost" onClick={() => navigate(`/student/course/${course.id}/progress`)} style={{ gap: '4px' }}>
          Detailed Progress <ChevronRight size={16} />
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card style={{ padding: 'var(--spacing-xxl)', textAlign: 'center' }}>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>No lessons have been added to this course yet.</p>
        </Card>
      ) : (
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <Accordion>
            {sections.map((section, sIndex) => {
              const sectionDone = section.lessons.filter(l => l.progress?.completed).length;
              return (
                <AccordionItem key={section.id} title={section.title} defaultOpen={sIndex === 0} rightContent={
                  <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {sectionDone}/{section.lessons.length}
                  </span>
                }>
                  <div>
                    {section.lessons.map(lesson => {
                      const isDone = lesson.progress?.completed;
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => navigate(`/student/course/${course.id}/video?lesson=${lesson.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', borderRadius: 'var(--rounded-sm)', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {lessonIcon(lesson.type, isDone)}
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="body-md">{lesson.title}</span>
                            <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                              {Math.round((lesson.duration || 0) / 60)} min
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Card>
      )}
    </div>
  );
};