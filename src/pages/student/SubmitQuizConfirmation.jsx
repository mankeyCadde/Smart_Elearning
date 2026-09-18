import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const SubmitQuizConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quizId = searchParams.get('quizId');

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <Card style={{ padding: 'var(--spacing-xxl)', textAlign: 'center' }}>
        <ClipboardCheck size={56} color="var(--color-primary)" style={{ margin: '0 auto var(--spacing-lg)' }} />
        <h1 className="headline-lg" style={{ marginBottom: 'var(--spacing-sm)' }}>Ready to Submit?</h1>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-xl)', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
          Once you submit your quiz, you cannot change your answers. Your results are graded automatically and recorded in your history.
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => (quizId ? navigate(`/student/quiz/${quizId}`) : navigate('/student/quizzes/history'))} style={{ gap: '8px' }}>
            {quizId ? 'Continue Quiz' : 'View Quiz History'} <ArrowRight size={16} />
          </Button>
          <Button variant="secondary" onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};