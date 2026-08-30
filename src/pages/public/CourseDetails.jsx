import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, PlayCircle, FileText, CheckCircle, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import { Modal } from '../../components/ui/Modal';
import './CourseDetails.css';

// Comprehensive Mock Data
const MOCK_COURSE = {
  id: 'c1',
  title: 'Advanced Data Science with Python',
  subtitle: 'Master machine learning, data visualization, and statistical analysis using Python.',
  category: 'Data Science',
  level: 'Advanced',
  rating: 4.8,
  reviews: 1240,
  students: 15400,
  language: 'English',
  lastUpdated: '10/2023',
  price: 89.99,
  instructor: {
    name: 'Dr. Sarah Chen',
    title: 'Lead Data Scientist at TechCorp',
    bio: 'Dr. Chen has over 10 years of experience in data science and machine learning. She holds a PhD in Computer Science from MIT.',
    avatar: 'SC'
  },
  stats: {
    duration: '12 hours on-demand video',
    articles: '15 articles',
    resources: '45 downloadable resources',
    certificate: 'Certificate of completion'
  },
  curriculum: [
    {
      id: 'm1',
      title: 'Module 1: Introduction to Advanced Python',
      duration: '45 mins',
      lessons: [
        { id: 'l1', title: 'Setting up your environment', duration: '10:00', type: 'video', isFree: true },
        { id: 'l2', title: 'Python refresher', duration: '20:00', type: 'video', isFree: true },
        { id: 'l3', title: 'Module 1 Quiz', duration: '15:00', type: 'quiz', isFree: false }
      ]
    },
    {
      id: 'm2',
      title: 'Module 2: Data Manipulation with Pandas',
      duration: '2.5 hours',
      lessons: [
        { id: 'l4', title: 'Advanced DataFrames', duration: '30:00', type: 'video', isFree: false },
        { id: 'l5', title: 'Handling missing data', duration: '25:00', type: 'video', isFree: false },
        { id: 'l6', title: 'Pandas exercise', duration: '45:00', type: 'assignment', isFree: false }
      ]
    },
    {
      id: 'm3',
      title: 'Module 3: Machine Learning Models',
      duration: '4 hours',
      lessons: [
        { id: 'l7', title: 'Regression algorithms', duration: '40:00', type: 'video', isFree: false },
        { id: 'l8', title: 'Classification algorithms', duration: '45:00', type: 'video', isFree: false },
        { id: 'l9', title: 'Building your first model', duration: '1:00:00', type: 'video', isFree: false }
      ]
    }
  ]
};

export const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // In a real app, fetch course by id. Using mock for now.
  const course = MOCK_COURSE;

  // Enrollment State: 'idle' | 'confirm' | 'loading' | 'success' | 'enrolled'
  const [enrollState, setEnrollState] = React.useState('idle');

  const handleEnrollClick = () => {
    if (enrollState === 'enrolled') {
      navigate(`/student/course/${course.id}/video`);
    } else {
      setEnrollState('confirm');
    }
  };

  const confirmEnrollment = () => {
    setEnrollState('loading');
    // Simulate API call
    setTimeout(() => {
      setEnrollState('success');
    }, 1500);
  };

  const closeEnrollmentModal = () => {
    if (enrollState === 'success') {
      setEnrollState('enrolled');
    } else {
      setEnrollState('idle');
    }
  };

  const overviewTab = (
    <div className="tab-pane-content">
      <h2 className="title-lg">Course Description</h2>
      <p className="body-md">
        This course is designed to take your Python skills to the next level. We will dive deep into data science concepts, focusing on practical implementation rather than just theory.
      </p>
      <br/>
      <h3 className="title-md">What you'll learn</h3>
      <ul className="body-md list-styled">
        <li>Build complex machine learning models using Scikit-Learn</li>
        <li>Manipulate and analyze large datasets with Pandas and NumPy</li>
        <li>Create stunning data visualizations using Seaborn and Matplotlib</li>
        <li>Deploy your models to production environments</li>
      </ul>
      <br/>
      <h3 className="title-md">Requirements</h3>
      <ul className="body-md list-styled">
        <li>Basic understanding of Python programming (variables, loops, functions)</li>
        <li>High school level mathematics</li>
        <li>A computer with internet access</li>
      </ul>
    </div>
  );

  const curriculumTab = (
    <div className="tab-pane-content">
      <div className="curriculum-header">
        <h2 className="title-lg">Course Content</h2>
        <span className="body-sm">{course.curriculum.length} sections • {course.stats.duration} total length</span>
      </div>
      
      <Accordion>
        {course.curriculum.map((module, index) => (
          <AccordionItem 
            key={module.id} 
            title={module.title}
            defaultOpen={index === 0}
            rightContent={<span className="body-sm">{module.duration}</span>}
          >
            <div className="lesson-list">
              {module.lessons.map(lesson => (
                <div key={lesson.id} className="lesson-item">
                  <div className="lesson-info">
                    {lesson.type === 'video' ? <PlayCircle size={16} /> : <FileText size={16} />}
                    <span className="body-md lesson-title">{lesson.title}</span>
                  </div>
                  <div className="lesson-meta">
                    {lesson.isFree ? (
                      <span className="badge-preview label-sm">Preview</span>
                    ) : (
                      <Lock size={14} className="icon-locked" />
                    )}
                    <span className="body-sm">{lesson.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );

  const instructorTab = (
    <div className="tab-pane-content instructor-profile">
      <div className="instructor-header">
        <div className="instructor-avatar">
          {course.instructor.avatar}
        </div>
        <div className="instructor-info">
          <h3 className="title-lg">{course.instructor.name}</h3>
          <p className="body-md">{course.instructor.title}</p>
        </div>
      </div>
      <p className="body-md" style={{ marginTop: 'var(--spacing-md)' }}>
        {course.instructor.bio}
      </p>
    </div>
  );

  return (
    <div className="course-details-page">
      {/* Dark Header Hero */}
      <div className="course-hero">
        <div className="container course-hero-container">
          <div className="course-hero-content">
            <div className="breadcrumbs label-sm">
              <Link to="/catalog">Catalog</Link> &gt; {course.category} &gt; {course.title}
            </div>
            
            <h1 className="display-sm">{course.title}</h1>
            <p className="body-lg subtitle">{course.subtitle}</p>
            
            <div className="course-hero-meta">
              <Badge variant="primary">{course.category}</Badge>
              <div className="rating">
                <Star size={16} fill="#F59E0B" color="#F59E0B" />
                <span className="label-md">{course.rating}</span>
                <span className="body-sm">({course.reviews} ratings)</span>
              </div>
              <div className="students">
                <Users size={16} />
                <span className="body-sm">{course.students.toLocaleString()} students</span>
              </div>
            </div>
            
            <div className="course-hero-author body-sm">
              Created by <span className="author-name">{course.instructor.name}</span>
            </div>
            
            <div className="course-hero-updated body-sm">
              <Clock size={14} /> Last updated {course.lastUpdated}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container course-main-layout">
        <div className="course-content-col">
          <Tabs 
            tabs={[
              { id: 'overview', label: 'Overview', content: overviewTab },
              { id: 'curriculum', label: 'Curriculum', content: curriculumTab },
              { id: 'instructor', label: 'Instructor', content: instructorTab }
            ]}
          />
        </div>
        
        {/* Sticky Sidebar / Enrollment Card */}
        <div className="course-sidebar-col">
          <Card className="enrollment-card">
            <div className="enrollment-thumbnail">
              <PlayCircle size={64} className="play-icon" />
            </div>
            
            <div className="enrollment-body">
              <div className="price-tag headline-md">
                {enrollState === 'enrolled' ? 'Purchased' : `$${course.price}`}
              </div>
              
              <Button 
                variant={enrollState === 'enrolled' ? 'secondary' : 'primary'} 
                size="lg" 
                className="enroll-btn" 
                onClick={handleEnrollClick}
              >
                {enrollState === 'enrolled' ? 'Continue Learning' : 'Enroll Now'}
              </Button>
              {enrollState !== 'enrolled' && (
                <p className="body-sm text-center" style={{ margin: 'var(--spacing-sm) 0 var(--spacing-lg)' }}>
                  30-Day Money-Back Guarantee
                </p>
              )}
              
              <h4 className="title-sm" style={{ marginBottom: 'var(--spacing-md)' }}>This course includes:</h4>
              <ul className="course-features body-sm">
                <li><PlayCircle size={16}/> {course.stats.duration}</li>
                <li><FileText size={16}/> {course.stats.articles}</li>
                <li><CheckCircle size={16}/> {course.stats.resources}</li>
                <li><Award size={16}/> {course.stats.certificate}</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Enrollment Flow Modal */}
      <Modal 
        isOpen={['confirm', 'loading', 'success'].includes(enrollState)} 
        onClose={closeEnrollmentModal}
        title={enrollState === 'success' ? 'Enrollment Successful' : 'Confirm Enrollment'}
      >
        {enrollState === 'confirm' && (
          <div className="enroll-confirm-view">
            <p className="body-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
              You are about to enroll in <strong>{course.title}</strong> for <strong>${course.price}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={closeEnrollmentModal}>Cancel</Button>
              <Button variant="primary" onClick={confirmEnrollment}>Confirm Payment</Button>
            </div>
          </div>
        )}

        {enrollState === 'loading' && (
          <div className="enroll-loading-view" style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
            <div className="spinner" style={{ margin: '0 auto var(--spacing-md)', width: '40px', height: '40px', border: '4px solid var(--color-surface-container-high)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p className="body-md">Processing your enrollment...</p>
          </div>
        )}

        {enrollState === 'success' && (
          <div className="enroll-success-view" style={{ textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--color-primary)" style={{ margin: '0 auto var(--spacing-lg)' }} />
            <h3 className="headline-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>Welcome to the course!</h3>
            <p className="body-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
              Your enrollment in {course.title} was successful. You can start learning immediately.
            </p>
            <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate(`/student/course/${course.id}/video`)}>
              Start Learning Now
            </Button>
          </div>
        )}
      </Modal>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// Needed an extra import that wasn't at the top
import { Award } from 'lucide-react';
