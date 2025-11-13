import React, { useState } from 'react';
import styles from '../../styles/filepreviewmodal.module.css';

const BACKENDURL = "http://127.0.0.1:5000";

const FilePreviewModal = ({ isOpen, onClose, file, loggedUser, courseId, onDelete }) => {
   const [deleting, setDeleting] = useState(false);

   if (!isOpen || !file) return null;

   const isLecturer = loggedUser.role === 'lecturer';

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

   const getFileType = (filename) => {
      if (!filename) return 'Unknown';
      const ext = filename.split('.').pop().toUpperCase();
      return `${ext} File`;
   };

   const handleDownload = () => {
      const link = document.createElement('a');
      link.href = `${BACKENDURL}${file.filePath}`;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleDelete = async () => {
      if (!window.confirm(`Are you sure you want to delete "${file.filename}"?`)) return;

      setDeleting(true);
      try {
         const res = await fetch(`${BACKENDURL}/api/courses/${courseId}/files/${file.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${loggedUser.token}` }
         });

         const data = await res.json();
         if (data.success) {
            alert('✅ File deleted successfully!');
            if (onDelete) onDelete();
            onClose();
         } else {
            alert(data.message || 'Delete failed');
         }
      } catch (err) {
         console.error('Delete error:', err);
         alert('Error deleting file');
      } finally {
         setDeleting(false);
      }
   };

   return (
      <div className={styles.modalOverlay} onClick={onClose}>
         <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
               <div className={styles.fileIconLarge}>
                  {getFileIcon(file.filename)}
               </div>
               <button onClick={onClose} className={styles.closeBtn}>✕</button>
            </div>

            {/* File Info */}
            <div className={styles.fileInfo}>
               <h2 className={styles.fileName}>{file.filename}</h2>
               <p className={styles.fileType}>{getFileType(file.filename)}</p>
            </div>

            {/* Description */}
            {file.description && (
               <div className={styles.descriptionSection}>
                  <h3 className={styles.sectionTitle}>📝 Description</h3>
                  <p className={styles.description}>{file.description}</p>
               </div>
            )}

            {/* Metadata */}
            <div className={styles.metadataSection}>
               <h3 className={styles.sectionTitle}>ℹ️ File Details</h3>
               <div className={styles.metadataGrid}>
                  <div className={styles.metadataItem}>
                     <span className={styles.metadataLabel}>📤 Uploaded By:</span>
                     <span className={styles.metadataValue}>{file.uploadedBy}</span>
                  </div>
                  <div className={styles.metadataItem}>
                     <span className={styles.metadataLabel}>📅 Upload Date:</span>
                     <span className={styles.metadataValue}>{formatDate(file.uploadedAt)}</span>
                  </div>
                  <div className={styles.metadataItem}>
                     <span className={styles.metadataLabel}>💾 File Size:</span>
                     <span className={styles.metadataValue}>{formatFileSize(file.fileSize)}</span>
                  </div>
                  <div className={styles.metadataItem}>
                     <span className={styles.metadataLabel}>📂 File Type:</span>
                     <span className={styles.metadataValue}>{getFileType(file.filename)}</span>
                  </div>
               </div>
            </div>

            {/* Actions */}
            <div className={styles.modalActions}>
               <button onClick={onClose} className={styles.cancelBtn}>
                  Close
               </button>
               <button onClick={handleDownload} className={styles.downloadBtn}>
                  📥 Download
               </button>
               {isLecturer && (
                  <button 
                     onClick={handleDelete} 
                     className={styles.deleteBtn}
                     disabled={deleting}
                  >
                     {deleting ? '⏳ Deleting...' : '🗑️ Delete'}
                  </button>
               )}
            </div>
         </div>
      </div>
   );
};

export default FilePreviewModal;