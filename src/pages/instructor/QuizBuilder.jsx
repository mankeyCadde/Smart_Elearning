import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Save, ChevronLeft, CircleDot } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { apiFetch, ApiError } from '../../services/api';

const QUESTION_TYPES = [
  { value: 'MC', label: 'Multiple Choice' },
  { value: 'TF', label: 'True / False' },
  { value: 'SA', label: 'Short Answer' },
];

const emptyQuestion = () => ({
  text: '',
  questionType: 'MC',
  points: 1,
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
});

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const QuizBuilder = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/instructor/courses/'),
      apiFetch('/instructor/quizzes/'),
    ])
      .then(([coursesData, quizzesData]) => {
        setCourses((coursesData && (coursesData.results ?? coursesData)) || []);
        setQuizzes((quizzesData && (quizzesData.results ?? quizzesData)) || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const startNew = () => {
    setEditingId(null);
    setError('');
    setForm({
      title: '',
      description: '',
      courseId: courses[0]?.id?.toString() || '',
      timeLimitMinutes: 10,
      passingScore: 70,
      maxAttempts: 2,
      dueDate: '',
      published: false,
      questions: [emptyQuestion()],
    });
  };

  const startEdit = async (quiz) => {
    setError('');
    try {
      const detail = await apiFetch(`/instructor/quizzes/${quiz.id}/`);
      setEditingId(quiz.id);
      setForm({
        title: detail.title || '',
        description: detail.description || '',
        courseId: detail.courseId?.toString() || '',
        timeLimitMinutes: detail.timeLimitMinutes ?? 10,
        passingScore: detail.passingScore ?? 70,
        maxAttempts: detail.maxAttempts ?? 2,
        dueDate: toDateTimeLocal(detail.dueDate),
        published: !!detail.published,
        questions: (detail.questions || []).map(q => ({
          text: q.text || '',
          questionType: q.questionType || 'MC',
          points: q.points ?? 1,
          options: (q.options || []).map(o => ({ text: o.text || '', isCorrect: !!o.isCorrect })),
        })),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load quiz.');
    }
  };

  const cancelEdit = () => {
    setForm(null);
    setEditingId(null);
    setError('');
  };

  const setQuestion = (index, patch) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  };

  const setOption = (qIndex, oIndex, patch) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((o, j) => {
          if (j !== oIndex) return o;
          return { ...o, ...patch };
        });
        if (q.questionType === 'MC') {
          return { ...q, options };
        }
        if (patch.isCorrect === true) {
          return { ...q, options: options.map((o, j) => ({ ...o, isCorrect: j === oIndex })) };
        }
        return { ...q, options };
      }),
    }));
  };

  const addQuestion = () => {
    setForm(prev => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
  };

  const removeQuestion = (index) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const validateQuestions = () => {
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.text.trim()) return `Question ${i + 1} needs text.`;
      if (q.questionType !== 'SA' && (!q.options.length || !q.options.some(o => o.isCorrect))) {
        return `Question ${i + 1} needs at least one correct option.`;
      }
    }
    return '';
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Quiz title is required.'); return; }
    if (!form.courseId) { setError('Select a course for this quiz.'); return; }
    const qError = validateQuestions();
    if (qError) { setError(qError); return; }

    const payload = {
      title: form.title,
      description: form.description,
      courseId: Number(form.courseId),
      timeLimitMinutes: Number(form.timeLimitMinutes) || 0,
      passingScore: Number(form.passingScore) || 0,
      maxAttempts: Number(form.maxAttempts) || 1,
      dueDate: form.dueDate || null,
      published: form.published,
      questions: form.questions.map((q, qi) => ({
        text: q.text,
        questionType: q.questionType,
        points: Number(q.points) || 1,
        order: qi,
        options: q.questionType === 'SA'
          ? []
          : q.options.map((o, oi) => ({ text: o.text, isCorrect: !!o.isCorrect, order: oi })),
      })),
    };

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/instructor/quizzes/${editingId}/`, { method: 'PATCH', body: payload });
      } else {
        await apiFetch('/instructor/quizzes/', { method: 'POST', body: payload });
      }
      setForm(null);
      setEditingId(null);
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quiz) => {
    if (!window.confirm(`Delete quiz "${quiz.title}"?`)) return;
    try {
      await apiFetch(`/instructor/quizzes/${quiz.id}/`, { method: 'DELETE' });
      setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
      if (editingId === quiz.id) cancelEdit();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete quiz.');
    }
  };

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/instructor/dashboard')} style={{ gap: '8px', marginBottom: 'var(--spacing-md)' }}>
        <ChevronLeft size={18} /> Back to Dashboard
      </Button>

      <div className="dashboard-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 className="headline-lg">Quiz Builder</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
            Create and manage quizzes for your courses.
          </p>
        </div>
        {!form && (
          <Button variant="primary" onClick={startNew} style={{ gap: '8px' }}>
            <Plus size={18} /> New Quiz
          </Button>
        )}
      </div>

      {error && (
        <p className="body-sm" style={{ color: '#DC2626', backgroundColor: '#FEE2E2', padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--rounded-sm)', marginBottom: 'var(--spacing-md)' }}>
          {error}
        </p>
      )}

      {form ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
          {/* Quiz settings */}
          <Card style={{ padding: 'var(--spacing-lg)', position: 'sticky', top: '16px' }}>
            <h3 className="title-md" style={{ marginBottom: 'var(--spacing-md)' }}>{editingId ? 'Edit Quiz' : 'New Quiz'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Input id="qt" label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Python Basics Checkup" />
              <div className="input-container">
                <label className="input-label label-md" htmlFor="qc">Course</label>
                <select id="qc" className="input-field body-md" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="input-container">
                <label className="input-label label-md" htmlFor="qd">Description</label>
                <textarea id="qd" className="input-field body-md" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description"></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                <Input id="qtl" label="Time Limit (min)" type="number" min="0" value={form.timeLimitMinutes} onChange={e => setForm({ ...form, timeLimitMinutes: e.target.value })} />
                <Input id="qps" label="Passing Score %" type="number" min="0" max="100" value={form.passingScore} onChange={e => setForm({ ...form, passingScore: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                <Input id="qma" label="Max Attempts" type="number" min="1" value={form.maxAttempts} onChange={e => setForm({ ...form, maxAttempts: e.target.value })} />
                <div className="input-container">
                  <label className="input-label label-md" htmlFor="qdue">Due Date</label>
                  <input id="qdue" type="datetime-local" className="input-field body-md" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} className="body-md">
                <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
                Published (visible to students)
              </label>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                <Button variant="secondary" style={{ flex: 1 }} onClick={cancelEdit}>Cancel</Button>
                <Button variant="primary" style={{ flex: 1, gap: '6px' }} onClick={handleSave} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Quiz'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <h3 className="title-md">Questions ({form.questions.length})</h3>
            {form.questions.map((q, qi) => (
              <Card key={qi} style={{ padding: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                  <span className="label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Question {qi + 1}</span>
                  <Button variant="ghost" onClick={() => removeQuestion(qi)} style={{ color: '#DC2626', gap: '4px' }}>
                    <Trash2 size={14} /> Remove
                  </Button>
                </div>
                <Input id={`qtext-${qi}`} label="Question Text" value={q.text} onChange={e => setQuestion(qi, { text: e.target.value })} placeholder="Type your question" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 'var(--spacing-sm)', margin: 'var(--spacing-md) 0' }}>
                  <div className="input-container">
                    <label className="input-label label-md" htmlFor={`qtype-${qi}`}>Type</label>
                    <select id={`qtype-${qi}`} className="input-field body-md" value={q.questionType} onChange={e => setQuestion(qi, { questionType: e.target.value, options: e.target.value === 'TF' ? [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: false }] : q.options.length ? q.options : [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] })}>
                      {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <Input id={`qpts-${qi}`} label="Points" type="number" min="1" value={q.points} onChange={e => setQuestion(qi, { points: e.target.value })} />
                </div>

                {q.questionType === 'SA' ? (
                  <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Short answer questions are graded manually by you after submission.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span className="label-md">Options (mark the correct one)</span>
                    {q.options.map((o, oi) => (
                      <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setOption(qi, oi, { isCorrect: true })}
                          title="Mark as correct"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: o.isCorrect ? 'var(--color-primary)' : 'var(--color-outline)', padding: 0, display: 'flex' }}
                        >
                          <CircleDot size={20} />
                        </button>
                        <input
                          className="input-field body-md"
                          value={o.text}
                          placeholder={q.questionType === 'TF' ? (oi === 0 ? 'True' : 'False') : `Option ${oi + 1}`}
                          onChange={e => setOption(qi, oi, { text: e.target.value })}
                          style={{ flex: 1 }}
                        />
                        {q.questionType === 'MC' && oi >= 2 && (
                          <Button variant="ghost" onClick={() => setQuestion(qi, { options: q.options.filter((_, j) => j !== oi) })} style={{ color: '#DC2626', padding: '4px' }}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                    {q.questionType === 'MC' && (
                      <Button variant="ghost" style={{ alignSelf: 'flex-start', gap: '4px', marginTop: '4px' }} onClick={() => setQuestion(qi, { options: [...q.options, { text: '', isCorrect: false }] })}>
                        <Plus size={14} /> Add Option
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
            <Button variant="secondary" onClick={addQuestion} style={{ gap: '8px', alignSelf: 'flex-start' }}>
              <Plus size={16} /> Add Question
            </Button>
          </div>
        </div>
      ) : loading ? (
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <Card style={{ padding: 'var(--spacing-xxl)', textAlign: 'center' }}>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>No quizzes yet. Create your first quiz to get started.</p>
          <Button variant="primary" onClick={startNew} style={{ marginTop: 'var(--spacing-lg)', gap: '8px' }}>
            <Plus size={16} /> New Quiz
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {quizzes.map(quiz => (
            <Card key={quiz.id} style={{ padding: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 className="title-md">{quiz.title}</h3>
                  {quiz.published ? (
                    <span className="label-sm" style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-container)', padding: '2px 8px', borderRadius: 'var(--rounded-sm)' }}>Live</span>
                  ) : (
                    <span className="label-sm" style={{ color: 'var(--color-outline)', backgroundColor: 'var(--color-surface-container-high)', padding: '2px 8px', borderRadius: 'var(--rounded-sm)' }}>Draft</span>
                  )}
                </div>
                <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {quiz.courseTitle} · {quiz.questionsCount} questions · {quiz.submissionsCount} submissions · Best of: attempts after publish
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <Button variant="secondary" onClick={() => startEdit(quiz)} style={{ gap: '6px' }}>
                  <Pencil size={16} /> Edit
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(quiz)} style={{ color: '#DC2626', gap: '6px' }}>
                  <Trash2 size={16} /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};