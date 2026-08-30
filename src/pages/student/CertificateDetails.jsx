import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Share2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MOCK_CERTIFICATES } from './Certificates';
import './Certificates.css';

export const CertificateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const certificate = MOCK_CERTIFICATES.find(c => c.id === id);

  if (!certificate) {
    return <div className="p-xl text-center">Certificate not found</div>;
  }

  const handleDownload = () => {
    alert('Simulating PDF Download...\n(In a real app, this would generate a PDF Blob)');
  };

  return (
    <div className="certificate-details-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <Button variant="ghost" onClick={() => navigate('/student/certificates')}>
          <ChevronLeft size={18} /> Back to Certificates
        </Button>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button variant="secondary" style={{ gap: '8px' }}>
            <Share2 size={16} /> Share
          </Button>
          <Button variant="primary" onClick={handleDownload} style={{ gap: '8px' }}>
            <Download size={16} /> Download PDF
          </Button>
        </div>
      </div>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">Certificate of Completion</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          {certificate.courseName}
        </p>
      </div>

      <Card className="preview-container">
        {/* Visual HTML/CSS representation of the certificate */}
        <div className="paper-certificate">
          <div className="cert-border-inner">
            
            <div className="cert-header">
              <div className="cert-logo">SmartLearn</div>
              <h1 className="cert-title">Certificate of Completion</h1>
              <p className="cert-subtitle">This is to certify that</p>
            </div>

            <div className="cert-body">
              <h2 className="cert-student-name">{certificate.studentName}</h2>
              <p className="cert-text">has successfully completed the online course</p>
              <h3 className="cert-course-name">{certificate.courseName}</h3>
            </div>

            <div className="cert-footer">
              <div className="signature-block">
                <span className="signature-font">{certificate.instructor}</span>
                <div className="signature-line"></div>
                <span className="signature-label">Lead Instructor</span>
              </div>
              
              <div className="cert-meta-block">
                <p><strong>Date:</strong> {certificate.issueDate}</p>
                <p><strong>ID:</strong> {certificate.certificateId}</p>
              </div>
            </div>

          </div>
        </div>
      </Card>
    </div>
  );
};
