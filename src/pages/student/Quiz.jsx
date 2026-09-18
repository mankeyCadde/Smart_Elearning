import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import { apiFetch, ApiError } from '../../services/api';
import './Quiz.css';

export const Quiz = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noAttempts, setNoAttempts] = useState(false);

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: optionId | textAnswer }
  const [quizPhase, setQuizPhase] = useState('taking'); // 'taking', 'confirming', 'submitting', 'submitted'
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');

  // Load quiz + (re)start attempt
  const loadQuiz = (startNew = true) => {
    setLoading(true);
    setError('');
    setNoAttempts(false);
    (async () => {
      try {
        let data = await apiFetch(`/quizzes/${id}/`);
        if (startNew && !data.inProgressSubmissionId && data.attemptsLeft > 0) {
          await apiFetch(`/quizzes/${id}/start/`, { method: 'POST' });
          data = await apiFetch(`/quizzes/${id}/`);
        }
        if (data.attemptsLeft <= 0 && !data.inProgressSubmissionId) {
          setNoAttempts(true);
        }
        setQuiz(data);
        setAnswers({});
        setTextAnswer('');
        setCurrentQuestionIndex(0);
        setResult(null);
        setQuizPhase('taking');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    })();
  };

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="quiz-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p className="body-lg">Loading quiz...</p>
    </div>;
  }

  if (error) {
    return (
      <div className="quiz-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--spacing-md)' }}>
        <h2 className="headline-md">Quiz unavailable</h2>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', maxWidth: '420px', textAlign: 'center' }}>{error}</p>
        <Button variant="primary" onClick={() => navigate('/student')}>Back to Dashboard</Button>
      </div>
    );
  }

  if (noAttempts || !quiz) {
    return (
      <div className="quiz-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--spacing-md)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
        <CheckCircle size={56} color="var(--color-primary)" />
        <h2 className="headline-md">{quiz ? `${quiz.title} complete` : 'No attempts remaining'}</h2>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', maxWidth: '460px' }}>
          {quiz ? `You've used all ${quiz.maxAttempts} attempt(s). Best score: ${quiz.bestScore ?? 0}%.` : 'You have no attempts left for this quiz.'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Button variant="secondary" onClick={() => navigate('/student')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = totalQuestions ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasAnsweredCurrent = currentAnswer !== undefined && currentAnswer !== '';
  const allAnswered = questions.every(q => {
    const a = answers[q.id];
    return a !== undefined && a !== '';
  });

  // Handlers
  const handleSelectOption = (optionId) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const handleTextChange = (value) => {
    setTextAnswer(value);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    setTextAnswer('');
    if (!isLastQuestion) setCurrentQuestionIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    setTextAnswer('');
    if (!isFirstQuestion) setCurrentQuestionIndex(prev => prev - 1);
  };

  const handleSubmitRequest = () => {
    setQuizPhase('confirming');
  };

  const confirmSubmit = async () => {
    setQuizPhase('submitting');
    setSubmitting(true);
    try {
      const payload = questions.map(q => {
        const value = answers[q.id];
        if (q.questionType === 'SA') {
          return { questionId: q.id, textAnswer: value || '' };
        }
        return { questionId: q.id, optionId: value };
      });
      const submission = await apiFetch(`/quizzes/${id}/submit/`, {
        method: 'POST',
        body: { answers: payload },
      });
      setResult(submission);
      setQuizPhase('submitted');
    } catch (err) {
      setQuizPhase('taking');
      alert(err instanceof ApiError ? err.message : 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const passed = result ? result.score >= (quiz.passingScore || 70) : false;
  const isShortAnswer = currentQuestion?.questionType === 'SA';

  if (quizPhase === 'submitted' && result) {
    return (
      <div className="quiz-page result-view" style={{ padding: 0 }}>
        <header className="quiz-header">
          <div className="quiz-header-content">
            <div>
              <p className="label-sm" style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>
                {result.courseTitle}
              </p>
              <h1 className="title-lg">{result.quizTitle} - Results</h1>
            </div>
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')} style={{ gap: '8px' }}>
              <XCircle size={20} /> Exit
            </Button>
          </div>
        </header>

        <main className="quiz-main-container" style={{ flexDirection: 'column', alignItems: 'center' }}>
          {/* Summary Card */}
          <Card className="quiz-result-card" style={{ marginBottom: 'var(--spacing-xxl)' }}>
            <div className="result-icon">
              {passed ? <CheckCircle size={64} color="var(--color-primary)" /> : <XCircle size={64} color="#DC2626" />}
            </div>
            <h1 className="headline-lg" style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
              {passed ? 'Congratulations, you passed!' : 'Keep Practicing'}
            </h1>
            <p className="body-lg" style={{ textAlign: 'center', color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-xl)' }}>
              You scored <strong style={{ color: 'var(--color-on-surface)' }}>{result.score}%</strong> · Attempt {result.attemptNumber}
            </p>
            
            <div className="result-actions">
              {quiz.attemptsLeft > 0 && (
                <Button variant="secondary" onClick={() => loadQuiz()}>
                  Retake Quiz
                </Button>
              )}
              {quiz.courseId && (
                <Button variant="primary" onClick={() => navigate(`/student/course/${quiz.courseId}/video`)}>
                  Continue Course
                </Button>
              )}
            </div>
          </Card>

          {/* Detailed Question Review */}
          <div className="quiz-review-section" style={{ width: '100%', maxWidth: '800px' }}>
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Question Review</h2>
            
            <div className="review-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {result.answers.map((q, index) => {
                const isCorrect = q.isCorrect === true;
                const pending = q.isCorrect == null;
                const yourAnswer = q.selectedOptionText || q.textAnswer || 'No answer';

                return (
                  <Card key={q.questionId} className="review-question-card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                      <h3 className="title-md" style={{ color: 'var(--color-on-surface)' }}>
                        <span style={{ color: 'var(--color-on-surface-variant)', marginRight: '8px' }}>{index + 1}.</span> 
                        {q.questionText}
                      </h3>
                      {pending ? (
                        <span className="label-sm" style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF3C7', padding: '4px 8px', borderRadius: 'var(--rounded-sm)' }}>
                          <Clock size={14} /> Pending Grading
                        </span>
                      ) : isCorrect ? (
                        <span className="label-sm" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-primary-container)', padding: '4px 8px', borderRadius: 'var(--rounded-sm)' }}>
                          <CheckCircle size={14} /> Correct
                        </span>
                      ) : (
                        <span className="label-sm" style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEE2E2', padding: '4px 8px', borderRadius: 'var(--rounded-sm)' }}>
                          <XCircle size={14} /> Incorrect
                        </span>
                      )}
                    </div>
                    
                    <div className="review-answers body-md">
                      <p style={{ marginBottom: 'var(--spacing-xs)' }}>
                        <span style={{ color: 'var(--color-on-surface-variant)' }}>Your Answer: </span>
                        <span style={{ color: isCorrect ? 'var(--color-primary)' : '#DC2626', fontWeight: 500 }}>
                          {yourAnswer}
                        </span>
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      {/* Header */}
      <header className="quiz-header">
        <div className="quiz-header-content">
          <div>
            <p className="label-sm" style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>
              {quiz.courseTitle}
            </p>
            <h1 className="title-lg">{quiz.title}</h1>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
              {quiz.timeLimitMinutes > 0 && <>⏱ {quiz.timeLimitMinutes} min · </>}Passing: {quiz.passingScore}% · Attempts left: {quiz.attemptsLeft}
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/student/dashboard')} style={{ gap: '8px' }}>
            <XCircle size={20} /> Exit Quiz
          </Button>
        </div>
      </header>

      {/* Main Container */}
      {totalQuestions === 0 ? (
        <main className="quiz-main-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <h2 className="headline-md">No questions available</h2>
            <Button variant="primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/student')}>Back to Dashboard</Button>
          </Card>
        </main>
      ) : (
        <main className="quiz-main-container">
          <Card className="quiz-question-card">
            {/* Progress */}
            <div className="quiz-progress-section">
              <div className="progress-labels">
                <span className="label-md">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <span className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <ProgressBar percentage={progressPercentage} size="sm" />
            </div>

            {/* Question Text */}
            <div className="quiz-question-text">
              <h2 className="headline-sm">{currentQuestion.text}</h2>
            </div>

            {/* Options / Text Answer */}
            {isShortAnswer ? (
              <div className="quiz-options-list">
                <textarea 
                  className="input-field"
                  rows="4"
                  placeholder="Type your answer here..."
                  value={textAnswer}
                  onChange={(e) => handleTextChange(e.target.value)}
                ></textarea>
              </div>
            ) : (
              <div className="quiz-options-list">
                {(currentQuestion.options || []).map(option => {
                  const isSelected = answers[currentQuestion.id] === option.id;
                  return (
                    <div 
                      key={option.id} 
                      className={`quiz-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(option.id)}
                    >
                      <div className="option-radio">
                        {isSelected && <div className="radio-dot"></div>}
                      </div>
                      <span className="body-lg">{option.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <div className="quiz-navigation">
              <Button 
                variant="secondary" 
                onClick={handlePrev} 
                disabled={isFirstQuestion}
                style={{ gap: '8px' }}
              >
                <ChevronLeft size={18} /> Previous
              </Button>
              
              {isLastQuestion ? (
                <Button 
                  variant="primary" 
                  onClick={handleSubmitRequest}
                  disabled={!allAnswered || submitting}
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={handleNext}
                  disabled={!hasAnsweredCurrent}
                  style={{ gap: '8px' }}
                >
                  Next <ChevronRight size={18} />
                </Button>
              )}
            </div>
          </Card>
        </main>
      )}

      {/* Submission Confirmation Modal */}
      {quizPhase === 'confirming' && (
        <Modal 
          isOpen={true} 
          onClose={() => setQuizPhase('taking')} 
          title="Submit Assessment"
        >
          <div className="modal-body text-center">
            <p className="body-lg" style={{ marginBottom: 'var(--spacing-xl)' }}>
              Are you sure you want to submit your quiz? You cannot change your answers after submission.
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
              <Button variant="secondary" onClick={() => setQuizPhase('taking')}>
                Review Answers
              </Button>
              <Button variant="primary" onClick={confirmSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Yes, Submit Now'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};