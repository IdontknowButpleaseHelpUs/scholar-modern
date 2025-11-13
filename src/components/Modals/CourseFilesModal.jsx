import React, { useState } from 'react';
import UploadFileModal from './UploadFileModal';
import styles from '../../styles/coursefilesmodal.module.css';

const BACKENDURL = "http://127.0.0.1:5000";

const CourseFilesModal = ({ isOpen, onClose, course, loggedUser, onSuccess }) => {
   const [showUploadModal, setShowUploadModal] = useState(false);
   const [deleting, setDeleting] = useState(null);

   if (!isOpen) return null;

   const isLecturer = loggedUser.role === 'lecturer' && 
                      course?.members?.lecturer?.includes(loggedUser.username);

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

   const formatFileSize = (bytes) => {
      if (!bytes) return 'N/A';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
   };

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

   const handleDownload = (file) => {
      const link = document.createElement('a');
      link.href = `${BACKENDURL}${file.filePath}`;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleDelete = async (fileId) => {
      if (!window.confirm('Are you sure you want to delete this file?')) return;

      setDeleting(fileId);
      try {
         const res = await fetch(`${BACKENDURL}/api/courses/${course.courseid}/files/${fileId}`, {
            method: 'DELETE',
            headers: {
               'Authorization': `Bearer ${loggedUser.token}`
            }
         });

         const data = await res.json();
         if (data.success) {
            alert('File deleted successfully!');
            if (onSuccess) onSuccess();
         } else {
            alert(data.message || 'Delete failed');
         }
      } catch (err) {
         console.error('Delete error:', err);
         alert('Error deleting file');
      } finally {
         setDeleting(null);
      }
   };

   const files = course?.files || [];

   return (
      <>
         <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
               {/* Header */}
               <div className={styles.modalHeader}>
                  <h2>📁 Course Files</h2>
                  <button onClick={onClose} className={styles.closeBtn}>✕</button>
               </div>

               {/* Upload Button */}
               {isLecturer && (
                  <div className={styles.uploadSection}>
                     <button 
                        onClick={() => setShowUploadModal(true)}
                        className={styles.uploadBtn}
                     >
                        ⬆️ Upload New File
                     </button>
                  </div>
               )}

               {/* Files List */}
               <div className={styles.filesContainer}>
                  {files.length === 0 ? (
                     <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📁</div>
                        <p>No files uploaded yet</p>
                        {isLecturer && <p className={styles.emptyHint}>Click "Upload New File" to add course materials</p>}
                     </div>
                  ) : (
                     <div className={styles.filesList}>
                        {files.map((file, idx) => (
                           <div key={idx} className={styles.fileCard}>
                              <div className={styles.fileIcon}>
                                 {getFileIcon(file.filename)}
                              </div>
                              <div className={styles.fileInfo}>
                                 <h3 className={styles.fileName}>{file.filename}</h3>
                                 {file.description && (
                                    <p className={styles.fileDescription}>{file.description}</p>
                                 )}
                                 <div className={styles.fileMeta}>
                                    <span>📤 {file.uploadedBy}</span>
                                    <span>📅 {formatDate(file.uploadedAt)}</span>
                                    <span>💾 {formatFileSize(file.fileSize)}</span>
                                 </div>
                              </div>
                              <div className={styles.fileActions}>
                                 <button 
                                    onClick={() => handleDownload(file)}
                                    className={styles.downloadBtn}
                                 >
                                    📥 Download
                                 </button>
                                 {isLecturer && (
                                    <button 
                                       onClick={() => handleDelete(file.id)}
                                       className={styles.deleteBtn}
                                       disabled={deleting === file.id}
                                    >
                                       {deleting === file.id ? '⏳' : '🗑️'}
                                    </button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Upload Modal */}
         {showUploadModal && (
            <UploadFileModal
               isOpen={showUploadModal}
               onClose={() => setShowUploadModal(false)}
               courseId={course.courseid}
               loggedUser={loggedUser}
               onSuccess={() => {
                  setShowUploadModal(false);
                  if (onSuccess) onSuccess();
               }}
            />
         )}
      </>
   );
};

export default CourseFilesModal;