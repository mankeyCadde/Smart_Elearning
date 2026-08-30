import React from 'react';
import './ProgressBar.css';

export const ProgressBar = ({ 
  percentage, 
  showLabel = false, 
  size = 'md', 
  color = 'var(--color-primary)' 
}) => {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="progress-bar-wrapper">
      <div className={`progress-bar-track size-${size}`}>
        <div 
          className="progress-bar-fill" 
          style={{ width: `${clampedPercentage}%`, backgroundColor: color }}
        ></div>
      </div>
      {showLabel && (
        <div className="progress-bar-label label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          {clampedPercentage}% Complete
        </div>
      )}
    </div>
  );
};
