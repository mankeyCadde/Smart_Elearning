import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import './Auth.css';

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Mock login action
      console.log('Logging in with:', formData);
      
      const emailLower = formData.email.toLowerCase();
      
      // Redirect based on email to simulate role-based authentication
      if (emailLower.includes('admin')) {
        navigate('/admin/dashboard');
      } else if (emailLower.includes('instructor') || emailLower.includes('teacher')) {
        navigate('/instructor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="headline-md auth-title">Welcome Back</h1>
          <p className="body-md auth-subtitle">Log in to continue learning.</p>
          <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '12px', color: '#166534' }}>
            <strong>Demo Accounts:</strong><br/>
            Admin: admin@test.com<br/>
            Instructor: teacher@test.com<br/>
            Student: student@test.com<br/>
            (Any password works)
          </div>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
          
          <Button type="submit" variant="primary" className="auth-submit-btn">
            Log In
          </Button>
          
          <div className="auth-footer body-sm">
            Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
