import React, { useState, useEffect } from 'react';
import Header from './components/Compulsory/Header';
import CompulsoryBanner from './components/Compulsory/CompulsoryBanner';
import Sidebar from './components/Compulsory/Sidebar';
import Footer from './components/Compulsory/Footer';
import ProfileHeader from './components/Profile/ProfileHeader';
import ProfileTabs from './components/Profile/ProfileTabs';
import { makeGuest } from './utils/auth';
import styles from './styles/profile.module.css';

const Profile = () => {
   const [loggedUser, setLoggedUser] = useState(makeGuest());
   const [profileData, setProfileData] = useState(null);
   const [loading, setLoading] = useState(true);
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
         alert('Please log in to view profile');
         window.location.href = '/login';
         return;
      }

      setLoggedUser(user);
   }, []);

   // Load profile data from backend + merge with full data from JSON
   useEffect(() => {
      if (!loggedUser || !loggedUser.token || loggedUser.role === 'guest') return;

      const loadProfile = async () => {
         setLoading(true);
         try {
            // Fetch profile from backend
            const res = await fetch(
               `http://127.0.0.1:5000/api/${loggedUser.role}/${loggedUser.username}`,
               {
                  headers: { Authorization: `Bearer ${loggedUser.token}` }
               }
            );

            if (!res.ok) throw new Error('Failed to load profile');
            const json = await res.json();

            // Fetch full user data to get ID, joinDate, tasks, etc.
            let fullUserData = {};
            const roleEndpoint = loggedUser.role === 'student' ? 'students' : `${loggedUser.role}s`;
            const fullRes = await fetch(`http://127.0.0.1:5000/api/${roleEndpoint}`, {
               headers: { Authorization: `Bearer ${loggedUser.token}` }
            });

            if (fullRes.ok) {
               const fullJson = await fullRes.json();
               const allUsers = Array.isArray(fullJson.data) ? fullJson.data : Object.values(fullJson.data);
               fullUserData = allUsers.find(u => u.username === loggedUser.username) || {};
            }

            // Merge data
            const fullData = {
               ...json.data,
               studentId: fullUserData.studentId || null,
               lecturerId: fullUserData.lecturerId || null,
               adminId: fullUserData.adminId || null,
               joinDate: fullUserData.joinDate || null,
               courses: fullUserData.courses || [],
               tasks: fullUserData.tasks || [],
               homeworkSubmissions: fullUserData.homeworkSubmissions || []
            };

            setProfileData(fullData);
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
            <p>Loading profile...</p>
         </div>
      );
   }

   return (
      <div className="container">
         <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
         <Sidebar
            isOpen={sidebarOpen}
            loggedUser={loggedUser}
            closeSidebar={() => setSidebarOpen(false)}
         />

         <CompulsoryBanner />

         <div className={styles.profileWrapper}>
            {profileData && (
               <>
                  <ProfileHeader
                     loggedUser={loggedUser}
                     profileData={profileData}
                  />

                  <ProfileTabs
                     loggedUser={loggedUser}
                     profileData={profileData}
                  />
               </>
            )}
         </div>

         <Footer />
      </div>
   );
};

export default Profile;