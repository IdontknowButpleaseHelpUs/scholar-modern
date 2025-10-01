import React, { useState } from 'react';
import styles from '../../styles/profilefiles.module.css';

const ProfileFiles = ({ loggedUser, profileData }) => {
   const [files] = useState(profileData.personalFiles || []);
   const [selectedFile, setSelectedFile] = useState(null);

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
         minute: '2-digit'
      });
   };

   const getFileIcon = (filename) => {
      if (!filename) return '📄';
      const ext = filename.split('.').pop().toLowerCase();
      const iconMap = {
         'pdf': '📕',
         'doc': '📘',
         'docx': '📘',
         'xls': '📗',
         'xlsx': '📗',
         'ppt': '📙',
         'pptx': '📙',
         'zip': '📦',
         'rar': '📦',
         'jpg': '🖼️',
         'jpeg': '🖼️',
         'png': '🖼️',
         'gif': '🖼️',
         'txt': '📝',
         'mp4': '🎥',
         'mp3': '🎵'
      };
      return iconMap[ext] || '📄';
   };

   const handleFileClick = (file) => {
      setSelectedFile(selectedFile?.id === file.id ? null : file);
   };

   return (
      <div className={styles.filesContainer}>
         <h2 className={styles.sectionTitle}>Files Storage</h2>

         {files.length === 0 ? (
            <div className={styles.emptyState}>
               <div className={styles.emptyIcon}>📁</div>
               <p className={styles.emptyText}>No files uploaded yet</p>
               <p className={styles.emptySubtext}>
                  Your personal files will appear here
               </p>
            </div>
         ) : (
            <>
               {/* Files Grid */}
               <div className={styles.filesGrid}>
                  {files.map((file, idx) => (
                     <div
                        key={idx}
                        className={`${styles.fileCard} ${selectedFile?.id === file.id ? styles.fileCardSelected : ''}`}
                        onClick={() => handleFileClick(file)}
                     >
                        <div className={styles.fileIcon}>
                           {getFileIcon(file.filename)}
                        </div>
                        <div className={styles.fileInfo}>
                           <h4 className={styles.fileName}>{file.filename}</h4>
                           <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
                           <p className={styles.fileDate}>{formatDate(file.uploadedAt)}</p>
                        </div>
                     </div>
                  ))}
               </div>

               {/* File Details (when selected) */}
               {selectedFile && (
                  <div className={styles.fileDetails}>
                     <h3 className={styles.detailsTitle}>File Details</h3>
                     <div className={styles.detailsList}>
                        <div className={styles.detailRow}>
                           <span className={styles.detailLabel}>Name:</span>
                           <span className={styles.detailValue}>{selectedFile.filename}</span>
                        </div>
                        <div className={styles.detailRow}>
                           <span className={styles.detailLabel}>Size:</span>
                           <span className={styles.detailValue}>{formatFileSize(selectedFile.size)}</span>
                        </div>
                        <div className={styles.detailRow}>
                           <span className={styles.detailLabel}>Uploaded:</span>
                           <span className={styles.detailValue}>{formatDate(selectedFile.uploadedAt)}</span>
                        </div>
                        <div className={styles.detailRow}>
                           <span className={styles.detailLabel}>Type:</span>
                           <span className={styles.detailValue}>
                              {selectedFile.filename.split('.').pop().toUpperCase()}
                           </span>
                        </div>
                     </div>
                     <div className={styles.detailsActions}>
                        <button className={styles.downloadBtn}>Download</button>
                        <button className={styles.deleteBtn}>Delete</button>
                     </div>
                  </div>
               )}

               {/* Upload Button */}
               <div className={styles.uploadSection}>
                  <button className={styles.uploadBtn}>
                     ⬆️ Upload New File
                  </button>
                  <p className={styles.uploadHint}>
                     Maximum file size: 10MB
                  </p>
               </div>
            </>
         )}
      </div>
   );
};

export default ProfileFiles;