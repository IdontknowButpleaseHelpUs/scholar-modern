import React, { useState, useEffect } from 'react';
import Header from './components/Compulsory/Header';
import Sidebar from './components/Compulsory/Sidebar';
import Footer from './components/Compulsory/Footer';
import CompulsoryBanner from './components/Compulsory/CompulsoryBanner';
import CancelClassModal from './components/Modals/CancelClassModal';
import HomeworkSubmissionModal from './components/Modals/HomeworkSubmissionModal';
import HomeworkManagementModal from './components/Modals/HomeworkManagementModal';
import UploadFileModal from './components/Modals/UploadFileModal';
import CourseFilesModal from './components/Modals/CourseFilesModal';
import HomeworkPreviewModal from './components/Modals/HomeworkPreviewModal';
import FilePreviewModal from './components/Modals/FilePreviewModal';
import { makeGuest } from './utils/auth';
import styles from './styles/courseview.module.css';

const BACKENDURL = "http://127.0.0.1:5000/api";
const BACKENDHOST = "https://scholar-modern.onrender.com/api";

const CourseView = () => {
   const [loggedUser, setLoggedUser] = useState(null);
   const [course, setCourse] = useState(null);
   const [members, setMembers] = useState({ lecturers: [], asstProf: [], students: [] });
   const [loading, setLoading] = useState(true);
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [showCancelModal, setShowCancelModal] = useState(false);
   const [showHomeworkModal, setShowHomeworkModal] = useState(false);
   const [selectedHomework, setSelectedHomework] = useState(null);
   const [showHomeworkManagementModal, setShowHomeworkManagementModal] = useState(false);
   const [selectedHomeworkForEdit, setSelectedHomeworkForEdit] = useState(null);
   const [showFilesModal, setShowFilesModal] = useState(false);
   const [showUploadFileModal, setShowUploadFileModal] = useState(false);
   
   // NEW: States for preview modals
   const [showHomeworkPreview, setShowHomeworkPreview] = useState(false);
   const [selectedHomeworkPreview, setSelectedHomeworkPreview] = useState(null);
   const [showFilePreview, setShowFilePreview] = useState(false);
   const [selectedFilePreview, setSelectedFilePreview] = useState(null);

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

      if (!user || !user.role) {
         user = makeGuest();
         localStorage.setItem('loggedUser', JSON.stringify(user));
      }

      setLoggedUser(user);
      console.log('User set:', user); 
   }, []);

   useEffect(() => {
      if (!loggedUser) {
         console.log('Waiting for user to be set...');
         return;
      }

      const courseId = getCourseIdFromUrl();
      if (!courseId) {
         alert('No course ID provided!');
         window.location.href = '/';
         return;
      }

      console.log('Fetching course as:', loggedUser.role); 
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
            const res = await fetch(`${BACKENDURL}/${role}/${username}`, {
               headers: { 'Authorization': `Bearer ${loggedUser.token}` }
            });

            if (!res.ok) return null;
            const data = await res.json();
            return {
               username,
               firstName: data.data?.firstName || '',
               lastName: data.data?.lastName || '',
               title: data.data?.title || '',
               profilePic: `../backend/${data.data?.profilePic}` || data.data?.profilePic || '../assets/user.png'
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

   // NEW: Handler for homework preview (info button)
   const handleHomeworkPreviewClick = (homework) => {
      setSelectedHomeworkPreview(homework);
      setShowHomeworkPreview(true);
   };

   // Handler for homework submission
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

   // NEW: Handler for file preview
   const handleFilePreviewClick = (file) => {
      setSelectedFilePreview(file);
      setShowFilePreview(true);
   };

   // Move fetchCourse outside useEffect so we can call it from handlers
   const fetchCourse = async () => {
      setLoading(true);
      try {
         const res = await fetch(`${BACKENDURL}/courses`, {
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

   const getFileIcon = (filename) => {
      if (!filename) return '📄';
      const ext = filename.split('.').pop().toLowerCase();
      const iconMap = {
         'pdf': '📕', 'doc': '📘', 'docx': '📘',
         'xls': '📗', 'xlsx': '📗', 'ppt': '📙', 'pptx': '📙',
         'zip': '📦', 'rar': '📦',
         'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️',
         'txt': '📝', 'mp4': '🎥', 'mp3': '🎵'
      };
      return iconMap[ext] || '📄';
   };

   const formatFileSize = (bytes) => {
      if (!bytes) return 'N/A';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
   };

   const handleDownloadFile = (file) => {
      const BACKENDURL = "http://127.0.0.1:5000";
      const link = document.createElement('a');
      link.href = `${BACKENDURL}${file.filePath}`;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleDeleteFile = async (fileId) => {
      if (!window.confirm('Are you sure you want to delete this file?')) return;

      const BACKENDURL = "http://127.0.0.1:5000";
      try {
         const res = await fetch(`${BACKENDURL}/api/courses/${course.courseid}/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${loggedUser.token}` }
         });

         const data = await res.json();
         if (data.success) {
            alert('File deleted successfully!');
            fetchCourse(); // Refresh
         } else {
            alert(data.message || 'Delete failed');
         }
      } catch (err) {
         console.error('Delete error:', err);
         alert('Error deleting file');
      }
   };

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
               <div className={styles.homeworkSection}>
                  <div className={styles.homeworkHeader}>
                     <h3>📂 Homeworks</h3>
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
                                    <span 
                                       className={styles.homeworkTitle}
                                       onClick={() => handleHomeworkPreviewClick(hw)}
                                       style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                       {hw.title}
                                    </span>
                                    &nbsp;
                                    <span className={styles.homeworkDue}>
                                       Due: {new Date(hw.dueDate).toLocaleDateString()}
                                    </span>
                                    {isSubmitted && (
                                       <span className={styles.submittedBadge}>✓ Submitted</span>
                                    )}
                                 </div>
                                 <div className={styles.homeworkActions}>
                                    {/* NEW: Info button for everyone */}
                                    <button
                                       onClick={() => handleHomeworkPreviewClick(hw)}
                                       className={styles.infoBtn}
                                       title="View details"
                                    >
                                       ℹ️ Info
                                    </button>
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
                  
                  {/* Files Section */}
                  <div className={styles.filesSection}>
                     <div className={styles.filesHeader}>
                        <h3>📁 Course Files</h3>
                        {isLecturerOfCourse() && (
                           <button
                              onClick={() => setShowUploadFileModal(true)}
                              className={styles.addHomeworkBtn}
                           >
                              ⬆️ Upload File
                           </button>
                        )}
                     </div>
                     <ul className={styles.homeworkList}>
                        {course.files && course.files.length > 0 ? (
                           course.files.map((file, idx) => (
                              <li key={idx}>
                                 <div className={styles.homeworkInfo}>
                                    <span 
                                       className={styles.homeworkTitle}
                                       onClick={() => handleFilePreviewClick(file)}
                                       style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                       {getFileIcon(file.filename)} {file.filename}
                                    </span>
                                    &nbsp;
                                    <span className={styles.homeworkDue}>
                                       {formatFileSize(file.fileSize)} • {file.uploadedBy}
                                    </span>
                                 </div>
                                 <div className={styles.homeworkActions}>
                                    {/* NEW: Info button for files */}
                                    <button
                                       onClick={() => handleFilePreviewClick(file)}
                                       className={styles.infoBtn}
                                       title="View details"
                                    >
                                       ℹ️ Info
                                    </button>
                                    <button
                                       onClick={() => handleDownloadFile(file)}
                                       className={styles.submitBtn}
                                    >
                                       📥 Download
                                    </button>
                                    {isLecturerOfCourse() && (
                                       <button
                                          onClick={() => handleDeleteFile(file.id)}
                                          className={styles.manageBtn}
                                       >
                                          🗑️ Delete
                                       </button>
                                    )}
                                 </div>
                              </li>
                           ))
                        ) : (
                           <li>
                              {isLecturerOfCourse()
                                 ? 'No files yet. Click "Upload File" to add course materials.'
                                 : 'No files uploaded yet'}
                           </li>
                        )}
                     </ul>
                  </div>
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
                                       : `${BACKENDURL}/${member.profilePic}`
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
                                       : `${BACKENDURL}/${member.profilePic}`
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
                                       : `${BACKENDURL}/${member.profilePic}`
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

         {showHomeworkModal && (
            <HomeworkSubmissionModal
               isOpen={showHomeworkModal}
               onClose={() => {
                  setShowHomeworkModal(false);
                  setSelectedHomework(null);
               }}
               homework={selectedHomework}
               courseId={course.courseid}
               loggedUser={loggedUser}
               onSubmitSuccess={handleHomeworkManagementSuccess}
            />
         )}

         {showFilesModal && (
            <CourseFilesModal
               isOpen={showFilesModal}
               onClose={() => setShowFilesModal(false)}
               course={course}
               loggedUser={loggedUser}
               onSuccess={handleHomeworkManagementSuccess}
            />
         )}

         {showUploadFileModal && (
            <UploadFileModal
               isOpen={showUploadFileModal}
               onClose={() => setShowUploadFileModal(false)}
               courseId={course.courseid}
               loggedUser={loggedUser}
               onSuccess={handleHomeworkManagementSuccess}
            />
         )}

         {/* Homework Preview Modal */}
         {showHomeworkPreview && (
            <HomeworkPreviewModal
               isOpen={showHomeworkPreview}
               onClose={() => {
                  setShowHomeworkPreview(false);
                  setSelectedHomeworkPreview(null);
               }}
               homework={selectedHomeworkPreview}
               loggedUser={loggedUser}
               courseId={course.courseid}
               onDelete={() => {
                  setShowHomeworkPreview(false);
                  fetchCourse();
               }}
               onEdit={() => {
                  setShowHomeworkPreview(false);
                  handleEditHomework(selectedHomeworkPreview);
               }}
            />
         )}

         {/* File Preview Modal */}
         {showFilePreview && (
            <FilePreviewModal
               isOpen={showFilePreview}
               onClose={() => {
                  setShowFilePreview(false);
                  setSelectedFilePreview(null);
               }}
               file={selectedFilePreview}
               loggedUser={loggedUser}
               courseId={course.courseid}
               onDelete={() => {
                  setShowFilePreview(false);
                  fetchCourse();
               }}
            />
         )}
      </div>
   );
};

export default CourseView;