import React, { useState, useEffect } from 'react';
import { Save, Award, BookOpen, CheckCircle, Flame, Trophy, Medal } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, ApiError } from '../../services/api';
import './Profile.css';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  
  // Personal Info Form State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalMessage, setPersonalMessage] = useState('');
  const [personalError, setPersonalError] = useState('');

  // Security Form State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Gamification
  const [gamer, setGamer] = useState(null);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (user) {
      setPersonalInfo(prev => ({
        firstName: user.firstName ?? prev.firstName,
        lastName: user.lastName ?? prev.lastName,
        email: user.email ?? prev.email,
        phone: user.phone ?? prev.phone,
        bio: user.bio ?? prev.bio,
      }));
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch('/gamification/me/'),
      apiFetch('/enrollments/mine/'),
    ])
      .then(([g, enroll]) => {
        if (!cancelled) {
          setGamer(g);
          setEnrolledCount(enroll?.length || 0);
          setCompletedCount(enroll?.filter(e => e.progress === 100).length || 0);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSavePersonal = async () => {
    setIsSavingPersonal(true);
    setPersonalMessage('');
    setPersonalError('');
    try {
      await updateUser({
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        bio: personalInfo.bio,
      });
      setPersonalMessage('Profile updated successfully!');
    } catch (err) {
      setPersonalError(err instanceof ApiError ? err.message : 'Failed to update profile.');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordMessage('');
    setPasswordError('');
    if (passwords.new !== passwords.confirm) {
      setPasswordError('New passwords do not match!');
      return;
    }
    if (!passwords.current) {
      setPasswordError('Current password is required.');
      return;
    }
    setIsSavingPassword(true);
    try {
      await apiFetch('/auth/change-password/', {
        method: 'POST',
        body: { currentPassword: passwords.current, newPassword: passwords.new },
      });
      setPasswordMessage('Password updated successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Failed to update password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const joinedDate = user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '';
  const initials = (user?.firstName?.[0] || user?.fullName?.[0] || 'U').toUpperCase();
  const roleLabel = (user?.role || 'STUDENT').toLowerCase();

  const badgeCategories = {
    learning: 'Learning',
    engagement: 'Engagement',
    achievement: 'Achievement',
  };

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header-card">
        <div className="profile-avatar-container">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile Avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar-initial">{initials}</div>
          )}
        </div>
        <div className="profile-header-info">
          <h1 className="headline-lg">{user?.fullName || user?.email}</h1>
          <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
            {roleLabel} {joinedDate ? `since ${joinedDate}` : ''}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        tabs={[
          { id: 'personal', label: 'Personal Information' },
          { id: 'security', label: 'Security' },
          { id: 'statistics', label: 'Learning Statistics' }
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

            {personalMessage && <p className="body-sm" style={{ color: '#059669', marginTop: 'var(--spacing-sm)' }}>{personalMessage}</p>}
            {personalError && <p className="body-sm" style={{ color: '#B91C1C', marginTop: 'var(--spacing-sm)' }}>{personalError}</p>}
            
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

            {passwordMessage && <p className="body-sm" style={{ color: '#059669', marginTop: 'var(--spacing-sm)' }}>{passwordMessage}</p>}
            {passwordError && <p className="body-sm" style={{ color: '#B91C1C', marginTop: 'var(--spacing-sm)' }}>{passwordError}</p>}
            
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
              {gamer ? (
                <>
                  <Card className="stat-box">
                    <Trophy size={32} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }} />
                    <h3 className="headline-lg">{gamer.xp}</h3>
                    <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>XP — {gamer.levelTitle}</p>
                  </Card>
                  <Card className="stat-box">
                    <Flame size={32} style={{ color: '#D97706', marginBottom: 'var(--spacing-sm)' }} />
                    <h3 className="headline-lg">{gamer.currentStreak}</h3>
                    <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Day Streak (best {gamer.longestStreak})</p>
                  </Card>
                  <Card className="stat-box">
                    <Award size={32} style={{ color: '#059669', marginBottom: 'var(--spacing-sm)' }} />
                    <h3 className="headline-lg">{gamer.badges.length}</h3>
                    <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Badges Earned</p>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="stat-box">
                    <BookOpen size={32} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }} />
                    <h3 className="headline-lg">{enrolledCount}</h3>
                    <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Enrolled Courses</p>
                  </Card>
                  <Card className="stat-box">
                    <CheckCircle size={32} style={{ color: '#059669', marginBottom: 'var(--spacing-sm)' }} />
                    <h3 className="headline-lg">{completedCount}</h3>
                    <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Completed Courses</p>
                  </Card>
                  <Card className="stat-box">
                    <Medal size={32} style={{ color: '#D97706', marginBottom: 'var(--spacing-sm)' }} />
                    <h3 className="headline-lg">—</h3>
                    <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Ranking</p>
                  </Card>
                </>
              )}
            </div>

            {gamer && gamer.badges.length > 0 && (
              <Card className="profile-tab-card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                  <h2 className="title-lg">My Badges</h2>
                  <span className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Global rank #{gamer.ranking}</span>
                </div>
                <div className="badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                  {gamer.badges.map(badge => (
                    <div key={badge.id} className="badge-tile" style={{ textAlign: 'center', padding: 'var(--spacing-md)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{badge.icon || '🎖️'}</div>
                      <h4 className="title-sm">{badge.name}</h4>
                      <p className="label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {badge.category ? (badgeCategories[badge.category] || badge.category) : ''} · +{badge.points} XP
                      </p>
                      <p className="label-sm" style={{ color: 'var(--color-primary)' }}>
                        {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {!gamer && (
              <Card className="profile-tab-card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>My Learning</h2>
                <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {enrolledCount} enrolled, {completedCount} completed.
                </p>
              </Card>
            )}
          </div>
        )}

      </div>
    </div>
  );
};