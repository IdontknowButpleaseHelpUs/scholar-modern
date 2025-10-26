import React, { useState } from 'react';
import styles from '../../styles/filepreviewmodal.module.css';

const FilePreviewModal = ({ file, onClose, onDelete, onRename, backendUrl }) => {
   const [isRenaming, setIsRenaming] = useState(false);
   const [newFilename, setNewFilename] = useState(file.filename);
   const [isDeleting, setIsDeleting] = useState(false);

   if (!file) return null;

   const getFileExtension = (filename) => {
      return filename.split('.').pop().toLowerCase();
   };

   const canPreview = () => {
      const ext = getFileExtension(file.filename);
      return ['jpg', 'jpeg', 'png', 'pdf'].includes(ext);
   };

   const handleRename = async () => {
      if (newFilename.trim() === '' || newFilename === file.filename) {
         setIsRenaming(false);
         return;
      }
      await onRename(file.id, newFilename);
      setIsRenaming(false);
   };

   const handleDelete = async () => {
      const confirm = window.confirm(`Are you sure you want to delete "${file.filename}"?`);
      if (confirm) {
         setIsDeleting(true);
         await onDelete(file.id);
         onClose();
      }
   };

   const handleDownload = () => {
      const link = document.createElement('a');
      link.href = `${backendUrl}${file.path}`;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const renderPreview = () => {
      const ext = getFileExtension(file.filename);
      const fileUrl = `${backendUrl}${file.path}`;

      if (['jpg', 'jpeg', 'png'].includes(ext)) {
         return (
            <div className={styles.previewContent}>
               <img 
                  src={fileUrl} 
                  alt={file.filename}
                  className={styles.imagePreview}
               />
            </div>
         );
      }

      if (ext === 'pdf') {
         return (
            <div className={styles.previewContent}>
               <object 
                  data={fileUrl} 
                  type="application/pdf" 
                  className={styles.pdfPreview}
               >
                  <p className={styles.fallbackText}>
                     PDF preview not available. 
                     <button onClick={handleDownload} className={styles.fallbackLink}>
                        Download PDF
                     </button>
                  </p>
               </object>
            </div>
         );
      }

      return (
         <div className={styles.noPreview}>
            <div className={styles.noPreviewIcon}>📄</div>
            <p className={styles.noPreviewText}>Preview not available for this file type</p>
            <button onClick={handleDownload} className={styles.downloadBtn}>
               Download to View
            </button>
         </div>
      );
   };

   const formatFileSize = (bytes) => {
      if (!bytes) return 'N/A';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
         hour12: false,
         timeZone: 'Asia/Bangkok'
      });
   };

   return (
      <div className={styles.modalOverlay} onClick={onClose}>
         <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
               <div className={styles.fileNameSection}>
                  {isRenaming ? (
                     <div className={styles.renameInput}>
                        <input
                           type="text"
                           value={newFilename}
                           onChange={(e) => setNewFilename(e.target.value)}
                           onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                           autoFocus
                           className={styles.renameField}
                        />
                        <button onClick={handleRename} className={styles.saveBtn}>✓</button>
                        <button onClick={() => setIsRenaming(false)} className={styles.cancelBtn}>✕</button>
                     </div>
                  ) : (
                     <>
                        <h2 className={styles.fileName}>{file.filename}</h2>
                        <button 
                           onClick={() => setIsRenaming(true)} 
                           className={styles.editNameBtn}
                           title="Rename file"
                        >
                           ✏️
                        </button>
                     </>
                  )}
               </div>
               <button onClick={onClose} className={styles.closeBtn}>✕</button>
            </div>

            {/* Preview Area */}
            {canPreview() ? (
               renderPreview()
            ) : (
               <div className={styles.noPreview}>
                  <div className={styles.noPreviewIcon}>📄</div>
                  <p className={styles.noPreviewText}>Preview not available for this file type</p>
                  <button onClick={handleDownload} className={styles.downloadBtn}>
                     Download to View
                  </button>
               </div>
            )}

            {/* File Info */}
            <div className={styles.fileInfo}>
               <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Size:</span>
                  <span className={styles.infoValue}>{formatFileSize(file.size)}</span>
               </div>
               <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Type:</span>
                  <span className={styles.infoValue}>
                     {getFileExtension(file.filename).toUpperCase()}
                  </span>
               </div>
               <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Uploaded:</span>
                  <span className={styles.infoValue}>{formatDate(file.uploadedAt)}</span>
               </div>
            </div>

            {/* Actions */}
            <div className={styles.modalActions}>
               <button 
                  onClick={handleDownload} 
                  className={styles.actionBtn}
               >
                  📥 Download
               </button>
               <button 
                  onClick={handleDelete} 
                  className={`${styles.actionBtn} ${styles.deleteActionBtn}`}
                  disabled={isDeleting}
               >
                  {isDeleting ? '⏳ Deleting...' : '🗑️ Delete'}
               </button>
            </div>
         </div>
      </div>
   );
};

export default FilePreviewModal;