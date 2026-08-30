import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Calendar, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import './Certificates.css';

export const MOCK_CERTIFICATES = [
  {
    id: 'cert1',
    courseName: 'Advanced Data Science with Python',
    studentName: 'Alex Johnson',
    issueDate: 'August 20, 2023',
    certificateId: 'SML-2023-08-9921',
    instructor: 'Bob Smith',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'cert2',
    courseName: 'HTML & CSS Fundamentals',
    studentName: 'Alex Johnson',
    issueDate: 'September 10, 2023',
    certificateId: 'SML-2023-09-1102',
    instructor: 'Sarah Jenkins',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400'
  }
];

export const Certificates = () => {
  const navigate = useNavigate();

  return (
    <div className="certificates-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">My Certificates</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          View and download certificates for your completed courses.
        </p>
      </div>

      <div className="certificates-grid">
        {MOCK_CERTIFICATES.length === 0 ? (
          <div className="empty-state text-center" style={{ padding: 'var(--spacing-xxxl)', border: '1px dashed var(--color-outline-variant)', borderRadius: 'var(--rounded-lg)', gridColumn: '1 / -1' }}>
            <Award size={48} style={{ color: 'var(--color-outline)', margin: '0 auto var(--spacing-md)' }} />
            <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
              You haven't earned any certificates yet. Keep learning!
            </p>
          </div>
        ) : (
          MOCK_CERTIFICATES.map(cert => (
            <Card key={cert.id} className="certificate-card">
              <div className="certificate-card-thumb" style={{ backgroundImage: `url(${cert.thumbnail})` }}>
                <div className="thumb-overlay">
                  <Award size={48} style={{ color: 'white' }} />
                </div>
              </div>
              <div className="certificate-card-content">
                <h3 className="title-lg" style={{ marginBottom: '4px' }}>{cert.courseName}</h3>
                <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 'var(--spacing-md)' }}>
                  <Calendar size={14} /> Issued: {cert.issueDate}
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Button variant="primary" style={{ flex: 1 }} onClick={() => navigate(`/student/certificate/${cert.id}`)}>
                    View Details
                  </Button>
                  <Button variant="secondary" onClick={() => alert('Downloading PDF...')} title="Quick Download">
                    <Download size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
