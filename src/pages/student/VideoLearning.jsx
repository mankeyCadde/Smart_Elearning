import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, PlayCircle, FileText, CheckCircle, Bookmark, BookmarkCheck, PenTool, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import { apiFetch, ApiError } from '../../services/api';
import './VideoLearning.css';

function youtubeEmbed(idOrUrl) {
  const url = String(idOrUrl || '');
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/) || url.match(/^([\w-]{11})$/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export const VideoLearning = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [bookmarkedLessons, setBookmarkedLessons] = useState(new Set());
  const [bookmarkIds, setBookmarkIds] = useState({});
  const [savingId, setSavingId] = useState(null);

  // Load course content
  useEffect(() => {
    let cancelled = false;
    apiFetch(`/courses/${id}/content/`)
      .then(data => {
        if (cancelled) return;
        setCourse(data.course);
        setSections(data.sections || []);
        const lessons = (data.sections || []).flatMap(s => s.lessons);
        const done = lessons.filter(l => l.progress?.completed).map(l => l.id);
        setCompletedLessons(done);
        const paramLesson = Number(searchParams.get('lesson'));
        const requested = lessons.find(l => l.id === paramLesson);
        const firstPending = requested?.id || lessons.find(l => !l.progress?.completed)?.id || lessons[0]?.id || null;
        setCurrentLessonId(firstPending);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, searchParams]);

  // Load bookmarks
  useEffect(() => {
    let cancelled = false;
    apiFetch('/bookmarks/')
      .then(data => {
        if (cancelled) return;
        const list = data || [];
        setBookmarkedLessons(new Set(list.map(b => b.lessonId)));
        setBookmarkIds(Object.fromEntries(list.map(b => [b.lessonId, b.id])));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  // Flatten curriculum to easily find next/prev
  const allLessons = useMemo(() => sections.flatMap(module => module.lessons), [sections]);

  const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
  const currentLesson = allLessons[currentIndex];
  
  const hasNext = currentIndex < allLessons.length - 1;
  const hasPrev = currentIndex > 0;

  // Handlers
  const handleNext = () => {
    if (hasNext) setCurrentLessonId(allLessons[currentIndex + 1].id);
  };

  const handlePrev = () => {
    if (hasPrev) setCurrentLessonId(allLessons[currentIndex - 1].id);
  };

  const toggleComplete = useCallback(async () => {
    if (!currentLesson) return;
    const wasCompleted = completedLessons.includes(currentLesson.id);
    const next = !wasCompleted;
    setSavingId(currentLesson.id);
    // Optimistic update
    setCompletedLessons(prev =>
      next ? [...prev, currentLesson.id] : prev.filter(lId => lId !== currentLesson.id)
    );
    try {
      await apiFetch(`/lessons/${currentLesson.id}/progress/`, {
        method: 'PATCH',
        body: { completed: next },
      });
    } catch (err) {
      setCompletedLessons(prev =>
        wasCompleted ? [...prev, currentLesson.id] : prev.filter(lId => lId !== currentLesson.id)
      );
      alert(err instanceof ApiError ? err.message : 'Failed to update progress.');
    } finally {
      setSavingId(null);
    }
    if (next && hasNext) {
      const nextLesson = allLessons[currentIndex + 1];
      if (nextLesson) setTimeout(() => setCurrentLessonId(nextLesson.id), 1000);
    }
  }, [currentLesson, completedLessons, allLessons, currentIndex, hasNext]);

  const isCompleted = currentLesson ? completedLessons.includes(currentLesson.id) : false;
  const isBookmarked = currentLesson ? bookmarkedLessons.has(currentLesson.id) : false;

  const toggleBookmark = useCallback(async () => {
    if (!currentLesson) return;
    const wasBookmarked = isBookmarked;
    setSavingId(currentLesson.id);
    setBookmarkedLessons(prev => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(currentLesson.id); else next.add(currentLesson.id);
      return next;
    });
    try {
      if (wasBookmarked) {
        const bookmarkId = bookmarkIds[currentLesson.id];
        if (bookmarkId) await apiFetch(`/bookmarks/${bookmarkId}/`, { method: 'DELETE' });
      } else {
        await apiFetch('/bookmarks/', {
          method: 'POST',
          body: { lessonId: currentLesson.id },
        });
      }
    } catch (err) {
      setBookmarkedLessons(prev => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(currentLesson.id); else next.delete(currentLesson.id);
        return next;
      });
      alert(err instanceof ApiError ? err.message : 'Failed to update bookmark.');
    } finally {
      setSavingId(null);
    }
  }, [currentLesson, isBookmarked, bookmarkIds]);

  const progressPercentage = allLessons.length ? Math.round((completedLessons.length / allLessons.length) * 100) : 0;

  if (loading) {
    return <div className="learning-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p className="body-lg">Loading course content...</p>
    </div>;
  }

  if (error || !course) {
    return (
      <div className="learning-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--spacing-md)' }}>
        <h2 className="headline-md">Cannot access this course</h2>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', maxWidth: '420px', textAlign: 'center' }}>
          {error || 'This course is unavailable.'}
        </p>
        <Button variant="primary" onClick={() => navigate('/student')}>Back to Dashboard</Button>
      </div>
    );
  }

  const renderLessonMedia = () => {
    if (!currentLesson) return null;
    if (currentLesson.type === 'VIDEO') {
      const embed = youtubeEmbed(currentLesson.youtubeId || currentLesson.videoUrl || currentLesson.content);
      return (
        <iframe 
          className="youtube-iframe"
          src={embed}
          title={currentLesson.title}
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      );
    }
    if (currentLesson.type === 'QUIZ') {
      return (
        <div className="text-lesson-placeholder">
          <FileText size={64} style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-md)' }} />
          <h2 className="title-lg">Quiz Lesson</h2>
          <p className="body-md">This lesson includes a quiz assessment.</p>
          <Button variant="primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/student/quizzes/history')}>
            Go to Quizzes
          </Button>
        </div>
      );
    }
    if (currentLesson.type === 'ASSIGNMENT') {
      return (
        <div className="text-lesson-placeholder">
          <PenTool size={64} style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-md)' }} />
          <h2 className="title-lg">Assignment</h2>
          <p className="body-md">This lesson includes a practical assignment.</p>
          <Button variant="primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/student/assignments')}>
            Go to Assignments
          </Button>
        </div>
      );
    }
    return (
      <div className="text-lesson-placeholder">
        <FileText size={64} style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-md)' }} />
        <h2 className="title-lg">Reading Material</h2>
        {currentLesson.content ? (
          <p className="body-md" style={{ maxWidth: '640px' }}>{currentLesson.content}</p>
        ) : (
          <p className="body-md">Please refer to the overview below for instructions.</p>
        )}
      </div>
    );
  };

  return (
    <div className="learning-page">
      {/* Top Navigation Bar */}
      <header className="learning-header">
        <div className="learning-header-left">
          <Button variant="ghost" onClick={() => navigate('/student')} style={{ gap: '8px' }}>
            <ChevronLeft size={20} /> Back to Dashboard
          </Button>
          <span className="divider">|</span>
          <h1 className="title-md">{course.title}</h1>
        </div>
        <div className="learning-header-right">
          <div className="progress-container">
            <span className="label-sm">{progressPercentage}% Complete</span>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>
      </header>

      <div className="learning-layout">
        {/* Main Content Area (Video & Info) */}
        <main className="learning-main">
          {/* Video Player */}
          <div className="video-container">
            {renderLessonMedia()}
          </div>

          {/* Lesson Controls */}
          <div className="lesson-controls">
            <div className="lesson-actions-left">
              <h2 className="headline-sm">{currentLesson ? currentLesson.title : 'Select a lesson'}</h2>
            </div>
            <div className="lesson-actions-right">
              <Button
                variant={isBookmarked ? 'primary' : 'secondary'}
                style={{ gap: '8px' }}
                onClick={toggleBookmark}
                disabled={!currentLesson || savingId === currentLesson.id}
              >
                {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              <Button variant="secondary" style={{ gap: '8px' }} onClick={() => navigate(`/student/notes?course=${course.id}&lesson=${currentLesson?.id}`)} disabled={!currentLesson}>
                <PenTool size={16} /> Add Note
              </Button>
            </div>
          </div>

          {/* Lesson Details Tabs */}
          <div className="lesson-details">
            <Tabs 
              tabs={[
                { 
                  id: 'overview', 
                  label: 'Overview', 
                  content: (
                    <div className="body-md" style={{ paddingTop: 'var(--spacing-md)' }}>
                      {currentLesson?.content || 'No description available.'}
                    </div>
                  ) 
                },
                { 
                  id: 'resources', 
                  label: `Resources (${currentLesson?.notesCount || 0})`, 
                  content: (
                    <div className="body-md" style={{ paddingTop: 'var(--spacing-md)' }}>
                      <p>Lesson notes and resources will appear here as they are added.</p>
                    </div>
                  ) 
                }
              ]}
            />
          </div>

          {/* Navigation Footer */}
          <div className="learning-footer">
            <Button variant="secondary" onClick={handlePrev} disabled={!hasPrev} style={{ gap: '8px' }}>
              <ChevronLeft size={16} /> Previous
            </Button>
            
            <Button 
              variant={isCompleted ? "secondary" : "primary"} 
              onClick={toggleComplete} 
              disabled={!currentLesson || savingId === currentLesson.id}
              style={{ gap: '8px' }}
            >
              {isCompleted ? <CheckCircle size={16} color="var(--color-primary)" /> : <Check size={16} />}
              {isCompleted ? 'Completed' : (savingId === currentLesson?.id ? 'Saving...' : 'Mark as Complete')}
            </Button>

            <Button variant="secondary" onClick={handleNext} disabled={!hasNext} style={{ gap: '8px' }}>
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </main>

        {/* Curriculum Sidebar */}
        <aside className="learning-sidebar">
          <div className="sidebar-header">
            <h3 className="title-lg">Course Content</h3>
          </div>
          <div className="sidebar-accordion-wrapper">
            <Accordion>
              {sections.map((module, mIndex) => {
                const hasActiveLesson = module.lessons.some(l => l.id === currentLessonId);
                return (
                  <AccordionItem 
                    key={module.id} 
                    title={module.title}
                    defaultOpen={mIndex === 0 || hasActiveLesson}
                  >
                    <div className="sidebar-lesson-list">
                      {module.lessons.map((lesson) => {
                        const isDone = completedLessons.includes(lesson.id);
                        const isActive = lesson.id === currentLessonId;
                        const isVideo = lesson.type === 'VIDEO';
                        
                        return (
                          <div 
                            key={lesson.id} 
                            className={`sidebar-lesson-item ${isActive ? 'active' : ''}`}
                            onClick={() => setCurrentLessonId(lesson.id)}
                          >
                            <div className="lesson-icon">
                              {isDone ? (
                                <CheckCircle size={16} color="var(--color-primary)" />
                              ) : isVideo ? (
                                <PlayCircle size={16} />
                              ) : (
                                <FileText size={16} />
                              )}
                            </div>
                            <div className="lesson-text">
                              <span className="body-md lesson-title">{lesson.title}</span>
                              <span className="label-sm lesson-duration">{Math.round((lesson.duration || 0) / 60)} min</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </aside>
      </div>
    </div>
  );
};