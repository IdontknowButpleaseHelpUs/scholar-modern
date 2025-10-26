import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/sidebar.module.css";

const Sidebar = ({ isOpen, loggedUser, closeSidebar }) => {
   const navigate = useNavigate();
   const [coursesExpanded, setCoursesExpanded] = useState(false);
   const [userCourses, setUserCourses] = useState([]);

   // Fetch user's enrolled courses
   useEffect(() => {
      if (loggedUser.role === 'student' || loggedUser.role === 'lecturer') {
         fetchUserCourses();
      }
   }, [loggedUser]);

   const fetchUserCourses = async () => {
      try {
         const res = await fetch('https://scholar-modern.onrender.com/api/courses', {
            headers: {
               'Authorization': `Bearer ${loggedUser.token}`
            }
         });

         if (!res.ok) return;
         const data = await res.json();
         let allCourses = Array.isArray(data.data) ? data.data : [];

         // Filter courses based on role
         if (loggedUser.role === 'student') {
            allCourses = allCourses.filter(course =>
               (loggedUser.courses || []).includes(course.courseid)
            );
         } else if (loggedUser.role === 'lecturer') {
            allCourses = allCourses.filter(course =>
               (loggedUser.courses || []).includes(course.courseid)
            );
         }

         setUserCourses(allCourses);
      } catch (err) {
         console.error('Error fetching courses:', err);
      }
   };

   const handleNavigate = (path) => {
      navigate(path);
      closeSidebar();
   };

   const handleCourseClick = (courseId, courseName) => {
      const encodedId = encodeURIComponent(courseId);
      navigate(`/course/view?id=${encodedId}`);
      closeSidebar();
   };

   const toggleCoursesExpand = () => {
      setCoursesExpanded(!coursesExpanded);
   };

   return (
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
         <div className={styles.sidebarClose} onClick={closeSidebar}>
            <div className={styles.sidebarCloseLine}></div>
         </div>

         {loggedUser.role !== "guest" ? (
            <nav className={styles.sidebarNav}>
               <ul className={styles.sidebarUl}>
                  {/* Home */}
                  <li 
                     className={styles.sidebarLi}
                     onClick={() => handleNavigate('/')}
                  >
                     <span className={styles.navIcon}>🏠</span>
                     <span className={styles.navText}>Home</span>
                  </li>

                  {/* Dashboard */}
                  <li 
                     className={styles.sidebarLi}
                     onClick={() => handleNavigate('/dashboard')}
                  >
                     <span className={styles.navIcon}>📊</span>
                     <span className={styles.navText}>Dashboard</span>
                  </li>

                  {/* Calendar */}
                  <li 
                     className={styles.sidebarLi}
                     onClick={() => handleNavigate('/profile?tab=calendar')}
                  >
                     <span className={styles.navIcon}>📅</span>
                     <span className={styles.navText}>Calendar</span>
                  </li>

                  {/* Private Files */}
                  <li 
                     className={styles.sidebarLi}
                     onClick={() => handleNavigate('/profile?tab=files')}
                  >
                     <span className={styles.navIcon}>📁</span>
                     <span className={styles.navText}>Private Files</span>
                  </li>

                  {/* My Courses - Expandable */}
                  {(loggedUser.role === 'student' || loggedUser.role === 'lecturer') && (
                     <>
                        <li 
                           className={`${styles.sidebarLi} ${styles.expandable}`}
                           onClick={toggleCoursesExpand}
                        >
                           <span className={styles.navIcon}>📚</span>
                           <span className={styles.navText}>My Courses</span>
                           <span className={`${styles.expandIcon} ${coursesExpanded ? styles.expanded : ''}`}>
                              ▶
                           </span>
                        </li>

                        {/* Course Subtree */}
                        {coursesExpanded && (
                           <ul className={styles.courseSubtree}>
                              {userCourses.length > 0 ? (
                                 userCourses.map((course, idx) => (
                                    <li 
                                       key={idx}
                                       className={styles.courseItem}
                                       onClick={() => handleCourseClick(course.courseid, course.title)}
                                    >
                                       <span className={styles.courseIcon}>📖</span>
                                       <span className={styles.courseText}>
                                          {course.title || course.courseid}
                                       </span>
                                    </li>
                                 ))
                              ) : (
                                 <li className={styles.noCourses}>
                                    No courses enrolled
                                 </li>
                              )}
                           </ul>
                        )}
                     </>
                  )}

                  {/* Admin doesn't have courses, show admin panel instead */}
                  {loggedUser.role === 'admin' && (
                     <li 
                        className={styles.sidebarLi}
                        onClick={() => handleNavigate('/dashboard')}
                     >
                        <span className={styles.navIcon}>⚙️</span>
                        <span className={styles.navText}>Admin Panel</span>
                     </li>
                  )}
               </ul>
            </nav>
         ) : (
            <div className={styles.sidebarGuest}>
               <h2 className={styles.sidebarH2}>Log in to view content</h2>
            </div>
         )}
      </div>
   );
};

export default Sidebar;