import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Compulsory/Header';
import Sidebar from './components/Compulsory/Sidebar';
import Footer from './components/Compulsory/Footer';
import ProfileHeader from './components/Profile/ProfileHeader';
import ProfileTabs from './components/Profile/ProfileTabs';
import { makeGuest } from './utils/auth';
import styles from './styles/profile.module.css';
import CompulsoryBanner from './components/Compulsory/CompulsoryBanner';

const BACKENDURL = "http://127.0.0.1:5000/api";
const BACKENDHOST = "https://scholar-modern.onrender.com/api";

const Profile = () => {
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [loggedUser, setLoggedUser] = useState(makeGuest());
   const [profileData, setProfileData] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const navigate = useNavigate();

   const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
   const closeSidebar = () => setSidebarOpen(false);

   // Check if user is logged in
   useEffect(() => {
      const stored = localStorage.getItem("loggedUser");
      if (!stored) {
         console.log("No user found, redirecting to login");
         navigate("/login");
         return;
      }

      try {
         const user = JSON.parse(stored);
         if (!user.token || user.role === "guest") {
            console.log("Guest or no token, redirecting to login");
            navigate("/login");
            return;
         }
         setLoggedUser(user);
      } catch (e) {
         console.error("Error parsing user data:", e);
         navigate("/login");
      }
   }, [navigate]);

   // Fetch full profile data from backend
   useEffect(() => {
      if (!loggedUser.username || loggedUser.role === "guest") return;

      const fetchProfile = async () => {
         setLoading(true);
         setError(null);

         try {
            console.log(`Fetching profile for ${loggedUser.role}/${loggedUser.username}`);
            
            const res = await fetch(
               `${BACKENDURL}/${loggedUser.role}/${loggedUser.username}`,
               {
                  headers: {
                     "Authorization": `Bearer ${loggedUser.token}`,
                     "Content-Type": "application/json"
                  }
               }
            );

            console.log("Profile fetch response status:", res.status);

            if (!res.ok) {
               if (res.status === 401 || res.status === 403) {
                  console.log("Auth failed, redirecting to login");
                  localStorage.removeItem("loggedUser");
                  navigate("/login");
                  return;
               }
               throw new Error(`Failed to fetch profile: ${res.status}`);
            }

            const data = await res.json();
            console.log("Profile data received:", data);

            if (data.success) {
               // Merge the fetched profile data with the loggedUser data
               const fullProfile = {
                  ...data.data,
                  courses: loggedUser.courses || [],
                  tasks: data.data.tasks || [],
                  homeworkSubmissions: data.data.homeworkSubmissions || [],
                  personalFiles: data.data.personalFiles || [],
                  timetable: data.data.timetable || []
               };
               
               setProfileData(fullProfile);
               console.log("Profile loaded successfully:", fullProfile);
            } else {
               throw new Error(data.message || "Failed to load profile");
            }
         } catch (err) {
            console.error("Error fetching profile:", err);
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };

      fetchProfile();
   }, [loggedUser.username, loggedUser.role, loggedUser.token, navigate]);

   if (loading) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading profile...</p>
         </div>
      );
   }

   if (error) {
      return (
         <div className={styles.errorContainer}>
            <h2>Error Loading Profile</h2>
            <p>{error}</p>
            <button onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
         </div>
      );
   }

   if (!profileData) {
      return (
         <div className={styles.errorContainer}>
            <h2>Profile Not Found</h2>
            <button onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
         </div>
      );
   }

   return (
      <div className={styles.profilePage}>
         <CompulsoryBanner />
         <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
         <Sidebar 
            isOpen={sidebarOpen} 
            loggedUser={loggedUser} 
            closeSidebar={closeSidebar} 
         />

         <div className={styles.profileContainer}>
            <ProfileHeader 
               loggedUser={loggedUser} 
               profileData={profileData} 
            />
            <ProfileTabs 
               loggedUser={loggedUser} 
               profileData={profileData} 
            />
         </div>

         <Footer />
      </div>
   );
};

export default Profile;