import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './Accordion.css';

export const AccordionItem = ({ title, children, defaultOpen = false, rightContent }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="accordion-item">
      <button 
        className="accordion-header" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="accordion-title-area">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          <span className="title-md">{title}</span>
        </div>
        {rightContent && <div className="accordion-right-content">{rightContent}</div>}
      </button>
      {isOpen && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  );
};

export const Accordion = ({ children }) => {
  return (
    <div className="accordion">
      {children}
    </div>
  );
};
