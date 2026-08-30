import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, PlayCircle, FileText, CheckCircle, Bookmark, PenTool, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import './VideoLearning.css';

// Extended Mock Data for Learning View
const MOCK_COURSE = {
  id: 'c1',
  title: 'Advanced Data Science with Python',
  curriculum: [
    {
      id: 'm1',
      title: 'Module 1: Introduction to Advanced Python',
      lessons: [
        { id: 'l1', title: 'Setting up your environment', duration: '10:00', type: 'video', videoId: 'dQw4w9WgXcQ', description: 'In this lesson, we will configure our local development environment for data science.' },
        { id: 'l2', title: 'Python refresher', duration: '20:00', type: 'video', videoId: 'jNQXAC9IVRw', description: 'A quick refresher on Python basics before we dive into advanced topics.' },
        { id: 'l3', title: 'Reading Material: Best Practices', duration: '15:00', type: 'text', description: 'Please read the attached PDF on Python PEP8 standards.' }
      ]
    },
    {
      id: 'm2',
      title: 'Module 2: Data Manipulation with Pandas',
      lessons: [
        { id: 'l4', title: 'Advanced DataFrames', duration: '30:00', type: 'video', videoId: 'vmEHCJofCGg', description: 'Learn how to handle multi-index DataFrames and complex merges.' },
        { id: 'l5', title: 'Handling missing data', duration: '25:00', type: 'video', videoId: 'tqLKIV5ZzX0', description: 'Strategies for imputing and dropping missing values.' }
      ]
    }
  ]
};

export const VideoLearning = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [currentLessonId, setCurrentLessonId] = useState('l1');
  const [completedLessons, setCompletedLessons] = useState(['l1']); // Mocking that l1 is already done
  
  // Flatten curriculum to easily find next/prev
  const allLessons = useMemo(() => {
    return MOCK_COURSE.curriculum.flatMap(module => module.lessons);
  }, []);

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

  const toggleComplete = () => {
    if (completedLessons.includes(currentLessonId)) {
      setCompletedLessons(prev => prev.filter(id => id !== currentLessonId));
    } else {
      setCompletedLessons(prev => [...prev, currentLessonId]);
      // Auto-advance logic
      if (hasNext) {
        setTimeout(handleNext, 1000);
      }
    }
  };

  const isCompleted = completedLessons.includes(currentLessonId);
  const progressPercentage = Math.round((completedLessons.length / allLessons.length) * 100);

  return (
    <div className="learning-page">
      {/* Top Navigation Bar */}
      <header className="learning-header">
        <div className="learning-header-left">
          <Button variant="ghost" onClick={() => navigate('/student')} style={{ gap: '8px' }}>
            <ChevronLeft size={20} /> Back to Dashboard
          </Button>
          <span className="divider">|</span>
          <h1 className="title-md">{MOCK_COURSE.title}</h1>
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
            {currentLesson.type === 'video' ? (
              <iframe 
                className="youtube-iframe"
                src={`https://www.youtube.com/embed/${currentLesson.videoId}`} 
                title={currentLesson.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <div className="text-lesson-placeholder">
                <FileText size={64} style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-md)' }} />
                <h2 className="title-lg">Reading Material</h2>
                <p className="body-md">Please refer to the overview below for instructions.</p>
              </div>
            )}
          </div>

          {/* Lesson Controls */}
          <div className="lesson-controls">
            <div className="lesson-actions-left">
              <h2 className="headline-sm">{currentLesson.title}</h2>
            </div>
            <div className="lesson-actions-right">
              <Button variant="secondary" style={{ gap: '8px' }}>
                <Bookmark size={16} /> Bookmark
              </Button>
              <Button variant="secondary" style={{ gap: '8px' }}>
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
                      {currentLesson.description}
                    </div>
                  ) 
                },
                { 
                  id: 'resources', 
                  label: 'Resources (2)', 
                  content: (
                    <div className="body-md" style={{ paddingTop: 'var(--spacing-md)' }}>
                      <ul style={{ paddingLeft: 'var(--spacing-xl)' }}>
                        <li>Source_Code.zip</li>
                        <li>Lecture_Slides.pdf</li>
                      </ul>
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
              style={{ gap: '8px' }}
            >
              {isCompleted ? <CheckCircle size={16} color="var(--color-primary)" /> : <Check size={16} />}
              {isCompleted ? 'Completed' : 'Mark as Complete'}
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
              {MOCK_COURSE.curriculum.map((module, mIndex) => {
                // Determine if this module contains the current lesson
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
                        
                        return (
                          <div 
                            key={lesson.id} 
                            className={`sidebar-lesson-item ${isActive ? 'active' : ''}`}
                            onClick={() => setCurrentLessonId(lesson.id)}
                          >
                            <div className="lesson-icon">
                              {isDone ? (
                                <CheckCircle size={16} color="var(--color-primary)" />
                              ) : lesson.type === 'video' ? (
                                <PlayCircle size={16} />
                              ) : (
                                <FileText size={16} />
                              )}
                            </div>
                            <div className="lesson-text">
                              <span className="body-md lesson-title">{lesson.title}</span>
                              <span className="label-sm lesson-duration">{lesson.duration}</span>
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
