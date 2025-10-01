import React, { useState, useEffect } from 'react';
import Header from './components/Compulsory/Header';
import Footer from './components/Compulsory/Footer';
import CompulsoryBanner from './components/Compulsory/CompulsoryBanner';
import SettingsForm from './components/Settings/SettingsForm';
import ForgotPasswordModal from './components/Settings/ForgotPasswordModal';
import { makeGuest } from './utils/auth';
import styles from './styles/settings.module.css';

const Settings = () => {
  const [loggedUser, setLoggedUser] = useState(makeGuest());
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Check authentication
  useEffect(() => {
    const stored = localStorage.getItem('loggedUser');
    let user;
    try {
      user = stored ? JSON.parse(stored) : makeGuest();
    } catch (e) {
      user = makeGuest();
    }

    if (!user || !user.token || user.role === 'guest') {
      alert('Please log in to access settings');
      window.location.href = '/login';
      return;
    }

    setLoggedUser(user);
  }, []);

  // Load profile data
  useEffect(() => {
    if (!loggedUser || !loggedUser.token || loggedUser.role === 'guest') return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/api/${loggedUser.role}/${loggedUser.username}`,
          {
            headers: { Authorization: `Bearer ${loggedUser.token}` }
          }
        );

        if (!res.ok) throw new Error('Failed to load profile');
        const json = await res.json();
        setProfileData(json.data);
      } catch (err) {
        console.error('Error loading profile:', err);
        alert('Error loading profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [loggedUser]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={styles.settingsWrapper}>
        <CompulsoryBanner />
        
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Welcome, {loggedUser.title || ''} {profileData?.firstName} {profileData?.lastName}!
          </h1>
          <p className={styles.welcomeSubtitle}>
            {loggedUser.role.charAt(0).toUpperCase() + loggedUser.role.slice(1)} Account Settings
          </p>
        </div>

        <div className={styles.settingsContainer}>
          <h2 className={styles.settingsTitle}>Account Settings</h2>

          {profileData && (
            <SettingsForm
              loggedUser={loggedUser}
              profileData={profileData}
              onProfileUpdate={(updatedData) => setProfileData(updatedData)}
            />
          )}

          <div className={styles.passwordSection}>
            <h3>Password Management</h3>
            <p>Your current password is hidden for security reasons.</p>
            <button
              className={styles.forgotPasswordBtn}
              onClick={() => setShowForgotPassword(true)}
            >
              Request Password Change
            </button>
          </div>
        </div>
      </div>

      <Footer />

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default Settings;