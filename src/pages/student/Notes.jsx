import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit2, FileText, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import './Notes.css';

// Initial Mock Data
const INITIAL_NOTES = [
  {
    id: 'n1',
    title: 'Pandas GroupBy Concepts',
    content: 'The groupby method allows you to group data and apply aggregate functions like sum(), mean(), or count(). It is similar to SQL GROUP BY.\n\nMake sure to reset_index() if you want the grouped columns to become regular columns again.',
    courseId: 'c1',
    courseName: 'Advanced Data Science with Python',
    date: '2023-10-25'
  },
  {
    id: 'n2',
    title: 'React useEffect Dependencies',
    content: 'Always include all variables used inside the useEffect callback in the dependency array. Leaving them out can cause stale closures.\n\nIf you need it to run only once on mount, use an empty array [].',
    courseId: 'c2',
    courseName: 'Full-Stack React & Node.js',
    date: '2023-10-23'
  },
  {
    id: 'n3',
    title: 'Color Theory Basics',
    content: 'Primary: Red, Blue, Yellow.\nSecondary: Green, Orange, Purple.\n\nAnalogous colors are next to each other on the color wheel and create harmonious designs.',
    courseId: 'c3',
    courseName: 'UX/UI Design Principles',
    date: '2023-10-15'
  }
];

const MOCK_COURSES = [
  { id: 'c1', name: 'Advanced Data Science with Python' },
  { id: 'c2', name: 'Full-Stack React & Node.js' },
  { id: 'c3', name: 'UX/UI Design Principles' },
  { id: 'general', name: 'General Note (No Course)' }
];

export const Notes = () => {
  // State
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoteId, setActiveNoteId] = useState(null); // null means no note selected (or viewing list on mobile)
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCourseId, setEditCourseId] = useState('general');

  // Derived State
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const lowerQ = searchQuery.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(lowerQ) || 
      n.content.toLowerCase().includes(lowerQ) ||
      n.courseName.toLowerCase().includes(lowerQ)
    );
  }, [notes, searchQuery]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  // Handlers
  const handleCreateNew = () => {
    setActiveNoteId(null);
    setEditTitle('');
    setEditContent('');
    setEditCourseId('general');
    setIsEditing(true);
  };

  const handleEditActive = () => {
    if (!activeNote) return;
    setEditTitle(activeNote.title);
    setEditContent(activeNote.content);
    setEditCourseId(activeNote.courseId || 'general');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editTitle.trim()) {
      alert("Title cannot be empty");
      return;
    }

    const courseName = MOCK_COURSES.find(c => c.id === editCourseId)?.name || '';

    if (activeNoteId && activeNote) {
      // Update existing
      setNotes(prev => prev.map(n => 
        n.id === activeNoteId 
          ? { ...n, title: editTitle, content: editContent, courseId: editCourseId, courseName, date: new Date().toISOString().split('T')[0] } 
          : n
      ));
    } else {
      // Create new
      const newNote = {
        id: `n${Date.now()}`,
        title: editTitle,
        content: editContent,
        courseId: editCourseId,
        courseName,
        date: new Date().toISOString().split('T')[0]
      };
      setNotes(prev => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (!activeNoteId) {
      // If we cancelled creating a new note, make sure we go back to empty state
      setActiveNoteId(null);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (activeNoteId === id) {
        setActiveNoteId(null);
        setIsEditing(false);
      }
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
        {/* Left Pane: List */}
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
            {filteredNotes.length === 0 ? (
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
                  <h3 className="title-md note-title">{note.title}</h3>
                  <p className="body-sm note-snippet">{note.content}</p>
                  <div className="note-meta">
                    <span className="label-sm">{note.courseName === 'General Note (No Course)' ? 'General' : note.courseName}</span>
                    <span className="body-sm">{note.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Detail/Editor */}
        <div className={`notes-main ${!activeNoteId && !isEditing ? 'hidden-mobile' : ''}`}>
          {isEditing ? (
            // EDITOR MODE
            <Card className="note-editor-card">
              <div className="mobile-back-btn">
                <Button variant="ghost" onClick={handleCancel} style={{ marginBottom: 'var(--spacing-md)' }}>
                  <ChevronLeft size={18} /> Back
                </Button>
              </div>
              <input 
                type="text" 
                className="editor-title-input headline-sm" 
                placeholder="Note Title" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              
              <div className="editor-meta">
                <label className="label-sm">Related Course:</label>
                <select 
                  className="editor-select body-md"
                  value={editCourseId}
                  onChange={(e) => setEditCourseId(e.target.value)}
                >
                  {MOCK_COURSES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <textarea 
                className="editor-textarea body-md"
                placeholder="Start typing your notes here..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              ></textarea>
              
              <div className="editor-actions">
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save Note</Button>
              </div>
            </Card>
          ) : activeNote ? (
            // VIEW MODE
            <Card className="note-view-card">
              <div className="mobile-back-btn">
                <Button variant="ghost" onClick={() => setActiveNoteId(null)} style={{ marginBottom: 'var(--spacing-md)' }}>
                  <ChevronLeft size={18} /> Back to List
                </Button>
              </div>
              <div className="view-header">
                <h2 className="headline-md">{activeNote.title}</h2>
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
                <span><FileText size={14} /> {activeNote.courseName}</span>
                <span>Last updated: {activeNote.date}</span>
              </div>
              
              <div className="view-content body-lg">
                {activeNote.content.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </Card>
          ) : (
            // EMPTY STATE (Desktop only)
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
