import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`stitch-card ${className}`} {...props}>
      {children}
    </div>
  );
};
