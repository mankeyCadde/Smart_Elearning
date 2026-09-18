import React from 'react';
import './Badge.css';

export const Badge = ({ children, variant = 'primary', className = '', style }) => {
  return (
    <span className={`stitch-badge stitch-badge-${variant} ${className}`} style={style}>
      {children}
    </span>
  );
};
