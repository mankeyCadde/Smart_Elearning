import React, { useState } from 'react';
import { Camera, Save, Award, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import '../student/Profile.css';

const MOCK_USER = {
  firstName: 'System',
  lastName: 'Administrator',
  email: 'admin@smartlearn.com',
  phone: '+1 (555) 000-0000',
  bio: 'Platform administrator responsible for user management and system health.',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  joinedDate: '2020-01-01'
};

const MOCK_STATS = {
  totalUsers: 54320,
  activeCourses: 1240,
  systemUptime: '99.9%',
  recentActions: [
    { id: 'act1', name: 'Approved Course: React Basics', date: '2023-10-25' },
    { id: 'act2', name: 'Suspended User ID #9482', date: '2023-10-24' }
  ]
};

export const AdminProfile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  
  // Personal Info Form State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: MOCK_USER.firstName,
    lastName: MOCK_USER.lastName,
    email: MOCK_USER.email,
    phone: MOCK_USER.phone,
    bio: MOCK_USER.bio
  });
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  // Security Form State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSavePersonal = () => {
    setIsSavingPersonal(true);
    setTimeout(() => {
      setIsSavingPersonal(false);
      alert("Profile updated successfully!"); // Mock toast
    }, 800);
  };

  const handleSavePassword = () => {
    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match!");
      return;
    }
    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      setPasswords({ current: '', new: '', confirm: '' });
      alert("Password updated successfully!"); // Mock toast
    }, 800);
  };

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header-card">
        <div className="profile-avatar-container">
          <img src={MOCK_USER.avatar} alt="Profile Avatar" className="profile-avatar" />
          <button className="avatar-upload-btn" title="Change Avatar">
            <Camera size={16} />
          </button>
        </div>
        <div className="profile-header-info">
          <h1 className="headline-lg">{personalInfo.firstName} {personalInfo.lastName}</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
            Admin since {MOCK_USER.joinedDate}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        tabs={[
          { id: 'personal', label: 'Personal Information' },
          { id: 'security', label: 'Security' },
          { id: 'statistics', label: 'Platform Statistics' }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <div className="profile-content" style={{ marginTop: 'var(--spacing-xl)' }}>
        
        {/* TAB 1: Personal Info */}
        {activeTab === 'personal' && (
          <Card className="profile-tab-card">
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Personal Details</h2>
            
            <div className="profile-form-grid">
              <Input 
                label="First Name" 
                value={personalInfo.firstName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
              />
              <Input 
                label="Last Name" 
                value={personalInfo.lastName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
              />
              <Input 
                label="Email Address" 
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              />
              <Input 
                label="Phone Number" 
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              />
            </div>
            
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Bio</label>
              <textarea 
                className="input-field" 
                style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                value={personalInfo.bio}
                onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
              ></textarea>
            </div>
            
            <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={handleSavePersonal} disabled={isSavingPersonal} style={{ gap: '8px' }}>
                <Save size={18} /> {isSavingPersonal ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        )}

        {/* TAB 2: Security */}
        {activeTab === 'security' && (
          <Card className="profile-tab-card">
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Change Password</h2>
            
            <div className="profile-form-single">
              <Input 
                label="Current Password" 
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
              <div style={{ height: 'var(--spacing-md)' }}></div>
              <Input 
                label="New Password" 
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              />
              <Input 
                label="Confirm New Password" 
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>
            
            <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={handleSavePassword} disabled={isSavingPassword || !passwords.current || !passwords.new} style={{ gap: '8px' }}>
                <Save size={18} /> {isSavingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </Card>
        )}

        {/* TAB 3: Statistics */}
        {activeTab === 'statistics' && (
          <div className="profile-stats-tab">
            <div className="stats-grid">
              <Card className="stat-box">
                <BookOpen size={32} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }} />
                <h3 className="headline-lg">{MOCK_STATS.activeCourses.toLocaleString()}</h3>
                <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Active Courses</p>
              </Card>
              <Card className="stat-box">
                <CheckCircle size={32} style={{ color: '#059669', marginBottom: 'var(--spacing-sm)' }} />
                <h3 className="headline-lg">{MOCK_STATS.totalUsers.toLocaleString()}</h3>
                <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total Users</p>
              </Card>
              <Card className="stat-box">
                <Award size={32} style={{ color: '#D97706', marginBottom: 'var(--spacing-sm)' }} />
                <h3 className="headline-lg">{MOCK_STATS.systemUptime}</h3>
                <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>System Uptime</p>
              </Card>
            </div>

            <Card className="profile-tab-card" style={{ marginTop: 'var(--spacing-xl)' }}>
              <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Recent Audit Log</h2>
              <div className="certificates-list">
                {MOCK_STATS.recentActions.map(action => (
                  <div key={action.id} className="certificate-item">
                    <div>
                      <h4 className="title-md">{action.name}</h4>
                      <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Performed on {action.date}</p>
                    </div>
                    <Button variant="secondary" style={{ gap: '8px' }}>
                      <CheckCircle size={16} /> View Details
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};
