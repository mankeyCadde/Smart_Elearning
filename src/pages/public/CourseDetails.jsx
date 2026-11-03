import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, PlayCircle, FileText, CheckCircle, Award } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, ApiError } from '../../services/api';
import './CourseDetails.css';

const LESSON_ICON = { VIDEO: PlayCircle, READ: FileText, QUIZ: FileText, ASSIGNMENT: FileText, TEXT: FileText };

const formatUpdated = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Enrollment State: 'idle' | 'loading' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
  const [enrollState, setEnrollState] = useState('idle');
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await apiFetch(`/courses/${id}/`);
        if (cancelled) return;
        setCourse(c);
        const r = await apiFetch(`/courses/${id}/reviews/`);
        if (!cancelled) setReviews(r || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== 'STUDENT' || !course) return;
    let cancelled = false;
    apiFetch('/enrollments/mine/')
      .then(list => {
        if (cancelled) return;
        const e = (list || []).find(x => x.courseId === Number(id));
        if (e) {
          setEnrollState(e.status);
          if (e.status === 'ACCEPTED') setIsEnrolled(true);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, course, id]);

  const handleEnrollClick = () => {
    if (enrollState === 'ACCEPTED' || isEnrolled) {
      navigate(`/student/course/${course.id}/video`);
      return;
    }
    if (enrollState === 'PENDING' || enrollState === 'REJECTED') {
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'STUDENT') return;
    if (Number(course.price) > 0) {
      navigate(`/student/checkout/${course.id}`);
      return;
    }
    requestEnrollment();
  };

  const requestEnrollment = async () => {
    setEnrollState('loading');
    try {
      const result = await apiFetch('/enrollments/', { method: 'POST', body: { courseId: Number(course.id) } });
      setEnrollState(result.status || 'PENDING');
      alert('Your enrollment request has been sent for approval.');
    } catch (err) {
      setEnrollState('idle');
      alert(err instanceof ApiError ? err.message : 'Enrollment request failed. Please try again.');
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center' }}><div className="spinner" style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid var(--color-surface-container-high)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'cspin 1s linear infinite' }}></div><style>{`@keyframes cspin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style></div>;
  }

  if (error || !course) {
    return (
      <div className="container" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center' }}>
        <h2 className="headline-md">Course not found</h2>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{error || 'This course may be unavailable.'}</p>
        <Link to="/catalog"><Button variant="primary" style={{ marginTop: 'var(--spacing-md)' }}>Back to Catalog</Button></Link>
      </div>
    );
  }

  const lessonCount = course.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  const isOwner = user && user.id === course.instructor;

  const overviewTab = (
    <div className="tab-pane-content">
      <h2 className="title-lg">Course Description</h2>
      <p className="body-md">{course.description || 'No description provided yet.'}</p>
      <br/>
      <h3 className="title-md">Course Details</h3>
      <ul className="body-md list-styled">
        <li><strong>Level:</strong> {course.level}</li>
        <li><strong>Sections:</strong> {course.sections.length}</li>
        <li><strong>Lessons:</strong> {lessonCount}</li>
        <li><strong>Instructor:</strong> {course.instructorName}</li>
      </ul>
    </div>
  );

  const curriculumTab = (
    <div className="tab-pane-content">
      <div className="curriculum-header">
        <h2 className="title-lg">Course Content</h2>
        <span className="body-sm">{course.sections.length} sections • {lessonCount} lessons</span>
      </div>
      
      <Accordion>
        {course.sections.map((module, index) => (
          <AccordionItem 
            key={module.id} 
            title={module.title}
            defaultOpen={index === 0}
            rightContent={<span className="body-sm">{module.lessons.length} lessons</span>}
          >
            <div className="lesson-list">
              {module.lessons.map(lesson => {
                const Icon = LESSON_ICON[lesson.type] || FileText;
                return (
                  <div key={lesson.id} className="lesson-item">
                    <div className="lesson-info">
                      <Icon size={16} />
                      <span className="body-md lesson-title">{lesson.title}</span>
                    </div>
                    <div className="lesson-meta">
                      <span className="badge-preview label-sm">{lesson.type}</span>
                      <span className="body-sm">{Math.round((lesson.duration || 0) / 60)} min</span>
                    </div>
                  </div>
                );
              })}
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
          {course.instructorName?.charAt(0) || 'I'}
        </div>
        <div className="instructor-info">
          <h3 className="title-lg">{course.instructorName}</h3>
          <p className="body-md">Course Instructor</p>
        </div>
      </div>
    </div>
  );

  const reviewsTab = (
    <div className="tab-pane-content">
      <div className="curriculum-header">
        <h2 className="title-lg">Student Reviews</h2>
        <span className="body-sm">{course.reviews} reviews</span>
      </div>
      <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
        {reviews.length === 0 ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>No reviews yet — be the first!</p>
        ) : reviews.map(review => (
          <Card key={review.id} style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="rating">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <span className="label-md">{review.rating}.0</span>
                </div>
                <span className="title-sm">{review.studentName}</span>
              </div>
              <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{formatDate(review.createdAt)}</span>
            </div>
            {review.title && <h4 className="title-md">{review.title}</h4>}
            {review.comment && <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{review.comment}</p>}
            {review.instructorReply && (
              <div style={{ marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--rounded-sm)' }}>
                <p className="label-sm" style={{ color: 'var(--color-primary)' }}>Instructor Response</p>
                <p className="body-sm">{review.instructorReply}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
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
            <p className="body-lg subtitle">{course.description}</p>
            
            <div className="course-hero-meta">
              <Badge variant="primary">{course.category}</Badge>
              <div className="rating">
                <Star size={16} fill="#F59E0B" color="#F59E0B" />
                <span className="label-md">{course.rating}</span>
                <span className="body-sm">({course.reviews} ratings)</span>
              </div>
              <div className="students">
                <Users size={16} />
                <span className="body-sm">{course.enrolledStudents} students</span>
              </div>
            </div>
            
            <div className="course-hero-author body-sm">
              Created by <span className="author-name">{course.instructorName}</span>
            </div>
            
            <div className="course-hero-updated body-sm">
              <Clock size={14} /> Last updated {formatUpdated(course.updatedAt || course.createdAt)}
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
              { id: 'instructor', label: 'Instructor', content: instructorTab },
              { id: 'reviews', label: `Reviews (${course.reviews})`, content: reviewsTab }
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
                {enrollState === 'ACCEPTED' || isEnrolled
                  ? 'Enrolled'
                  : enrollState === 'PENDING'
                    ? 'Pending Approval'
                    : enrollState === 'REJECTED'
                      ? 'Enrollment Rejected'
                      : 'Enrollment'}
              </div>
              
              {(user && user.role === 'INSTRUCTOR' && isOwner) ? (
                <Button variant="secondary" size="lg" className="enroll-btn" onClick={() => navigate(`/instructor/course/${course.id}/edit`)}>
                  Manage Course
                </Button>
              ) : (
                <Button 
                  variant={enrollState === 'ACCEPTED' || isEnrolled ? 'secondary' : 'primary'} 
                  size="lg" 
                  className="enroll-btn" 
                  onClick={handleEnrollClick}
                  disabled={enrollState === 'PENDING' || enrollState === 'REJECTED' || enrollState === 'loading'}
                >
                  {enrollState === 'ACCEPTED' || isEnrolled 
                    ? 'Continue Learning' 
                    : enrollState === 'PENDING'
                      ? 'Request Sent'
                      : enrollState === 'REJECTED'
                        ? 'Rejected'
                        : enrollState === 'loading'
                          ? 'Requesting...'
                          : !user 
                            ? 'Log in to Enroll' 
                            : Number(course.price) > 0
                              ? 'Purchase Course'
                              : 'Request Enrollment'}
                </Button>
              )}
              {(enrollState !== 'ACCEPTED' && !isEnrolled) && (
                <p className="body-sm text-center" style={{ margin: 'var(--spacing-sm) 0 var(--spacing-lg)' }}>
                  {Number(course.price) > 0
                    ? 'Paid courses require checkout and a verified payment.'
                    : 'Enrollment requires instructor approval.'}
                </p>
              )}
              
              <h4 className="title-sm" style={{ marginBottom: 'var(--spacing-md)' }}>This course includes:</h4>
              <ul className="course-features body-sm">
                <li><PlayCircle size={16}/> {course.sections.length} sections</li>
                <li><FileText size={16}/> {lessonCount} lessons</li>
                <li><CheckCircle size={16}/> {course.level} level</li>
                <li><Award size={16}/> Certificate of completion</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>


      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};