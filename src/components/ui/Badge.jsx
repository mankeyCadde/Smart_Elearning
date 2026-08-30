import React from 'react';
import './Badge.css';

export const Badge = ({ children, variant = 'primary', className = '' }) => {
  return (
    <span className={`stitch-badge stitch-badge-${variant} ${className}`}>
      {children}
    </span>
  );
};
