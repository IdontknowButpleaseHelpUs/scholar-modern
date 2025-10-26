import React, { useState, useEffect } from 'react';
import Header from './components/Compulsory/Header';
import Sidebar from './components/Compulsory/Sidebar';
import Footer from './components/Compulsory/Footer';
import CompulsoryBanner from './components/Compulsory/CompulsoryBanner';
import CancelClassModal from './components/Modals/CancelClassModal';
import HomeworkSubmissionModal from './components/Modals/HomeworkSubmissionModal';
import HomeworkManagementModal from './components/Modals/HomeworkManagementModal';
import { makeGuest } from './utils/auth';
import styles from './styles/courseview.module.css';

const CourseView = () => {
   const [loggedUser, setLoggedUser] = useState(makeGuest());
   const [course, setCourse] = useState(null);
   const [members, setMembers] = useState({ lecturers: [], asstProf: [], students: [] });
   const [loading, setLoading] = useState(true);
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [showCancelModal, setShowCancelModal] = useState(false);
   const [showHomeworkModal, setShowHomeworkModal] = useState(false);
   const [selectedHomework, setSelectedHomework] = useState(null);
   const [showHomeworkManagementModal, setShowHomeworkManagementModal] = useState(false);
   const [selectedHomeworkForEdit, setSelectedHomeworkForEdit] = useState(null);

   const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

   // Get course ID from URL
   const getCourseIdFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const courseParam = params.get('id');
      if (!courseParam) return null;

      // Handle format: "courseId--title=courseName"
      const courseId = courseParam.split('--title=')[0];
      return courseId;
   };

   // Check authentication
   useEffect(() => {
      const stored = localStorage.getItem('loggedUser');
      let user;
      try {
         user = stored ? JSON.parse(stored) : makeGuest();
      } catch (e) {
         user = makeGuest();
      }

      if (!user) {
         alert('Login first!');
         window.location.href = '/login';
         return;
      }

      setLoggedUser(user);
   }, []);

   useEffect(() => {
      if (!loggedUser || loggedUser.role === 'guest') return;

      const courseId = getCourseIdFromUrl();
      if (!courseId) {
         alert('No course ID provided!');
         window.location.href = '/';
         return;
      }

      fetchCourse();
   }, [loggedUser]);

   // Fetch member details
   const fetchMembers = async (courseData) => {
      if (loggedUser.role === 'guest') {
         setMembers({ lecturers: [], asstProf: [], students: [] });
         return;
      }

      try {
         const lecturers = await fetchMemberGroup(courseData.members?.lecturer || [], 'lecturer');
         const asstProf = await fetchMemberGroup(courseData.members?.asstProf || [], 'lecturer');
         const students = await fetchMemberGroup(courseData.members?.students || [], 'student');

         setMembers({ lecturers, asstProf, students });
      } catch (err) {
         console.error('Error fetching members:', err);
      }
   };

   const fetchMemberGroup = async (usernames, role) => {
      if (!usernames || usernames.length === 0) return [];

      const memberPromises = usernames.map(async (username) => {
         try {
            const res = await fetch(`https://scholar-modern.onrender.com/api/${role}/${username}`, {
               headers: { 'Authorization': `Bearer ${loggedUser.token}` }
            });

            if (!res.ok) return null;
            const data = await res.json();
            return {
               username,
               firstName: data.data?.firstName || '',
               lastName: data.data?.lastName || '',
               title: data.data?.title || '',
               profilePic: data.data?.profilePic || '/assets/user.png'
            };
         } catch (err) {
            console.error(`Error fetching ${role} ${username}:`, err);
            return null;
         }
      });

      const results = await Promise.all(memberPromises);
      return results.filter(m => m !== null);
   };

   const handleBack = () => {
      window.location.href = '/';
   };

   const handleHomeworkClick = (homework) => {
      setSelectedHomework(homework);
      setShowHomeworkModal(true);
   };

   const handleAddHomework = () => {
      setSelectedHomeworkForEdit(null);
      setShowHomeworkManagementModal(true);
   };

   const handleEditHomework = (homework) => {
      setSelectedHomeworkForEdit(homework);
      setShowHomeworkManagementModal(true);
   };

   const handleHomeworkManagementSuccess = () => {
      // Refresh course data after homework changes
      const courseId = getCourseIdFromUrl();
      fetchCourse();
   };

   // Move fetchCourse outside useEffect so we can call it from handlers
   const fetchCourse = async () => {
      setLoading(true);
      try {
         const res = await fetch('https://scholar-modern.onrender.com/api/courses', {
            headers: {
               'Authorization': loggedUser.role === 'guest'
                  ? 'guest_token_secret_n0t_real'
                  : `Bearer ${loggedUser.token}`
            }
         });

         if (!res.ok) throw new Error('Failed to fetch courses');
         const data = await res.json();
         const allCourses = Array.isArray(data.data) ? data.data : [];

         const courseId = getCourseIdFromUrl();
         const foundCourse = allCourses.find(c => c.courseid === courseId);
         if (!foundCourse) throw new Error('Course not found!');

         setCourse(foundCourse);
         await fetchMembers(foundCourse);
      } catch (err) {
         console.error('Error fetching course:', err);
         alert('Error loading course');
         window.location.href = '/';
      } finally {
         setLoading(false);
      }
   };

   const isLecturerOfCourse = () => {
      if (loggedUser.role !== 'lecturer') return false;
      return course?.members?.lecturer?.includes(loggedUser.username);
   };

   if (loading) {
      return (
         <div className={styles.loadingContainer}>
            <p>Loading course...</p>
         </div>
      );
   }

   if (!course) return null;

   return (
      <div className="container">
         <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
         <Sidebar
            isOpen={sidebarOpen}
            loggedUser={loggedUser}
            closeSidebar={() => setSidebarOpen(false)}
         />

         <CompulsoryBanner />

         <div className={styles.courseDetailsContainer}>
            {/* Left Section - Course Details */}
            <div className={styles.courseDetailsLeft}>
               <div className={styles.courseHeader}>
                  <h2 className={styles.courseTitle}>{course.title}</h2>
                  {isLecturerOfCourse() && (
                     <button
                        onClick={() => setShowCancelModal(true)}
                        className={styles.cancelClassBtn}
                     >
                        Cancel Class
                     </button>
                  )}
               </div>
               <p className={styles.courseDescription}>{course.description}</p>

               <div className={styles.courseInfo}>
                  <p><b>Course ID:</b> {course.courseid}</p>
                  <p><b>Lecturer:</b> {course.lecturer || 'Unknown'}</p>
                  <p><b>Credits:</b> {course.credit || '-'}</p>
                  <p><b>Schedule:</b> {course.schedule || '-'}</p>
               </div>

               {/* Homework & Files Section */}
               {/* Homework & Files Section */}
               <div className={styles.homeworkSection}>
                  <div className={styles.homeworkHeader}>
                     <h3>Homework & Files</h3>
                     {isLecturerOfCourse() && (
                        <button
                           onClick={handleAddHomework}
                           className={styles.addHomeworkBtn}
                        >
                           ➕ Add Homework
                        </button>
                     )}
                  </div>
                  <ul className={styles.homeworkList}>
                     {loggedUser.role === 'guest' ? (
                        <li>Login to see homework and files</li>
                     ) : course.homework && course.homework.length > 0 ? (
                        course.homework.map((hw, idx) => {
                           // Check if student has submitted
                           const submission = hw.submissions?.find(
                              s => s.studentUsername === loggedUser.username
                           );
                           const isSubmitted = submission?.submittedAt !== null;

                           return (
                              <li key={idx} className={isSubmitted ? styles.submittedHomework : ''}>
                                 <div className={styles.homeworkInfo}>
                                    <span className={styles.homeworkTitle}>{hw.title}</span>
                                    &nbsp;
                                    <span className={styles.homeworkDue}>
                                       Due: {new Date(hw.dueDate).toLocaleDateString() }
                                    </span>
                                    {isSubmitted && (
                                       <span className={styles.submittedBadge}>✓ Submitted</span>
                                    )}
                                 </div>
                                 <div className={styles.homeworkActions}>
                                    {loggedUser.role === 'student' && (
                                       <button
                                          onClick={() => handleHomeworkClick(hw)}
                                          className={styles.submitBtn}
                                       >
                                          {isSubmitted ? '🔄 Resubmit' : '📤 Submit'}
                                       </button>
                                    )}
                                    {loggedUser.role === 'lecturer' && (
                                       <>
                                          <span className={styles.submissionCount}>
                                             {hw.submissions?.filter(s => s.submittedAt).length || 0}/
                                             {hw.submissions?.length || 0} submitted
                                          </span>
                                          <button
                                             onClick={() => handleEditHomework(hw)}
                                             className={styles.manageBtn}
                                          >
                                             ⚙️ Manage
                                          </button>
                                       </>
                                    )}
                                 </div>
                              </li>
                           );
                        })
                     ) : (
                        <li>
                           {isLecturerOfCourse()
                              ? 'No homework yet. Click "Add Homework" to create one.'
                              : 'No homework uploaded yet'}
                        </li>
                     )}
                  </ul>
               </div>
            </div>

            {/* Right Section - Members */}
            <div className={styles.courseMembers}>
               <h3>Members</h3>

               {loggedUser.role === 'guest' ? (
                  <div className={styles.memberGroup}>
                     <p className={styles.memberTitle}>Login to see members</p>
                  </div>
               ) : (
                  <>
                     {/* Lecturers */}
                     {members.lecturers.length > 0 && (
                        <div className={styles.memberGroup}>
                           <p className={styles.memberTitle}>Lecturer</p>
                           {members.lecturers.map((member, idx) => (
                              <div key={idx} className={styles.memberItem}>
                                 <img
                                    src={member.profilePic.startsWith('http')
                                       ? member.profilePic
                                       : `https://scholar-modern.onrender.com/${member.profilePic}`
                                    }
                                    alt={member.firstName}
                                    className={styles.memberPic}
                                    onError={(e) => e.target.src = '/assets/user.png'}
                                 />
                                 <span>
                                    {member.title} {member.firstName} {member.lastName}
                                 </span>
                              </div>
                           ))}
                        </div>
                     )}

                     {/* Assistant Professors */}
                     {members.asstProf.length > 0 && (
                        <div className={styles.memberGroup}>
                           <p className={styles.memberTitle}>Asst. Prof.</p>
                           {members.asstProf.map((member, idx) => (
                              <div key={idx} className={styles.memberItem}>
                                 <img
                                    src={member.profilePic.startsWith('http')
                                       ? member.profilePic
                                       : `https://scholar-modern.onrender.com/${member.profilePic}`
                                    }
                                    alt={member.firstName}
                                    className={styles.memberPic}
                                    onError={(e) => e.target.src = '/assets/user.png'}
                                 />
                                 <span>
                                    {member.title} {member.firstName} {member.lastName}
                                 </span>
                              </div>
                           ))}
                        </div>
                     )}

                     {/* Students */}
                     {members.students.length > 0 && (
                        <div className={styles.memberGroup}>
                           <p className={styles.memberTitle}>Students</p>
                           {members.students.map((member, idx) => (
                              <div key={idx} className={styles.memberItem}>
                                 <img
                                    src={member.profilePic.startsWith('http')
                                       ? member.profilePic
                                       : `https://scholar-modern.onrender.com/${member.profilePic}`
                                    }
                                    alt={member.firstName}
                                    className={styles.memberPic}
                                    onError={(e) => e.target.src = '/assets/user.png'}
                                 />
                                 <span>
                                    {member.firstName} {member.lastName}
                                 </span>
                              </div>
                           ))}
                        </div>
                     )}
                  </>
               )}
            </div>
         </div>

         <button onClick={handleBack} className={styles.backButton}>
            Back
         </button>

         <Footer />

         {/* Modals */}
         {showCancelModal && (
            <CancelClassModal
               isOpen={showCancelModal}
               onClose={() => setShowCancelModal(false)}
               course={course}
               students={members.students}
               loggedUser={loggedUser}
            />
         )}

         {showHomeworkManagementModal && (
            <HomeworkManagementModal
               isOpen={showHomeworkManagementModal}
               onClose={() => {
                  setShowHomeworkManagementModal(false);
                  setSelectedHomeworkForEdit(null);
               }}
               courseId={course.courseid}
               loggedUser={loggedUser}
               existingHomework={selectedHomeworkForEdit}
               onSuccess={handleHomeworkManagementSuccess}
            />
         )}
      </div>
   );
};

export default CourseView;