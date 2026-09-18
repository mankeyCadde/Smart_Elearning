import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Share2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Certificates.css';

const fmtIssueDate = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

export const CertificateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/certificates/${id}/`)
      .then(cert => {
        if (cancelled) return;
        setCertificate({
          id: cert.id,
          courseName: cert.courseTitle,
          studentName: cert.studentFullName || user?.fullName || 'Student',
          issueDate: fmtIssueDate(cert.issuedAt),
          certificateId: cert.certificateCode,
          instructor: cert.instructorName || 'SmartLearn Team',
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const handleDownload = () => {
    const html = document.querySelector('.paper-certificate');
    if (html) {
      window.print();
    } else {
      window.alert('Certificate content is not available yet.');
    }
  };

  if (loading) {
    return <div className="p-xl text-center"><p className="body-md">Loading certificate...</p></div>;
  }

  if (!certificate) {
    return (
      <div className="p-xl text-center">
        <h2 className="headline-md">Certificate not found</h2>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
          Complete the course to earn your certificate of completion.
        </p>
        <Button variant="primary" onClick={() => navigate('/student/certificates')} style={{ marginTop: 'var(--spacing-md)' }}>
          Back to Certificates
        </Button>
      </div>
    );
  }

  return (
    <div className="certificate-details-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <Button variant="ghost" onClick={() => navigate('/student/certificates')}>
          <ChevronLeft size={18} /> Back to Certificates
        </Button>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button variant="secondary" style={{ gap: '8px' }} onClick={() => window.alert('Shareable link copied: your certificate record ID ' + certificate.certificateId)}>
            <Share2 size={16} /> Share
          </Button>
          <Button variant="primary" onClick={handleDownload} style={{ gap: '8px' }}>
            <Download size={16} /> Print / Save PDF
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