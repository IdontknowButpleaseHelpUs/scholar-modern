import React, { useState } from 'react';
import styles from '../../styles/cancelclassmodal.module.css';

const CancelClassModal = ({ isOpen, onClose, course, students, loggedUser }) => {
   const [formData, setFormData] = useState({
      title: '',
      reason: ''
   });
   const [isSending, setIsSending] = useState(false);

   const handleSubmit = async () => {
      if (!formData.title.trim() || !formData.reason.trim()) {
         alert('Please fill in both title and reason');
         return;
      }

      const confirmCancel = window.confirm(
         `Are you sure you want to cancel the class "${course.title}"?\n\nAll ${students.length} students will be notified via email.`
      );

      if (!confirmCancel) return;

      setIsSending(true);
      
      try {
         // Send email to each student using Formspree (What we used to send for the forgot password also)
         const lecturerName = `${loggedUser.title || ''} ${loggedUser.firstName || ''} ${loggedUser.lastName || ''}`.trim();
         const emailPromises = students.map(student => {
            const formDataToSend = new FormData();
            formDataToSend.append('subject', `Class Cancelled: ${course.title} ID: ${course.courseid}`);
            formDataToSend.append('email', student.email || 'student@example.com');
            formDataToSend.append('message', `
               Title: ${formData.title}
               Reason:
               ${formData.reason}
               Course: ${course.title} (${course.courseid})
               Lecturer: ${lecturerName}
            `);

            return fetch('https://formspree.io/f/myzdwdvq', {
               method: 'POST',
               body: formDataToSend,
               headers: { 'Accept': 'application/json' }
            });
         });

         await Promise.all(emailPromises);

         alert(`Class cancellation notice sent to ${students.length} students successfully!`);
         setFormData({ title: '', reason: '' });
         onClose();
      } catch (err) {
         console.error('Error sending cancellation emails:', err);
         alert('Error sending cancellation emails. Please try again.');
      } finally {
         setIsSending(false);
      }
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
         onClose();
      }
   };

   if (!isOpen) return null;

   return (
      <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
         <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Cancel Class</h2>

            <p className={styles.courseInfo}>
               <strong>Course:</strong> {course.title} ({course.courseid})
            </p>
            <p className={styles.studentCount}>
               {students.length} student{students.length !== 1 ? 's' : ''} will be notified
            </p>

            <div className={styles.formGroup}>
               <label className={styles.label}>
                  Cancellation Title <span className={styles.required}>*</span>
               </label>
               <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Instructor Unavailable"
                  className={styles.input}
                  disabled={isSending}
               />
            </div>

            <div className={styles.formGroup}>
               <label className={styles.label}>
                  Reason/Explanation <span className={styles.required}>*</span>
               </label>
               <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide detailed explanation for class cancellation..."
                  rows={5}
                  className={styles.textarea}
                  disabled={isSending}
               />
            </div>

            <div className={styles.modalActions}>
               <button
                  onClick={onClose}
                  disabled={isSending}
                  className={styles.cancelBtn}
               >
                  Close
               </button>

               <button
                  onClick={handleSubmit}
                  disabled={isSending}
                  className={styles.submitBtn}
               >
                  {isSending ? 'Sending...' : 'Send Cancellation Notice'}
               </button>
            </div>
         </div>
      </div>
   );
};

export default CancelClassModal;