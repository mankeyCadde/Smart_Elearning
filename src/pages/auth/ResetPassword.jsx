import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiFetch, ApiError } from '../../services/api';
import './Auth.css';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkError, setLinkError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid || !token) {
      setLinkError('This reset link is invalid or incomplete. Please request a new link.');
      return;
    }
    if (validate()) {
      setLinkError('');
      setIsSubmitting(true);
      try {
        await apiFetch('/auth/reset-password/', {
          method: 'POST',
          body: { uid, token, newPassword: formData.password },
          auth: false,
        });
        navigate('/login');
      } catch (err) {
        setLinkError(err instanceof ApiError ? err.message : 'Could not reset your password. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="headline-md auth-title">Set New Password</h1>
          <p className="body-md auth-subtitle">
            Your new password must be different from previously used passwords.
          </p>
        </div>
        
        {linkError && (
          <p className="body-sm" style={{ color: '#DC2626', backgroundColor: '#FEE2E2', padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--rounded-sm)', marginBottom: 'var(--spacing-md)' }}>
            {linkError}
          </p>
        )}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="password"
            type="password"
            label="New Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />
          
          <Button type="submit" variant="primary" className="auth-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
