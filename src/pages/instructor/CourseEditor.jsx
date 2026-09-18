import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Save, Video, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { apiFetch, ApiError } from '../../services/api';
import './CourseEditor.css';

const LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const LESSON_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
];

const EMPTY_FORM = { title: '', description: '', image: '', price: '0', category: '', level: 'BEGINNER', published: false };

export const CourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [activeTab, setActiveTab] = useState('basic');
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [courseId, setCourseId] = useState(id ? Number(id) : null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  useEffect(() => {
    apiFetch('/instructor/categories/')
      .then(data => {
        const list = (data && (data.results ?? data)) || [];
        setCategories(list);
        setForm(prev => ({ ...prev, category: prev.category || list[0]?.id?.toString() || '' }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    apiFetch(`/instructor/courses/${id}/`)
      .then(data => {
        if (cancelled) return;
        setForm({
          title: data.title || '',
          description: data.description || '',
          image: data.image || '',
          price: data.price != null ? String(data.price) : '0',
          category: data.category?.toString() || '',
          level: data.level || 'BEGINNER',
          published: !!data.published,
        });
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCurriculum = (cid) => {
    setCurriculumLoading(true);
    apiFetch(`/courses/${cid}/curriculum/`)
      .then(data => setSections(data || []))
      .catch(() => setSections([]))
      .finally(() => setCurriculumLoading(false));
  };

  const handleSaveCourse = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      price: Number(form.price) || 0,
      category: form.category ? Number(form.category) : null,
      level: form.level,
      published: form.published,
    };
    try {
      if (courseId) {
        await apiFetch(`/instructor/courses/${courseId}/`, { method: 'PATCH', body: payload });
      } else {
        const created = await apiFetch('/instructor/courses/', { method: 'POST', body: payload });
        setCourseId(created.id);
        setForm(prev => ({ ...prev, category: String(created.category || form.category) }));
      }
      setMessage('Course saved successfully.');
      setActiveTab('curriculum');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!courseId) { setError('Save the course details first.'); return; }
    try {
      await apiFetch(`/courses/${courseId}/sections/`, { method: 'POST', body: { title: 'New Section' } });
      setError('');
      loadCurriculum(courseId);
    } catch (err) {
      setError(err.message || 'Failed to add section.');
    }
  };

  const updateSectionTitle = async (section) => {
    try {
      await apiFetch(`/courses/${courseId}/sections/${section.id}/`, { method: 'PATCH', body: { title: section.title } });
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update section.');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Delete this entire section and its lessons?')) return;
    try {
      await apiFetch(`/courses/${courseId}/sections/${sectionId}/`, { method: 'DELETE' });
      setSections(prev => prev.filter(s => s.id !== sectionId));
    } catch (err) {
      setError(err.message || 'Failed to delete section.');
    }
  };

  const handleAddLesson = async (sectionId) => {
    try {
      await apiFetch(`/courses/${courseId}/sections/${sectionId}/lessons/`, {
        method: 'POST',
        body: { title: 'New Lesson', type: 'TEXT', duration: 0, content: '' },
      });
      setError('');
      loadCurriculum(courseId);
    } catch (err) {
      setError(err.message || 'Failed to add lesson.');
    }
  };

  const updateLesson = async (sectionId, lesson, patch) => {
    try {
      await apiFetch(`/courses/${courseId}/sections/${sectionId}/lessons/${lesson.id}/`, {
        method: 'PATCH',
        body: patch,
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update lesson.');
    }
  };

  const handleDeleteLesson = async (sectionId, lesson) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await apiFetch(`/courses/${courseId}/sections/${sectionId}/lessons/${lesson.id}/`, { method: 'DELETE' });
      setSections(prev => prev.map(s => ({ ...s, lessons: s.lessons.filter(l => l.id !== lesson.id) })));
    } catch (err) {
      setError(err.message || 'Failed to delete lesson.');
    }
  };

  const handleOpenCurriculum = () => {
    setActiveTab('curriculum');
    if (courseId) loadCurriculum(courseId);
  };

  if (loading) return <p className="p-xl body-md">Loading course...</p>;

  return (
    <div className="course-editor-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <Button variant="ghost" onClick={() => navigate('/instructor/dashboard')}>
          <ChevronLeft size={18} /> Back to Dashboard
        </Button>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          {message && <span className="body-sm" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} /> {message}</span>}
          <Button variant="primary" onClick={handleSaveCourse} style={{ gap: '8px' }} disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : (courseId ? 'Save Course' : 'Create Course')}
          </Button>
        </div>
      </div>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">{isNew && !courseId ? 'Create New Course' : `Editing: ${form.title || 'Untitled Course'}`}</h1>
      </div>

      {error && (
        <p className="body-md" style={{ color: '#B91C1C', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={16} /> {error}
        </p>
      )}

      <Tabs
        tabs={[
          { id: 'basic', label: 'Basic Information' },
          { id: 'curriculum', label: 'Curriculum Builder' }
        ]}
        activeTab={activeTab}
        onChange={(tab) => tab === 'curriculum' ? handleOpenCurriculum() : setActiveTab(tab)}
      />

      <div className="editor-content" style={{ marginTop: 'var(--spacing-xl)' }}>
        {activeTab === 'basic' && (
          <Card className="p-xl" style={{ maxWidth: '800px' }}>
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Course Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Input
                label="Course Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Course Description</label>
                <textarea
                  className="input-field"
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                ></textarea>
              </div>
              <Input
                label="Thumbnail Image URL"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
              {form.image && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <p className="label-sm" style={{ marginBottom: '4px' }}>Thumbnail Preview:</p>
                  <img src={form.image} alt="Thumbnail preview" style={{ width: '200px', height: 'auto', borderRadius: 'var(--rounded-md)' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 160px' }}>
                  <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Price ($)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div style={{ flex: '1 1 160px' }}>
                  <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Level</label>
                  <select
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)' }}
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  >
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Category</label>
                  <select
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)' }}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                <span className="body-md">Publish (visible in course catalog)</span>
              </label>
            </div>
          </Card>
        )}

        {activeTab === 'curriculum' && (
          <div className="curriculum-builder">
            {!courseId ? (
              <Card className="empty-state text-center p-xl">
                <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Save the course details first to start building your curriculum.
                </p>
              </Card>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                  <h2 className="title-lg">Sections & Lessons</h2>
                  <Button variant="secondary" onClick={handleAddSection} style={{ gap: '8px' }}>
                    <Plus size={18} /> Add Section
                  </Button>
                </div>

                {curriculumLoading ? (
                  <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading curriculum...</p>
                ) : sections.length === 0 ? (
                  <Card className="empty-state text-center p-xl">
                    <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>Start by adding your first section.</p>
                  </Card>
                ) : (
                  <div className="sections-list">
                    {sections.map((section, sIndex) => (
                      <Card key={section.id} className="section-card">
                        <div className="section-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1 }}>
                            <span className="label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Section {sIndex + 1}:</span>
                            <input
                              type="text"
                              className="section-title-input title-md"
                              value={section.title}
                              onChange={(e) =>
                                setSections(prev => prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))
                              }
                              onBlur={() => updateSectionTitle(section)}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <Button variant="ghost" onClick={() => handleAddLesson(section.id)}>
                              <Plus size={16} /> Add Lesson
                            </Button>
                            <button className="icon-btn danger" onClick={() => handleDeleteSection(section.id)}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="lessons-list">
                          {section.lessons.map((lesson, lIndex) => (
                            <div key={lesson.id} className="lesson-item">
                              <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)', width: '24px' }}>{lIndex + 1}.</span>
                              <div className="lesson-form-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flex: 1 }}>
                                <input
                                  type="text"
                                  className="lesson-input body-md"
                                  placeholder="Lesson Title"
                                  value={lesson.title}
                                  style={{ flex: '1 1 180px' }}
                                  onChange={(e) =>
                                    setSections(prev => prev.map(s => s.id === section.id
                                      ? { ...s, lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, title: e.target.value } : l) }
                                      : s))
                                  }
                                  onBlur={() => updateLesson(section.id, lesson, { title: lesson.title })}
                                />
                                <select
                                  className="lesson-input body-sm"
                                  value={lesson.type}
                                  onChange={(e) => {
                                    setSections(prev => prev.map(s => s.id === section.id
                                      ? { ...s, lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, type: e.target.value } : l) }
                                      : s));
                                    updateLesson(section.id, lesson, { type: e.target.value });
                                  }}
                                  style={{ padding: '6px 8px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-outline)', backgroundColor: 'var(--color-surface)' }}
                                >
                                  {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                {lesson.type === 'VIDEO' ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 220px' }}>
                                    <Video size={14} style={{ color: 'var(--color-primary)' }} />
                                    <input
                                      type="text"
                                      className="lesson-input body-sm"
                                      placeholder="YouTube URL"
                                      value={lesson.videoUrl || lesson.youtubeId || ''}
                                      style={{ flex: 1, padding: '6px 8px' }}
                                      onChange={(e) =>
                                        setSections(prev => prev.map(s => s.id === section.id
                                          ? { ...s, lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, videoUrl: e.target.value } : l) }
                                          : s))
                                      }
                                      onBlur={() => updateLesson(section.id, lesson, { videoUrl: lesson.videoUrl || lesson.youtubeId || '' })}
                                    />
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    className="lesson-input body-sm"
                                    placeholder="Content / instructions"
                                    value={lesson.content || ''}
                                    style={{ flex: '1 1 200px', padding: '6px 8px' }}
                                    onChange={(e) =>
                                      setSections(prev => prev.map(s => s.id === section.id
                                        ? { ...s, lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, content: e.target.value } : l) }
                                        : s))
                                    }
                                    onBlur={() => updateLesson(section.id, lesson, { content: lesson.content })}
                                  />
                                )}
                                <input
                                  type="number"
                                  className="lesson-input body-sm"
                                  placeholder="min"
                                  value={lesson.duration || 0}
                                  style={{ width: '72px', padding: '6px 8px', textAlign: 'center' }}
                                  onChange={(e) =>
                                    setSections(prev => prev.map(s => s.id === section.id
                                      ? { ...s, lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, duration: Number(e.target.value) } : l) }
                                      : s))
                                  }
                                  onBlur={() => updateLesson(section.id, lesson, { duration: Number(lesson.duration) || 0 })}
                                />
                                <button className="icon-btn danger" onClick={() => handleDeleteLesson(section.id, lesson)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {section.lessons.length === 0 && (
                            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', fontStyle: 'italic', paddingLeft: 'var(--spacing-xl)' }}>
                              No lessons in this section yet.
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};