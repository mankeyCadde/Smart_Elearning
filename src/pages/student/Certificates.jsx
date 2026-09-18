import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Certificates.css';

const fmtIssueDate = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

export const Certificates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/certificates/')
      .then(data => {
        if (cancelled) return;
        setCertificates((data || []).map(cert => ({
          id: cert.id,
          courseName: cert.courseTitle,
          studentName: cert.studentFullName || user?.fullName || 'Student',
          issueDate: fmtIssueDate(cert.issuedAt),
          certificateId: cert.certificateCode,
          instructor: cert.instructorName || 'SmartLearn Team',
        })));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="certificates-page">
      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="headline-lg">My Certificates</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          View and download certificates for your completed courses.
        </p>
      </div>

      <div className="certificates-grid">
        {loading ? (
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Loading certificates...</p>
        ) : certificates.length === 0 ? (
          <div className="empty-state text-center" style={{ padding: 'var(--spacing-xxxl)', border: '1px dashed var(--color-outline-variant)', borderRadius: 'var(--rounded-lg)', gridColumn: '1 / -1' }}>
            <Award size={48} style={{ color: 'var(--color-outline)', margin: '0 auto var(--spacing-md)' }} />
            <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
              You haven't earned any certificates yet. Keep learning!
            </p>
          </div>
        ) : (
          certificates.map(cert => (
            <Card key={cert.id} className="certificate-card">
              <div className="certificate-card-thumb" style={{ backgroundImage: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
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
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};