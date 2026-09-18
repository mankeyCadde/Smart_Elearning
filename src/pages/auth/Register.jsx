import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

export const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'instructor' ? 'instructor' : 'student';
  const { register } = useAuth();
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [role, setRole] = useState(initialRole);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full Name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const user = await register(formData, role);
      navigate(ROLE_HOME[user.role] || '/student/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields && typeof err.fields === 'object' && !Array.isArray(err.fields)) {
          const firstField = Object.keys(err.fields)[0];
          if (firstField && Array.isArray(err.fields[firstField])) {
            setErrors({ [firstField]: err.fields[firstField][0] });
          } else {
            setServerError(err.message);
          }
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
          <h1 className="headline-md auth-title">Create Account</h1>
          <p className="body-md auth-subtitle">Join SmartLearn to start your journey.</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="auth-server-error" role="alert">
              {serverError}
            </div>
          )}

          <div className="auth-role-switch" role="radiogroup" aria-label="Account type">
            <label className="auth-role-label body-sm">
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === 'student'}
                onChange={() => setRole('student')}
              />
              Student
            </label>
            <label className="auth-role-label body-sm">
              <input
                type="radio"
                name="role"
                value="instructor"
                checked={role === 'instructor'}
                onChange={() => setRole('instructor')}
              />
              Instructor
            </label>
          </div>

          <Input
            id="fullName"
            type="text"
            label="Full Name"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={errors.fullName}
          />

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

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />
          
          <Button type="submit" variant="primary" className="auth-submit-btn" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign Up'}
          </Button>
          
          <div className="auth-footer body-sm">
            Already have an account? <Link to="/login" className="auth-link">Log In</Link>
          </div>
        </form>
      </Card>
    </div>
  );
};