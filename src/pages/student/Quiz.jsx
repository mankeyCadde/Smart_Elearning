import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import './Quiz.css';

// Mock Quiz Data
const MOCK_QUIZ = {
  id: 'q1',
  title: 'Module 1 Assessment: Python Basics',
  courseName: 'Advanced Data Science with Python',
  questions: [
    {
      id: 'q_1',
      text: 'Which of the following is NOT a core data type in Python?',
      options: [
        { id: 'opt_1', text: 'Lists' },
        { id: 'opt_2', text: 'Dictionaries' },
        { id: 'opt_3', text: 'Tuples' },
        { id: 'opt_4', text: 'Class' },
      ],
      correctOptionId: 'opt_4'
    },
    {
      id: 'q_2',
      text: 'What is the output of `print(2 ** 3)`?',
      options: [
        { id: 'opt_1', text: '6' },
        { id: 'opt_2', text: '8' },
        { id: 'opt_3', text: '9' },
        { id: 'opt_4', text: 'Error' },
      ],
      correctOptionId: 'opt_2'
    },
    {
      id: 'q_3',
      text: 'Which keyword is used to define a function in Python?',
      options: [
        { id: 'opt_1', text: 'function' },
        { id: 'opt_2', text: 'def' },
        { id: 'opt_3', text: 'func' },
        { id: 'opt_4', text: 'define' },
      ],
      correctOptionId: 'opt_2'
    }
  ]
};

export const Quiz = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOptionId }
  const [quizPhase, setQuizPhase] = useState('taking'); // 'taking', 'confirming', 'submitted'

  // Derived State
  const totalQuestions = MOCK_QUIZ.questions.length;
  const currentQuestion = MOCK_QUIZ.questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const hasAnsweredCurrent = !!answers[currentQuestion.id];
  const allAnswered = Object.keys(answers).length === totalQuestions;

  // Handlers
  const handleSelectOption = (optionId) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) setCurrentQuestionIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (!isFirstQuestion) setCurrentQuestionIndex(prev => prev - 1);
  };

  const handleSubmitRequest = () => {
    setQuizPhase('confirming');
  };

  const confirmSubmit = () => {
    setQuizPhase('submitted');
  };

  // Calculate Score (only used when phase is 'submitted')
  const calculateScore = () => {
    let correct = 0;
    MOCK_QUIZ.questions.forEach(q => {
      if (answers[q.id] === q.correctOptionId) {
        correct += 1;
      }
    });
    return { correct, percentage: Math.round((correct / totalQuestions) * 100) };
  };

  // Render Sub-Views
  if (quizPhase === 'submitted') {
    const score = calculateScore();
    const passed = score.percentage >= 70;

    return (
      <div className="quiz-page result-view" style={{ padding: 0 }}>
        <header className="quiz-header">
          <div className="quiz-header-content">
            <div>
              <p className="label-sm" style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>
                {MOCK_QUIZ.courseName}
              </p>
              <h1 className="title-lg">{MOCK_QUIZ.title} - Results</h1>
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
              You scored <strong style={{ color: 'var(--color-on-surface)' }}>{score.percentage}%</strong> ({score.correct} out of {totalQuestions} correct)
            </p>
            
            <div className="result-actions">
              {!passed && (
                <Button variant="secondary" onClick={() => {
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  setQuizPhase('taking');
                }}>
                  Retake Quiz
                </Button>
              )}
              <Button variant="primary" onClick={() => navigate(`/student/course/c1/video`)}>
                Continue Course
              </Button>
            </div>
          </Card>

          {/* Detailed Question Review */}
          <div className="quiz-review-section" style={{ width: '100%', maxWidth: '800px' }}>
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Question Review</h2>
            
            <div className="review-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {MOCK_QUIZ.questions.map((q, index) => {
                const isCorrect = answers[q.id] === q.correctOptionId;
                const userAnswerText = q.options.find(opt => opt.id === answers[q.id])?.text;
                const correctAnswerText = q.options.find(opt => opt.id === q.correctOptionId)?.text;

                return (
                  <Card key={q.id} className="review-question-card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                      <h3 className="title-md" style={{ color: 'var(--color-on-surface)' }}>
                        <span style={{ color: 'var(--color-on-surface-variant)', marginRight: '8px' }}>{index + 1}.</span> 
                        {q.text}
                      </h3>
                      {isCorrect ? (
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
                          {userAnswerText}
                        </span>
                      </p>
                      
                      {!isCorrect && (
                        <p>
                          <span style={{ color: 'var(--color-on-surface-variant)' }}>Correct Answer: </span>
                          <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                            {correctAnswerText}
                          </span>
                        </p>
                      )}
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
              {MOCK_QUIZ.courseName}
            </p>
            <h1 className="title-lg">{MOCK_QUIZ.title}</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate('/student/dashboard')} style={{ gap: '8px' }}>
            <XCircle size={20} /> Exit Quiz
          </Button>
        </div>
      </header>

      {/* Main Container */}
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

          {/* Options */}
          <div className="quiz-options-list">
            {currentQuestion.options.map(option => {
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
                disabled={!allAnswered}
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
              <Button variant="primary" onClick={confirmSubmit}>
                Yes, Submit Now
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
