import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, ChevronLeft, CheckCircle, File } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MOCK_STUDENT_ASSIGNMENTS } from './StudentAssignments';

export const StudentAssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Find assignment
  const initialAssignment = MOCK_STUDENT_ASSIGNMENTS.find(a => a.id === id);
  const [assignment, setAssignment] = useState(initialAssignment);
  
  // File upload state (mock)
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assignment) {
    return <div className="p-xl text-center">Assignment not found</div>;
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    
    setIsSubmitting(true);
    // Simulate upload delay
    setTimeout(() => {
      setIsSubmitting(false);
      setAssignment(prev => ({ ...prev, status: 'submitted' }));
    }, 1000);
  };

  return (
    <div className="assignment-details-page">
      <Button variant="ghost" onClick={() => navigate('/student/assignments')} style={{ marginBottom: 'var(--spacing-md)' }}>
        <ChevronLeft size={18} /> Back to Assignments
      </Button>

      <div className="dashboard-header-section" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="label-sm" style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>
            {assignment.courseName}
          </p>
          <h1 className="headline-lg">{assignment.title}</h1>
        </div>
        
        <div className="status-badge">
          {assignment.status === 'pending' && <Badge variant="danger" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>Pending Submission</Badge>}
          {assignment.status === 'submitted' && <Badge variant="secondary">Submitted</Badge>}
          {assignment.status === 'graded' && <Badge variant="primary">Graded: {assignment.grade}</Badge>}
        </div>
      </div>

      <div className="assignment-layout" style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
        {/* Left Column: Instructions */}
        <div style={{ flex: '2 1 400px' }}>
          <Card className="p-xl">
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-md)' }}>Instructions</h2>
            <div className="body-lg" style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
              <p>Please complete the following steps for this assignment:</p>
              <ul style={{ paddingLeft: 'var(--spacing-xl)', margin: 'var(--spacing-md) 0' }}>
                <li>Review the module materials carefully.</li>
                <li>Download the provided dataset (if applicable).</li>
                <li>Perform the required analysis and document your findings.</li>
                <li>Export your final work as a PDF or ZIP file.</li>
              </ul>
              <p>Ensure your submission is clear and well-documented. Late submissions will incur a 10% penalty per day.</p>
            </div>
            
            <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-outline-variant)' }}>
              <h3 className="title-md" style={{ marginBottom: 'var(--spacing-sm)' }}>Due Date</h3>
              <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{assignment.dueDate} at 11:59 PM</p>
            </div>
          </Card>
        </div>

        {/* Right Column: Submission Form */}
        <div style={{ flex: '1 1 300px' }}>
          <Card className="p-xl">
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Your Submission</h2>
            
            {assignment.status === 'pending' ? (
              <div className="submission-form">
                <div 
                  className="file-upload-area" 
                  style={{ 
                    border: '2px dashed var(--color-outline-variant)', 
                    borderRadius: 'var(--rounded-lg)', 
                    padding: 'var(--spacing-xxl)', 
                    textAlign: 'center',
                    marginBottom: 'var(--spacing-lg)',
                    backgroundColor: 'var(--color-surface-container-lowest)'
                  }}
                >
                  {selectedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <File size={32} style={{ color: 'var(--color-primary)' }} />
                      <span className="body-md">{selectedFile.name}</span>
                      <Button variant="ghost" onClick={() => setSelectedFile(null)}>Remove File</Button>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-md)' }} />
                      <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-md)' }}>
                        Drag and drop your file here, or click to browse.
                      </p>
                      <input 
                        type="file" 
                        id="file-upload" 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file-upload">
                        <span className="btn btn-secondary">Browse Files</span>
                      </label>
                    </>
                  )}
                </div>
                
                <Button 
                  variant="primary" 
                  style={{ width: '100%' }} 
                  disabled={!selectedFile || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              </div>
            ) : (
              <div className="submission-success text-center">
                <CheckCircle size={48} style={{ color: 'var(--color-primary)', margin: '0 auto var(--spacing-md)' }} />
                <h3 className="title-md" style={{ marginBottom: 'var(--spacing-sm)' }}>Submission Received</h3>
                <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Your assignment was submitted successfully.
                </p>
                <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--rounded-md)' }}>
                  <p className="body-sm text-center">File: my_assignment_submission.pdf</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
