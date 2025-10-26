import React, { useState, useEffect } from 'react';
import styles from '../../styles/homeworksubmissionmodal.module.css';

const HomeworkSubmissionModal = ({ isOpen, onClose, homework, courseId, loggedUser, onSubmitSuccess }) => {
   const [selectedFile, setSelectedFile] = useState(null);
   const [fileName, setFileName] = useState('');
   const [comment, setComment] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const [existingSubmission, setExistingSubmission] = useState(null);
   const [isEditing, setIsEditing] = useState(false);

   const BACKEND_URL = "https://scholar-modern.onrender.com";

   useEffect(() => {
      if (isOpen && homework) {
         // Check if student already has a submission
         const userSubmission = homework.submissions?.find(
            s => s.studentUsername === loggedUser.username
         );
         setExistingSubmission(userSubmission || null);
         
         if (userSubmission && userSubmission.submittedAt) {
            setFileName(userSubmission.filename || '');
            setComment(userSubmission.comment || '');
         }
      }
   }, [isOpen, homework, loggedUser]);

   if (!isOpen) return null;

   const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
         setSelectedFile(file);
         // Auto-fill filename with the uploaded file's name
         if (!fileName || fileName === existingSubmission?.filename) {
            setFileName(file.name);
         }
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!selectedFile && !existingSubmission?.submittedAt) {
         alert('Please select a file to submit');
         return;
      }

      if (!fileName.trim()) {
         alert('Please enter a filename');
         return;
      }

      setSubmitting(true);

      const formData = new FormData();
      if (selectedFile) {
         formData.append('file', selectedFile);
      }
      formData.append('filename', fileName);
      formData.append('comment', comment);
      formData.append('courseId', courseId);
      formData.append('homeworkId', homework.id || homework.title);
      formData.append('homeworkTitle', homework.title);

      try {
         const res = await fetch(
            `${BACKEND_URL}/api/homework/submit`,
            {
               method: 'POST',
               headers: {
                  'Authorization': `Bearer ${loggedUser.token}`
               },
               body: formData
            }
         );

         const data = await res.json();

         if (data.success) {
            alert(existingSubmission?.submittedAt ? 'Homework resubmitted successfully!' : 'Homework submitted successfully!');
            if (onSubmitSuccess) onSubmitSuccess();
            handleClose();
         } else {
            alert(data.message || 'Submission failed');
         }
      } catch (err) {
         console.error('Submission error:', err);
         alert('Error submitting homework');
      } finally {
         setSubmitting(false);
      }
   };

   const handleClose = () => {
      setSelectedFile(null);
      setFileName('');
      setComment('');
      setIsEditing(false);
      onClose();
   };

   const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
         month: 'short',
         day: 'numeric',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
         hour12: true,
         timeZone: 'Asia/Bangkok'
      });
   };

   const isDueDatePassed = () => {
      if (!homework.dueDate) return false;
      return new Date() > new Date(homework.dueDate);
   };

   const isResubmission = existingSubmission?.submittedAt !== null;

   return (
      <div className={styles.modalOverlay} onClick={handleClose}>
         <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
               <h2 className={styles.modalTitle}>
                  {isResubmission ? '📝 Resubmit Homework' : '📤 Submit Homework'}
               </h2>
               <button onClick={handleClose} className={styles.closeBtn}>✕</button>
            </div>

            {/* Homework Info */}
            <div className={styles.homeworkInfo}>
               <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Homework:</span>
                  <span className={styles.infoValue}>{homework.title}</span>
               </div>
               <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Due Date:</span>
                  <span className={`${styles.infoValue} ${isDueDatePassed() ? styles.overdue : ''}`}>
                     {formatDate(homework.dueDate)}
                     {isDueDatePassed() && <span className={styles.overdueTag}> (Overdue)</span>}
                  </span>
               </div>
               {homework.description && (
                  <div className={styles.infoRow}>
                     <span className={styles.infoLabel}>Description:</span>
                     <p className={styles.descriptionText}>{homework.description}</p>
                  </div>
               )}
            </div>

            {/* Existing Submission Info */}
            {isResubmission && (
               <div className={styles.existingSubmission}>
                  <h3 className={styles.sectionTitle}>✅ Previous Submission</h3>
                  <div className={styles.submissionDetails}>
                     <p><strong>File:</strong> {existingSubmission.filename}</p>
                     <p><strong>Submitted:</strong> {formatDate(existingSubmission.submittedAt)}</p>
                     {existingSubmission.comment && (
                        <p><strong>Comment:</strong> {existingSubmission.comment}</p>
                     )}
                  </div>
                  <button 
                     onClick={() => setIsEditing(!isEditing)} 
                     className={styles.editBtn}
                  >
                     {isEditing ? '❌ Cancel Edit' : '✏️ Edit Submission'}
                  </button>
               </div>
            )}

            {/* Submission Form */}
            {(!isResubmission || isEditing) && (
               <form onSubmit={handleSubmit} className={styles.submissionForm}>
                  <h3 className={styles.sectionTitle}>
                     {isResubmission ? '📝 New Submission' : '📁 Upload Your Work'}
                  </h3>

                  {/* File Upload */}
                  <div className={styles.formGroup}>
                     <label className={styles.label}>
                        File {isResubmission && '(Leave empty to keep previous file)'}
                     </label>
                     <div className={styles.fileInputWrapper}>
                        <input
                           type="file"
                           id="homeworkFile"
                           onChange={handleFileSelect}
                           className={styles.fileInput}
                           accept={homework.allowedFileTypes || '*'}
                        />
                        <label htmlFor="homeworkFile" className={styles.fileInputLabel}>
                           {selectedFile ? '✓ ' + selectedFile.name : '📎 Choose File'}
                        </label>
                     </div>
                     {homework.allowedFileTypes && (
                        <p className={styles.fileHint}>
                           Allowed types: {homework.allowedFileTypes}
                        </p>
                     )}
                  </div>

                  {/* Filename */}
                  <div className={styles.formGroup}>
                     <label className={styles.label}>Display Name *</label>
                     <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Enter filename (e.g., Assignment1.pdf)"
                        className={styles.textInput}
                        required
                     />
                  </div>

                  {/* Comment */}
                  <div className={styles.formGroup}>
                     <label className={styles.label}>Comment (Optional)</label>
                     <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add any notes or comments about your submission..."
                        className={styles.textArea}
                        rows="4"
                     />
                  </div>

                  {/* Warning for late submission */}
                  {isDueDatePassed() && (
                     <div className={styles.warningBox}>
                        ⚠️ Warning: This submission is past the due date and may be marked as late.
                     </div>
                  )}

                  {/* Submit Button */}
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
                        disabled={submitting || (!selectedFile && !isResubmission)}
                     >
                        {submitting ? '⏳ Submitting...' : isResubmission ? '🔄 Resubmit' : '✅ Submit'}
                     </button>
                  </div>
               </form>
            )}

            {/* View Only Mode (when already submitted and not editing) */}
            {isResubmission && !isEditing && (
               <div className={styles.viewOnlyMessage}>
                  <p>✅ You have already submitted this homework.</p>
                  <p>Click "Edit Submission" above to resubmit.</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default HomeworkSubmissionModal;