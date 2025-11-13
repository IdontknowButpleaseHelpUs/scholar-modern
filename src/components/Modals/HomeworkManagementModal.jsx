import React, { useState, useEffect } from 'react';
import styles from '../../styles/homeworkmanagementmodal.module.css';

const HomeworkManagementModal = ({ isOpen, onClose, courseId, loggedUser, existingHomework, onSuccess }) => {
   const [formData, setFormData] = useState({
      title: '',
      description: '',
      dueDate: '',
      allowedFileTypes: '.pdf,.docx,.zip',
      maxFileSize: 10
   });
   const [viewMode, setViewMode] = useState('create'); // 'create', 'view', 'submissions'
   const [submissions, setSubmissions] = useState([]);
   const [loading, setLoading] = useState(false);

   const BACKENDURL = "http://127.0.0.1:5000";
   const BACKENDHOST = "https://scholar-modern.onrender.com/api";

   useEffect(() => {
      if (isOpen && existingHomework) {
         setFormData({
            title: existingHomework.title || '',
            description: existingHomework.description || '',
            dueDate: existingHomework.dueDate ? existingHomework.dueDate.split('T')[0] : '',
            allowedFileTypes: existingHomework.allowedFileTypes || '.pdf,.docx,.zip',
            maxFileSize: existingHomework.maxFileSize || 10
         });
         setSubmissions(existingHomework.submissions || []);
         setViewMode('view');
      } else {
         setViewMode('create');
      }
   }, [isOpen, existingHomework]);

   if (!isOpen) return null;

   const handleChange = (e) => {
      setFormData({
         ...formData,
         [e.target.name]: e.target.value
      });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!formData.title.trim() || !formData.dueDate) {
         alert('Please fill in all required fields');
         return;
      }

      setLoading(true);

      const payload = {
         courseId: courseId,
         homeworkId: existingHomework?.id || `hw_${Date.now()}`,
         title: formData.title,
         description: formData.description,
         dueDate: new Date(formData.dueDate + 'T23:59:59').toISOString(),
         allowedFileTypes: formData.allowedFileTypes,
         maxFileSize: formData.maxFileSize
      };

      try {
         const endpoint = existingHomework 
            ? `${BACKENDURL}/api/homework/update`
            : `${BACKENDURL}/api/homework/create`;

         const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${loggedUser.token}`
            },
            body: JSON.stringify(payload)
         });

         const data = await res.json();

         if (data.success) {
            alert(existingHomework ? 'Homework updated successfully!' : 'Homework created successfully!');
            if (onSuccess) onSuccess();
            handleClose();
         } else {
            alert(data.message || 'Operation failed');
         }
      } catch (err) {
         console.error('Error:', err);
         alert('Error processing homework');
      } finally {
         setLoading(false);
      }
   };

   const handleDelete = async () => {
      if (!existingHomework) return;

      const confirm = window.confirm(`Are you sure you want to delete "${existingHomework.title}"? This will also delete all student submissions.`);
      if (!confirm) return;

      setLoading(true);

      try {
         const res = await fetch(`${BACKENDURL}/homework/delete`, {
            method: 'DELETE',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${loggedUser.token}`
            },
            body: JSON.stringify({
               courseId: courseId,
               homeworkId: existingHomework.id
            })
         });

         const data = await res.json();

         if (data.success) {
            alert('Homework deleted successfully!');
            if (onSuccess) onSuccess();
            handleClose();
         } else {
            alert(data.message || 'Delete failed');
         }
      } catch (err) {
         console.error('Error:', err);
         alert('Error deleting homework');
      } finally {
         setLoading(false);
      }
   };

   const handleClose = () => {
      setFormData({
         title: '',
         description: '',
         dueDate: '',
         allowedFileTypes: '.pdf,.docx,.zip',
         maxFileSize: 10
      });
      setViewMode('create');
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

   const formatFileSize = (bytes) => {
      if (!bytes) return 'N/A';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
   };

   const downloadSubmission = (submission) => {
      if (!submission.filePath) {
         alert('No file available');
         return;
      }
      const link = document.createElement('a');
      link.href = `${BACKENDURL}${submission.filePath}`;
      link.download = submission.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   return (
      <div className={styles.modalOverlay} onClick={handleClose}>
         <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
               <h2 className={styles.modalTitle}>
                  {existingHomework ? '📝 Manage Homework' : '➕ Create New Homework'}
               </h2>
               <button onClick={handleClose} className={styles.closeBtn}>✕</button>
            </div>

            {/* Tab Navigation (for existing homework) */}
            {existingHomework && (
               <div className={styles.tabNav}>
                  <button
                     className={`${styles.tabBtn} ${viewMode === 'view' ? styles.active : ''}`}
                     onClick={() => setViewMode('view')}
                  >
                     📄 Details
                  </button>
                  <button
                     className={`${styles.tabBtn} ${viewMode === 'submissions' ? styles.active : ''}`}
                     onClick={() => setViewMode('submissions')}
                  >
                     📊 Submissions ({submissions.filter(s => s.submittedAt).length})
                  </button>
               </div>
            )}

            {/* Content */}
            <div className={styles.modalBody}>
               {(viewMode === 'create' || viewMode === 'view') && (
                  <form onSubmit={handleSubmit} className={styles.homeworkForm}>
                     <div className={styles.formGroup}>
                        <label className={styles.label}>Homework Title *</label>
                        <input
                           type="text"
                           name="title"
                           value={formData.title}
                           onChange={handleChange}
                           placeholder="e.g., Assignment 1: Data Structures"
                           className={styles.textInput}
                           required
                        />
                     </div>

                     <div className={styles.formGroup}>
                        <label className={styles.label}>Description</label>
                        <textarea
                           name="description"
                           value={formData.description}
                           onChange={handleChange}
                           placeholder="Describe the homework requirements..."
                           className={styles.textArea}
                           rows="5"
                        />
                     </div>

                     <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                           <label className={styles.label}>Due Date *</label>
                           <input
                              type="date"
                              name="dueDate"
                              value={formData.dueDate}
                              onChange={handleChange}
                              className={styles.dateInput}
                              required
                           />
                        </div>

                        <div className={styles.formGroup}>
                           <label className={styles.label}>Max File Size (MB)</label>
                           <input
                              type="number"
                              name="maxFileSize"
                              value={formData.maxFileSize}
                              onChange={handleChange}
                              min="1"
                              max="50"
                              className={styles.numberInput}
                           />
                        </div>
                     </div>

                     <div className={styles.formGroup}>
                        <label className={styles.label}>Allowed File Types</label>
                        <input
                           type="text"
                           name="allowedFileTypes"
                           value={formData.allowedFileTypes}
                           onChange={handleChange}
                           placeholder=".pdf,.docx,.zip"
                           className={styles.textInput}
                        />
                        <p className={styles.hint}>
                           Separate extensions with commas (e.g., .pdf,.docx,.zip)
                        </p>
                     </div>

                     <div className={styles.modalActions}>
                        {existingHomework && (
                           <button
                              type="button"
                              onClick={handleDelete}
                              className={styles.deleteBtn}
                              disabled={loading}
                           >
                              🗑️ Delete
                           </button>
                        )}
                        <button
                           type="button"
                           onClick={handleClose}
                           className={styles.cancelBtn}
                           disabled={loading}
                        >
                           Cancel
                        </button>
                        <button
                           type="submit"
                           className={styles.submitBtn}
                           disabled={loading}
                        >
                           {loading ? '⏳ Saving...' : existingHomework ? '💾 Update' : '✅ Create'}
                        </button>
                     </div>
                  </form>
               )}

               {viewMode === 'submissions' && (
                  <div className={styles.submissionsView}>
                     <h3 className={styles.sectionTitle}>Student Submissions</h3>
                     {submissions.length === 0 ? (
                        <div className={styles.emptyState}>
                           <p>📭 No submissions yet</p>
                        </div>
                     ) : (
                        <div className={styles.submissionsList}>
                           {submissions.map((sub, idx) => (
                              <div key={idx} className={styles.submissionCard}>
                                 <div className={styles.submissionHeader}>
                                    <div className={styles.studentInfo}>
                                       <span className={styles.studentName}>
                                          👤 {sub.studentUsername}
                                       </span>
                                       {sub.isLate && (
                                          <span className={styles.lateTag}>⏰ Late</span>
                                       )}
                                       {!sub.submittedAt && (
                                          <span className={styles.notSubmittedTag}>❌ Not Submitted</span>
                                       )}
                                    </div>
                                    <span className={styles.submissionDate}>
                                       {sub.submittedAt ? formatDate(sub.submittedAt) : 'Pending'}
                                    </span>
                                 </div>

                                 {sub.submittedAt && (
                                    <>
                                       <div className={styles.submissionDetails}>
                                          <p><strong>File:</strong> {sub.filename}</p>
                                          <p><strong>Size:</strong> {formatFileSize(sub.fileSize)}</p>
                                          {sub.comment && (
                                             <p><strong>Comment:</strong> {sub.comment}</p>
                                          )}
                                       </div>

                                       <div className={styles.submissionActions}>
                                          <button
                                             onClick={() => downloadSubmission(sub)}
                                             className={styles.downloadBtn}
                                          >
                                             📥 Download
                                          </button>
                                          {/* Future: Add grading button */}
                                          {/* <button className={styles.gradeBtn}>✏️ Grade</button> */}
                                       </div>
                                    </>
                                 )}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default HomeworkManagementModal;