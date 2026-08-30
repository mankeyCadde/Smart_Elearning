import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import './Auth.css';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
    } else {
      setError('');
      setIsSubmitted(true);
      console.log('Sending reset link to:', email);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="headline-md auth-title">Reset Password</h1>
          <p className="body-md auth-subtitle">
            Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>
        
        {isSubmitted ? (
          <div className="auth-success-state">
            <h3 className="label-lg" style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }}>
              Check your email
            </h3>
            <p className="body-sm" style={{ marginBottom: 'var(--spacing-xl)' }}>
              We have sent a password reset link to <strong>{email}</strong>.
            </p>
            <Link to="/login">
              <Button variant="secondary" style={{ width: '100%' }}>Back to Log In</Button>
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
            
            <Button type="submit" variant="primary" className="auth-submit-btn">
              Send Reset Link
            </Button>
            
            <div className="auth-footer body-sm">
              Remember your password? <Link to="/login" className="auth-link">Log In</Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
