import React, { useState, useEffect } from 'react';
import styles from '../../styles/profilecourses.module.css';

const ProfileCourses = ({ loggedUser, profileData }) => {
   const [courses, setCourses] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchCoursesWithHomework();
   }, [loggedUser]);

   const fetchCoursesWithHomework = async () => {
      setLoading(true);
      try {
         const res = await fetch('https://scholar-modern.onrender.comapi/courses', {
            headers: { Authorization: `Bearer ${loggedUser.token}` }
         });

         if (!res.ok) throw new Error('Failed to fetch courses');
         const data = await res.json();
         let allCourses = Array.isArray(data.data) ? data.data : [];

         // Filter courses based on role
         if (loggedUser.role === 'student') {
            allCourses = allCourses.filter(course =>
               (profileData.courses || []).includes(course.courseid)
            );

            // Add homework info for students
            allCourses = allCourses.map(course => {
               const courseHomework = (course.homework || []).filter(hw => {
                  const submission = hw.submissions?.find(s => s.studentUsername === loggedUser.username);
                  return submission && !submission.submittedAt;
               });
               return { ...course, pendingHomework: courseHomework };
            });
         } else if (loggedUser.role === 'lecturer') {
            allCourses = allCourses.filter(course =>
               (profileData.courses || []).includes(course.courseid)
            );
         }

         setCourses(allCourses);
      } catch (err) {
         console.error('Error fetching courses:', err);
         setCourses([]);
      } finally {
         setLoading(false);
      }
   };

   const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric'
      });
   };

   if (loading) {
      return <div className={styles.loading}>Loading courses...</div>;
   }

   if (courses.length === 0) {
      return (
         <div className={styles.emptyState}>
            <p>📚 No courses assigned yet.</p>
         </div>
      );
   }

   return (
      <div className={styles.coursesContainer}>
         <h2 className={styles.sectionTitle}>
            {loggedUser.role === 'student' ? 'My Courses' : 'Teaching Courses'}
         </h2>

         <div className={styles.coursesList}>
            {courses.map((course, idx) => (
               <div key={idx} className={styles.courseCard}>
                  <div className={styles.courseHeader}>
                     <div className={styles.courseTitleSection}>
                        <span className={styles.courseId}>{course.courseid}</span>
                        <h3 className={styles.courseTitle}>{course.title}</h3>
                     </div>
                     <div className={styles.courseCredits}>
                        <span className={styles.creditBadge}>{course.credit} Credits</span>
                     </div>
                  </div>

                  <p className={styles.courseDescription}>{course.description}</p>

                  <div className={styles.courseDetails}>
                     <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Lecturer:</span>
                        <span className={styles.detailValue}>{course.lecturer || 'TBA'}</span>
                     </div>
                     <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Schedule:</span>
                        <span className={styles.detailValue}>{course.schedule || 'TBA'}</span>
                     </div>
                     {loggedUser.role === 'lecturer' && (
                        <div className={styles.detailItem}>
                           <span className={styles.detailLabel}>Students:</span>
                           <span className={styles.detailValue}>
                              {course.members?.students?.length || 0} enrolled
                           </span>
                        </div>
                     )}
                  </div>

                  {/* Pending Homework (Students Only) */}
                  {loggedUser.role === 'student' && course.pendingHomework && course.pendingHomework.length > 0 && (
                     <div className={styles.homeworkSection}>
                        <h4 className={styles.homeworkTitle}>📝 Pending Homework</h4>
                        <div className={styles.homeworkList}>
                           {course.pendingHomework.map((hw, hwIdx) => (
                              <div key={hwIdx} className={styles.homeworkItem}>
                                 <span className={styles.homeworkName}>{hw.title}</span>
                                 <span className={styles.homeworkDue}>Due: {formatDate(hw.dueDate)}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            ))}
         </div>
      </div>
   );
};

export default ProfileCourses;