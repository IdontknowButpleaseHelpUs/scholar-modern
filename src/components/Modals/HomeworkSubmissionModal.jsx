import React, { useState, useEffect } from 'react';
import styles from '../../styles/homeworksubmissionmodal.module.css';

const BACKENDURL = "http://127.0.0.1:5000/api";

const HomeworkSubmissionModal = ({ isOpen, onClose, homework, courseId, loggedUser, onSubmitSuccess }) => {
   const [file, setFile] = useState(null);
   const [fileName, setFileName] = useState('');
   const [comment, setComment] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const [existingSubmission, setExistingSubmission] = useState(null);

   useEffect(() => {
      if (homework && homework.submissions) {
         const submission = homework.submissions.find(
            s => s.studentUsername === loggedUser.username
         );
         setExistingSubmission(submission || null);
         if (submission && submission.submittedAt) {
            setFileName(submission.filename || '');
            setComment(submission.comment || '');
         }
      }
   }, [homework, loggedUser]);

   if (!isOpen) return null;

   const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;

      const maxSize = (homework.maxFileSize || 10) * 1024 * 1024;
      if (selectedFile.size > maxSize) {
         alert(`File too large! Maximum size is ${homework.maxFileSize || 10}MB`);
         e.target.value = '';
         return;
      }

      if (homework.allowedFileTypes) {
         const allowedTypes = homework.allowedFileTypes.split(',').map(t => t.trim().toLowerCase());
         const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
         
         if (!allowedTypes.includes(fileExt)) {
            alert(`File type not allowed! Allowed types: ${homework.allowedFileTypes}`);
            e.target.value = '';
            return;
         }
      }

      setFile(selectedFile);
      if (!fileName) {
         setFileName(selectedFile.name);
      }
   };

   const sendEmailNotification = async (isResubmission) => {
      try {
         const coursesRes = await fetch(`${BACKENDURL}/courses`, {
            headers: { 'Authorization': `Bearer ${loggedUser.token}` }
         });
         
         if (!coursesRes.ok) return;
         
         const coursesData = await coursesRes.json();
         const currentCourse = coursesData.data.find(c => c.courseid === courseId);
         
         if (!currentCourse || !currentCourse.members?.lecturer) return;

         const lecturerUsername = currentCourse.members.lecturer[0];
         const lecturerRes = await fetch(`${BACKENDURL}/api/lecturer/${lecturerUsername}`, {
            headers: { 'Authorization': `Bearer ${loggedUser.token}` }
         });

         if (!lecturerRes.ok) return;
         
         const lecturerData = await lecturerRes.json();
         const lecturer = lecturerData.data;

         const formData = new FormData();
         formData.append('subject', `${isResubmission ? 'Homework Resubmitted' : 'New Homework Submission'}: ${homework.title}`);
         formData.append('email', lecturer.email || 'lecturer@example.com');
         
         const studentName = `${loggedUser.firstName || ''} ${loggedUser.lastName || ''}`.trim() || loggedUser.username;
         const submissionTime = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
         });

         formData.append('message', `
📚 ${isResubmission ? 'HOMEWORK RESUBMITTED' : 'NEW HOMEWORK SUBMISSION'}

Student: ${studentName} (${loggedUser.username})
Course: ${currentCourse.title} (${courseId})
Homework: ${homework.title}

File: ${fileName}
${comment ? `Comment: ${comment}` : ''}

Submitted: ${submissionTime}
${isResubmission ? '\n⚠️ This is a resubmission' : ''}

---
This is an automated notification from Scholar Modern.
         `);

         await fetch('https://formspree.io/f/myzdwdvq', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
         });

         console.log('Email notification sent to lecturer');
      } catch (err) {
         console.error('Error sending email notification:', err);
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      const hasExistingSubmission = existingSubmission && existingSubmission.submittedAt;

      if (!hasExistingSubmission && !file) {
         alert('Please select a file to submit');
         return;
      }

      if (!fileName.trim()) {
         alert('Please enter a filename');
         return;
      }

      setSubmitting(true);

      try {
         const formData = new FormData();
         
         if (file) {
            formData.append('file', file);
         }
         
         formData.append('courseId', courseId);
         formData.append('homeworkId', homework.id || homework.title);
         formData.append('homeworkTitle', homework.title);
         formData.append('filename', fileName);
         formData.append('comment', comment);

         console.log('Submitting homework:', {
            courseId,
            homeworkId: homework.id,
            filename: fileName,
            hasFile: !!file
         });

         const res = await fetch(`${BACKENDURL}/homework/submit`, {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${loggedUser.token}`
            },
            body: formData
         });

         const data = await res.json();
         console.log('Submission response:', data);

         if (data.success) {
            const isResubmission = hasExistingSubmission;
            alert(isResubmission ? '✅ Homework resubmitted successfully!' : '✅ Homework submitted successfully!');
            
            await sendEmailNotification(isResubmission);
            
            if (onSubmitSuccess) onSubmitSuccess();
            handleClose();
         } else {
            alert(data.message || 'Submission failed');
         }
      } catch (err) {
         console.error('Submission error:', err);
         alert('Error submitting homework. Please try again.');
      } finally {
         setSubmitting(false);
      }
   };

   const handleClose = () => {
      setFile(null);
      setFileName('');
      setComment('');
      onClose();
   };

   const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
         hour12: true
      });
   };

   const isDueDatePassed = () => {
      if (!homework.dueDate) return false;
      return new Date() > new Date(homework.dueDate);
   };

   const isResubmission = existingSubmission && existingSubmission.submittedAt;

   return (
      <div className={styles.modalOverlay} onClick={handleClose}>
         <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
               <h2>{isResubmission ? '📝 Resubmit Homework' : '📤 Submit Homework'}</h2>
               <button onClick={handleClose} className={styles.closeBtn}>✕</button>
            </div>

            <div className={styles.homeworkInfo}>
               <p><strong>Homework:</strong> {homework.title}</p>
               <p>
                  <strong>Due:</strong> 
                  <span className={isDueDatePassed() ? styles.overdue : ''}>
                     {formatDate(homework.dueDate)}
                     {isDueDatePassed() && ' ⚠️ (Overdue)'}
                  </span>
               </p>
               {homework.description && (
                  <p><strong>Description:</strong> {homework.description}</p>
               )}
               <p><strong>Max File Size:</strong> {homework.maxFileSize || 10}MB</p>
               {homework.allowedFileTypes && (
                  <p><strong>Allowed Types:</strong> {homework.allowedFileTypes}</p>
               )}
            </div>

            {isResubmission && (
               <div className={styles.existingSubmission}>
                  <h3>✅ Previous Submission</h3>
                  <p><strong>File:</strong> {existingSubmission.filename || 'N/A'}</p>
                  <p><strong>Submitted:</strong> {formatDate(existingSubmission.submittedAt)}</p>
                  {existingSubmission.comment && (
                     <p><strong>Comment:</strong> {existingSubmission.comment}</p>
                  )}
                  {existingSubmission.isLate && <p className={styles.lateTag}>⏰ Late Submission</p>}
               </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
               <div className={styles.formGroup}>
                  <label>
                     📎 Upload File {isResubmission && '(optional - leave empty to keep previous file)'}
                  </label>
                  <input
                     type="file"
                     onChange={handleFileChange}
                     accept={homework.allowedFileTypes || '*'}
                     className={styles.fileInput}
                  />
                  {file && (
                     <p className={styles.selectedFile}>✓ Selected: {file.name}</p>
                  )}
                  {homework.allowedFileTypes && (
                     <p className={styles.hint}>Allowed: {homework.allowedFileTypes}</p>
                  )}
               </div>

               <div className={styles.formGroup}>
                  <label>📄 Filename *</label>
                  <input
                     type="text"
                     value={fileName}
                     onChange={(e) => setFileName(e.target.value)}
                     placeholder="Enter display filename"
                     className={styles.textInput}
                     required
                  />
               </div>

               <div className={styles.formGroup}>
                  <label>💬 Comment (Optional)</label>
                  <textarea
                     value={comment}
                     onChange={(e) => setComment(e.target.value)}
                     placeholder="Add any notes or comments about your submission..."
                     rows={4}
                     className={styles.textarea}
                  />
               </div>

               {isDueDatePassed() && (
                  <div className={styles.warningBox}>
                     ⚠️ Warning: This submission is past the due date and will be marked as late.
                  </div>
               )}

               <div className={styles.modalActions}>
                  <button
                     type="button"
                     onClick={handleClose}
                     className={styles.cancelBtn}
                     disabled={submitting}
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className={styles.submitBtn}
                     disabled={submitting || (!file && !isResubmission)}
                  >
                     {submitting ? '⏳ Submitting...' : isResubmission ? '🔄 Resubmit' : '✅ Submit'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export default HomeworkSubmissionModal;