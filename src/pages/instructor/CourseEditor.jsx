import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, GripVertical, Trash2, Video, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import './CourseEditor.css';

const INITIAL_COURSE = {
  id: 'c1',
  title: 'Advanced Data Science with Python',
  description: 'Master data science using Python, Pandas, and Scikit-Learn.',
  thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=400',
  sections: [
    {
      id: 'sec1',
      title: 'Module 1: Python Refresher',
      lessons: [
        { id: 'l1', title: 'Data Types and Structures', duration: '15:00', videoUrl: 'https://youtube.com/watch?v=mock1' },
        { id: 'l2', title: 'Functions and Classes', duration: '20:00', videoUrl: 'https://youtube.com/watch?v=mock2' }
      ]
    }
  ]
};

export const CourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [activeTab, setActiveTab] = useState('basic');
  
  // Basic Info State
  const [course, setCourse] = useState(isNew ? { title: '', description: '', thumbnail: '', sections: [] } : INITIAL_COURSE);
  
  // Handlers for Curriculum Builder
  const handleAddSection = () => {
    const newSection = {
      id: `sec_${Date.now()}`,
      title: 'New Section',
      lessons: []
    };
    setCourse(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const handleUpdateSectionTitle = (secId, title) => {
    setCourse(prev => ({
      ...prev,
      sections: prev.sections.map(sec => sec.id === secId ? { ...sec, title } : sec)
    }));
  };

  const handleDeleteSection = (secId) => {
    if (window.confirm('Are you sure you want to delete this entire section?')) {
      setCourse(prev => ({
        ...prev,
        sections: prev.sections.filter(sec => sec.id !== secId)
      }));
    }
  };

  const handleAddLesson = (secId) => {
    const newLesson = {
      id: `l_${Date.now()}`,
      title: 'New Lesson',
      duration: '00:00',
      videoUrl: ''
    };
    setCourse(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id === secId) {
          return { ...sec, lessons: [...sec.lessons, newLesson] };
        }
        return sec;
      })
    }));
  };

  const handleUpdateLesson = (secId, lessonId, field, value) => {
    setCourse(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id === secId) {
          return {
            ...sec,
            lessons: sec.lessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l)
          };
        }
        return sec;
      })
    }));
  };

  const handleDeleteLesson = (secId, lessonId) => {
    setCourse(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id === secId) {
          return { ...sec, lessons: sec.lessons.filter(l => l.id !== lessonId) };
        }
        return sec;
      })
    }));
  };

  const handleSave = () => {
    alert("Course saved successfully!");
    navigate('/instructor/dashboard');
  };

  return (
    <div className="course-editor-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <Button variant="ghost" onClick={() => navigate('/instructor/dashboard')}>
          <ChevronLeft size={18} /> Back to Dashboard
        </Button>
        <Button variant="primary" onClick={handleSave} style={{ gap: '8px' }}>
          <Save size={18} /> Save Course
        </Button>
      </div>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">{isNew ? 'Create New Course' : `Editing: ${course.title}`}</h1>
      </div>

      <Tabs 
        tabs={[
          { id: 'basic', label: 'Basic Information' },
          { id: 'curriculum', label: 'Curriculum Builder' }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <div className="editor-content" style={{ marginTop: 'var(--spacing-xl)' }}>
        
        {/* TAB: Basic Info */}
        {activeTab === 'basic' && (
          <Card className="p-xl" style={{ maxWidth: '800px' }}>
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Course Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Input 
                label="Course Title" 
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
              />
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Course Description</label>
                <textarea 
                  className="input-field" 
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                  value={course.description}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                ></textarea>
              </div>
              <Input 
                label="Thumbnail Image URL" 
                value={course.thumbnail}
                onChange={(e) => setCourse({ ...course, thumbnail: e.target.value })}
                placeholder="https://..."
              />
              {course.thumbnail && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <p className="label-sm" style={{ marginBottom: '4px' }}>Thumbnail Preview:</p>
                  <img src={course.thumbnail} alt="Thumbnail preview" style={{ width: '200px', height: 'auto', borderRadius: 'var(--rounded-md)' }} />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* TAB: Curriculum Builder */}
        {activeTab === 'curriculum' && (
          <div className="curriculum-builder">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <h2 className="title-lg">Sections & Lessons</h2>
              <Button variant="secondary" onClick={handleAddSection} style={{ gap: '8px' }}>
                <Plus size={18} /> Add Section
              </Button>
            </div>

            {course.sections.length === 0 ? (
              <Card className="empty-state text-center p-xl">
                <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>Start by adding your first section.</p>
              </Card>
            ) : (
              <div className="sections-list">
                {course.sections.map((section, sIndex) => (
                  <Card key={section.id} className="section-card">
                    {/* Section Header */}
                    <div className="section-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1 }}>
                        <GripVertical size={20} style={{ color: 'var(--color-outline)', cursor: 'grab' }} />
                        <span className="label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Section {sIndex + 1}:</span>
                        <input 
                          type="text" 
                          className="section-title-input title-md"
                          value={section.title}
                          onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
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

                    {/* Lessons List */}
                    <div className="lessons-list">
                      {section.lessons.map((lesson, lIndex) => (
                        <div key={lesson.id} className="lesson-item">
                          <GripVertical size={16} style={{ color: 'var(--color-outline)', cursor: 'grab', marginRight: '8px' }} />
                          <div className="lesson-form-grid">
                            <div className="lesson-title-field">
                              <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)', width: '30px' }}>{lIndex + 1}.</span>
                              <input 
                                type="text"
                                className="lesson-input body-md"
                                placeholder="Lesson Title"
                                value={lesson.title}
                                onChange={(e) => handleUpdateLesson(section.id, lesson.id, 'title', e.target.value)}
                              />
                            </div>
                            <div className="lesson-video-field">
                              <Video size={16} style={{ color: 'var(--color-primary)' }} />
                              <input 
                                type="text"
                                className="lesson-input body-sm"
                                placeholder="YouTube Video URL"
                                value={lesson.videoUrl}
                                onChange={(e) => handleUpdateLesson(section.id, lesson.id, 'videoUrl', e.target.value)}
                              />
                            </div>
                            <div className="lesson-duration-field">
                              <input 
                                type="text"
                                className="lesson-input body-sm"
                                placeholder="00:00"
                                value={lesson.duration}
                                onChange={(e) => handleUpdateLesson(section.id, lesson.id, 'duration', e.target.value)}
                                style={{ width: '60px', textAlign: 'center' }}
                              />
                            </div>
                            <button className="icon-btn danger" onClick={() => handleDeleteLesson(section.id, lesson.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {section.lessons.length === 0 && (
                        <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', fontStyle: 'italic', paddingLeft: 'var(--spacing-xxl)' }}>
                          No lessons in this section yet.
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
