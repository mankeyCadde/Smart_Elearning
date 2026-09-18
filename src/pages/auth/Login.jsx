import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import './Auth.css';

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  INSTRUCTOR: '/instructor/dashboard',
  STUDENT: '/student/dashboard',
};

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await login(formData.email, formData.password);
      navigate(ROLE_HOME[user.role] || '/student/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields && typeof err.fields === 'object' && err.fields.email) {
          setErrors({ email: err.fields.email[0] || 'Invalid email.' });
        } else if (err.fields && err.fields.password) {
          setErrors({ password: err.fields.password[0] || 'Invalid password.' });
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="headline-md auth-title">Welcome Back</h1>
          <p className="body-md auth-subtitle">Log in to continue learning.</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="auth-server-error" role="alert">
              {serverError}
            </div>
          )}
          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />
          
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
          />
          
          <div className="auth-options">
            <label className="auth-checkbox-label body-sm">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password" className="auth-link body-sm">Forgot Password?</Link>
          </div>
          
          <Button type="submit" variant="primary" className="auth-submit-btn" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log In'}
          </Button>
          
          <div className="auth-footer body-sm">
            Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
