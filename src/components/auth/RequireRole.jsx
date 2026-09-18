import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  INSTRUCTOR: '/instructor/dashboard',
  STUDENT: '/student/dashboard',
};

export const RequireRole = ({ role = null }) => {
  const { user, loading, role: userRole } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to={ROLE_HOME[userRole] || '/login'} replace />;

  return <Outlet />;
};