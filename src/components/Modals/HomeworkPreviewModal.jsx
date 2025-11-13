import React, { useState } from 'react';
import styles from '../../styles/homeworkpreviewmodal.module.css';

const BACKENDURL = "http://127.0.0.1:5000";

const HomeworkPreviewModal = ({ isOpen, onClose, homework, loggedUser, courseId, onDelete, onEdit }) => {
   const [deleting, setDeleting] = useState(false);

   if (!isOpen || !homework) return null;

   const isLecturer = loggedUser.role === 'lecturer' || loggedUser.role === 'admin';
   const isStudent = loggedUser.role === 'student';

   const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         month: 'long',
         day: 'numeric',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
         hour12: true
      });
   };

   const getStatusBadge = () => {
      if (!homework.dueDate) return null;
      
      const now = new Date();
      const dueDate = new Date(homework.dueDate);
      const isOverdue = now > dueDate;
      
      if (isStudent) {
         const mySubmission = homework.submissions?.find(
            sub => sub.studentUsername === loggedUser.username
         );
         
         if (mySubmission?.submittedAt) {
            return (
               <span className={`${styles.badge} ${styles.badgeSubmitted}`}>
                  ✅ Submitted
               </span>
            );
         }
         
         if (isOverdue) {
            return (
               <span className={`${styles.badge} ${styles.badgeOverdue}`}>
                  ⚠️ Overdue
               </span>
            );
         }
         
         return (
            <span className={`${styles.badge} ${styles.badgePending}`}>
               📝 Pending
            </span>
         );
      }
      
      return null;
   };

   const getSubmissionStats = () => {
      if (!isLecturer || !homework.submissions) return null;
      
      const total = homework.submissions.length;
      const submitted = homework.submissions.filter(s => s.submittedAt).length;
      const percentage = total > 0 ? Math.round((submitted / total) * 100) : 0;
      
      return { total, submitted, percentage };
   };

   const handleDelete = async () => {
      if (!window.confirm(`Are you sure you want to delete homework "${homework.title}"? This will delete all student submissions!`)) return;

      setDeleting(true);
      try {
         const res = await fetch(`${BACKENDURL}/api/homework/delete`, {
            method: 'DELETE',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${loggedUser.token}`
            },
            body: JSON.stringify({
               courseId: courseId,
               homeworkId: homework.id
            })
         });

         const data = await res.json();
         if (data.success) {
            alert('✅ Homework deleted successfully!');
            if (onDelete) onDelete();
            onClose();
         } else {
            alert(data.message || 'Delete failed');
         }
      } catch (err) {
         console.error('Delete error:', err);
         alert('Error deleting homework');
      } finally {
         setDeleting(false);
      }
   };

   const getMySubmission = () => {
      if (!isStudent || !homework.submissions) return null;
      return homework.submissions.find(
         sub => sub.studentUsername === loggedUser.username
      );
   };

   const submissionStats = getSubmissionStats();
   const mySubmission = getMySubmission();

   return (
      <div className={styles.modalOverlay} onClick={onClose}>
         <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
               <div className={styles.headerLeft}>
                  <div className={styles.homeworkIcon}>📚</div>
                  <div>
                     <h2 className={styles.homeworkTitle}>{homework.title}</h2>
                     {getStatusBadge()}
                  </div>
               </div>
               <button onClick={onClose} className={styles.closeBtn}>✕</button>
            </div>

            {/* Description */}
            <div className={styles.descriptionSection}>
               <h3 className={styles.sectionTitle}>📝 Description</h3>
               <p className={styles.description}>
                  {homework.description || 'No description provided'}
               </p>
            </div>

            {/* Due Date & Created Info */}
            <div className={styles.infoSection}>
               <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                     <span className={styles.infoLabel}>⏰ Due Date:</span>
                     <span className={styles.infoValue}>{formatDate(homework.dueDate)}</span>
                  </div>
                  {homework.createdAt && (
                     <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>📅 Created:</span>
                        <span className={styles.infoValue}>{formatDate(homework.createdAt)}</span>
                     </div>
                  )}
                  {homework.createdBy && (
                     <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>👤 Created By:</span>
                        <span className={styles.infoValue}>{homework.createdBy}</span>
                     </div>
                  )}
                  {homework.maxFileSize && (
                     <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>💾 Max File Size:</span>
                        <span className={styles.infoValue}>{homework.maxFileSize} MB</span>
                     </div>
                  )}
               </div>
            </div>

            {/* File Requirements */}
            {homework.allowedFileTypes && (
               <div className={styles.requirementsSection}>
                  <h3 className={styles.sectionTitle}>📎 Allowed File Types</h3>
                  <div className={styles.fileTypes}>
                     {homework.allowedFileTypes.split(',').map((type, idx) => (
                        <span key={idx} className={styles.fileTypeBadge}>
                           {type.trim()}
                        </span>
                     ))}
                  </div>
               </div>
            )}

            {/* Student Submission Info */}
            {isStudent && mySubmission && (
               <div className={styles.submissionSection}>
                  <h3 className={styles.sectionTitle}>📤 Your Submission</h3>
                  <div className={styles.submissionInfo}>
                     {mySubmission.submittedAt ? (
                        <>
                           <div className={styles.submissionDetail}>
                              <span className={styles.detailLabel}>📁 File:</span>
                              <span className={styles.detailValue}>{mySubmission.filename || 'N/A'}</span>
                           </div>
                           <div className={styles.submissionDetail}>
                              <span className={styles.detailLabel}>⏱️ Submitted:</span>
                              <span className={styles.detailValue}>{formatDate(mySubmission.submittedAt)}</span>
                           </div>
                           {mySubmission.isLate && (
                              <div className={styles.lateNotice}>
                                 ⚠️ This submission was submitted late
                              </div>
                           )}
                           {mySubmission.comment && (
                              <div className={styles.submissionDetail}>
                                 <span className={styles.detailLabel}>💬 Comment:</span>
                                 <span className={styles.detailValue}>{mySubmission.comment}</span>
                              </div>
                           )}
                           {mySubmission.grade !== null && mySubmission.grade !== undefined && (
                              <div className={styles.gradeSection}>
                                 <span className={styles.gradeLabel}>📊 Grade:</span>
                                 <span className={styles.gradeValue}>{mySubmission.grade}</span>
                              </div>
                           )}
                           {mySubmission.feedback && (
                              <div className={styles.feedbackSection}>
                                 <span className={styles.feedbackLabel}>💭 Feedback:</span>
                                 <p className={styles.feedbackText}>{mySubmission.feedback}</p>
                              </div>
                           )}
                        </>
                     ) : (
                        <p className={styles.notSubmitted}>
                           ❌ You haven't submitted this homework yet
                        </p>
                     )}
                  </div>
               </div>
            )}

            {/* Lecturer Submission Stats */}
            {isLecturer && submissionStats && (
               <div className={styles.statsSection}>
                  <h3 className={styles.sectionTitle}>📊 Submission Statistics</h3>
                  <div className={styles.statsGrid}>
                     <div className={styles.statCard}>
                        <div className={styles.statValue}>{submissionStats.submitted}</div>
                        <div className={styles.statLabel}>Submitted</div>
                     </div>
                     <div className={styles.statCard}>
                        <div className={styles.statValue}>{submissionStats.total - submissionStats.submitted}</div>
                        <div className={styles.statLabel}>Pending</div>
                     </div>
                     <div className={styles.statCard}>
                        <div className={styles.statValue}>{submissionStats.percentage}%</div>
                        <div className={styles.statLabel}>Completion</div>
                     </div>
                  </div>
                  <div className={styles.progressBar}>
                     <div 
                        className={styles.progressFill}
                        style={{ width: `${submissionStats.percentage}%` }}
                     />
                  </div>
               </div>
            )}

            {/* Actions */}
            <div className={styles.modalActions}>
               <button onClick={onClose} className={styles.cancelBtn}>
                  Close
               </button>
               {isLecturer && (
                  <>
                     {onEdit && (
                        <button onClick={() => { onEdit(); onClose(); }} className={styles.editBtn}>
                           ✏️ Edit
                        </button>
                     )}
                     <button 
                        onClick={handleDelete} 
                        className={styles.deleteBtn}
                        disabled={deleting}
                     >
                        {deleting ? '⏳ Deleting...' : '🗑️ Delete'}
                     </button>
                  </>
               )}
            </div>
         </div>
      </div>
   );
};

export default HomeworkPreviewModal;