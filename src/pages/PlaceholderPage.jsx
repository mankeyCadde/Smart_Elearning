import React from 'react';
import { Card } from '../components/ui/Card';

export const PlaceholderPage = ({ title }) => {
  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 className="headline-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>{title}</h1>
      <Card>
        <p className="body-md">This is a placeholder for the {title} page.</p>
      </Card>
    </div>
  );
};
