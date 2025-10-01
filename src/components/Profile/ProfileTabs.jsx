import React, { useState } from 'react';
import ProfileDashboard from './ProfileDashboard';
import ProfileCourses from './ProfileCourses';
import ProfileTodoList from './ProfileTodoList';
import ProfileSchedule from './ProfileSchedule';
import ProfileFiles from './ProfileFiles';
import styles from '../../styles/profiletabs.module.css';

const ProfileTabs = ({ loggedUser, profileData }) => {
   const [activeTab, setActiveTab] = useState('dashboard');

   const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'courses', label: 'Courses', icon: '📚' },
      { id: 'todo', label: 'To-Do List', icon: '✓' },
      { id: 'schedule', label: 'Schedule', icon: '📅' },
      { id: 'files', label: 'Files Storage', icon: '📁' }
   ];

   const renderTabContent = () => {
      switch (activeTab) {
         case 'dashboard':
            return <ProfileDashboard loggedUser={loggedUser} profileData={profileData} />;
         case 'courses':
            return <ProfileCourses loggedUser={loggedUser} profileData={profileData} />;
         case 'todo':
            return <ProfileTodoList loggedUser={loggedUser} profileData={profileData} />;
         case 'schedule':
            return <ProfileSchedule loggedUser={loggedUser} profileData={profileData} />;
         case 'files':
            return <ProfileFiles loggedUser={loggedUser} profileData={profileData} />;
         default:
            return <ProfileDashboard loggedUser={loggedUser} profileData={profileData} />;
      }
   };

   return (
      <div className={styles.tabsContainer}>
         {/* Tab Navigation */}
         <div className={styles.tabNavigation}>
            {tabs.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
               >
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  <span className={styles.tabLabel}>{tab.label}</span>
               </button>
            ))}
         </div>

         {/* Tab Content */}
         <div className={styles.tabContent}>
            {renderTabContent()}
         </div>
      </div>
   );
};

export default ProfileTabs;