import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Trash2, Edit2, FileText, ChevronLeft, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../services/api';
import './Notes.css';

const toDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const Notes = () => {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [editCourseId, setEditCourseId] = useState('');
  const [editLessonId, setEditLessonId] = useState('');
  const [editContent, setEditContent] = useState('');
  const [courseLessons, setCourseLessons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadNotes = () => {
    apiFetch('/notes/')
      .then(data => setNotes(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    let cancelled = false;
    apiFetch('/enrollments/mine/')
      .then(data => {
        if (!cancelled) setCourses(data || []);
      })
      .catch(() => {});
    apiFetch('/notes/')
      .then(data => {
        if (!cancelled) setNotes(data || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!editCourseId) { setCourseLessons([]); setEditLessonId(''); return; }
    let cancelled = false;
    apiFetch(`/courses/${editCourseId}/content/`)
      .then(data => {
        if (cancelled) return;
        const allLessons = [];
        (data.sections || []).forEach(s =>
          (s.lessons || []).forEach(l => allLessons.push({ id: l.id, title: l.title, sectionTitle: s.title }))
        );
        setCourseLessons(allLessons);
        if (editLessonId && !allLessons.find(l => l.id === Number(editLessonId))) setEditLessonId('');
      })
      .catch(() => setCourseLessons([]));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCourseId]);

  // Deep link from video page: open the editor pre-selected on that lesson
  const deepLesson = searchParams.get('lesson');
  const deepCourse = searchParams.get('course');
  useEffect(() => {
    if (!deepLesson) return;
    let cancelled = false;
    const init = async () => {
      await apiFetch('/enrollments/mine/')
        .then(data => { if (!cancelled) setCourses(data || []); })
        .catch(() => {});
      let courseId = deepCourse;
      if (!courseId) {
        const found = await apiFetch('/notes/')
          .then(list => (list || []).find(n => String(n.lessonId) === deepLesson))
          .catch(() => null);
        courseId = found?.courseId;
      }
      if (!cancelled && courseId) {
        setEditCourseId(String(courseId));
        setEditLessonId(deepLesson);
        setEditContent('');
        setSaveError('');
        setIsEditing(true);
      }
    };
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLesson, deepCourse]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const lowerQ = searchQuery.toLowerCase();
    return notes.filter(n =>
      (n.lessonTitle || '').toLowerCase().includes(lowerQ) ||
      (n.content || '').toLowerCase().includes(lowerQ) ||
      (n.courseTitle || '').toLowerCase().includes(lowerQ)
    );
  }, [notes, searchQuery]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleCreateNew = () => {
    setActiveNoteId(null);
    setEditCourseId('');
    setEditLessonId('');
    setEditContent('');
    setCourseLessons([]);
    setSaveError('');
    setIsEditing(true);
  };

  const handleEditActive = () => {
    if (!activeNote) return;
    setEditCourseId(String(activeNote.courseId || ''));
    setEditLessonId(String(activeNote.lessonId || ''));
    setEditContent(activeNote.content || '');
    setSaveError('');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editContent.trim()) { setSaveError('Note content cannot be empty.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      if (activeNote) {
        await apiFetch(`/notes/${activeNote.id}/`, {
          method: 'PATCH',
          body: { content: editContent.trim() },
        });
      } else {
        if (!editLessonId) { setSaveError('Choose a lesson to attach this note to.'); setSaving(false); return; }
        await apiFetch('/notes/', {
          method: 'POST',
          body: { lessonId: Number(editLessonId), content: editContent.trim() },
        });
      }
      await loadNotes();
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (!activeNoteId) setActiveNoteId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await apiFetch(`/notes/${id}/`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== id));
      if (activeNoteId === id) { setActiveNoteId(null); setIsEditing(false); }
    } catch (err) {
      window.alert(err.message || 'Failed to delete note.');
    }
  };

  const selectNote = (id) => {
    setActiveNoteId(id);
    setIsEditing(false);
  };

  return (
    <div className="notes-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 className="headline-lg">My Notes</h1>
      </div>

      <div className="notes-layout">
        <div className={`notes-sidebar ${activeNoteId || isEditing ? 'hidden-mobile' : ''}`}>
          <div className="notes-sidebar-header">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="notes-search-input body-md"
              />
            </div>
            <Button variant="primary" onClick={handleCreateNew} style={{ width: '100%' }}>
              <Plus size={18} /> New Note
            </Button>
          </div>

          <div className="notes-list">
            {loading ? (
              <p className="body-md text-center" style={{ color: 'var(--color-on-surface-variant)', padding: 'var(--spacing-lg)' }}>Loading...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="body-md text-center" style={{ color: 'var(--color-on-surface-variant)', padding: 'var(--spacing-lg)' }}>
                No notes found.
              </p>
            ) : (
              filteredNotes.map(note => (
                <div
                  key={note.id}
                  className={`note-card ${activeNoteId === note.id && !isEditing ? 'active' : ''}`}
                  onClick={() => selectNote(note.id)}
                >
                  <h3 className="title-md note-title">{note.lessonTitle || 'General Note'}</h3>
                  <p className="body-sm note-snippet">{note.content}</p>
                  <div className="note-meta">
                    <span className="label-sm">{note.courseTitle || 'General'}</span>
                    <span className="body-sm">{toDate(note.updatedAt || note.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`notes-main ${!activeNoteId && !isEditing ? 'hidden-mobile' : ''}`}>
          {isEditing ? (
            <Card className="note-editor-card">
              <div className="mobile-back-btn">
                <Button variant="ghost" onClick={handleCancel} style={{ marginBottom: 'var(--spacing-md)' }}>
                  <ChevronLeft size={18} /> Back
                </Button>
              </div>
              <input
                type="text"
                className="editor-title-input headline-sm"
                placeholder="Lesson title (read-only)"
                value={activeNote ? (activeNote.lessonTitle || '') : (courseLessons.find(l => l.id === Number(editLessonId))?.title || 'Attach a lesson note')}
                disabled
              />

              <div className="editor-meta">
                {!activeNote && (
                  <>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Related Course</label>
                      <select
                        className="editor-select body-md"
                        value={editCourseId}
                        onChange={(e) => { setEditCourseId(e.target.value); setEditLessonId(''); }}
                      >
                        <option value="">Select a course...</option>
                        {courses.map(c => (
                          <option key={c.courseId} value={c.courseId}>{c.courseTitle}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>
                        <BookOpen size={14} style={{ verticalAlign: '-2px' }} /> Lesson
                      </label>
                      <select
                        className="editor-select body-md"
                        value={editLessonId}
                        onChange={(e) => setEditLessonId(e.target.value)}
                        disabled={!editCourseId}
                      >
                        <option value="">Select a lesson...</option>
                        {courseLessons.map(l => (
                          <option key={l.id} value={l.id}>{l.title} · {l.sectionTitle}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                {activeNote && (
                  <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {activeNote.courseTitle} · {activeNote.lessonTitle}
                  </p>
                )}
              </div>

              <textarea
                className="editor-textarea body-md"
                placeholder="Start typing your notes here..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              ></textarea>

              {saveError && <p className="body-sm" style={{ color: '#B91C1C', marginTop: 'var(--spacing-sm)' }}>{saveError}</p>}

              <div className="editor-actions">
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Note'}</Button>
              </div>
            </Card>
          ) : activeNote ? (
            <Card className="note-view-card">
              <div className="mobile-back-btn">
                <Button variant="ghost" onClick={() => setActiveNoteId(null)} style={{ marginBottom: 'var(--spacing-md)' }}>
                  <ChevronLeft size={18} /> Back to List
                </Button>
              </div>
              <div className="view-header">
                <h2 className="headline-md">{activeNote.lessonTitle || 'Note'}</h2>
                <div className="view-actions">
                  <button className="icon-btn" onClick={handleEditActive} title="Edit Note">
                    <Edit2 size={18} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(activeNote.id)} title="Delete Note">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="view-meta body-sm">
                <span><FileText size={14} /> {activeNote.courseTitle || 'General'}</span>
                <span>Last updated: {toDate(activeNote.updatedAt || activeNote.createdAt)}</span>
              </div>

              <div className="view-content body-lg">
                {(activeNote.content || '').split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </Card>
          ) : (
            <div className="note-empty-state">
              <FileText size={64} style={{ color: 'var(--color-outline)' }} />
              <h3 className="title-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-md)' }}>
                Select a note to view or create a new one
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};