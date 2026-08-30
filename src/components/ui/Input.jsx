import React from 'react';
import './Input.css';

export const Input = React.forwardRef(({ 
  label, 
  error, 
  id, 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className={`input-container ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label label-md">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={`input-field body-md ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && (
        <span className="input-error-text body-sm">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
