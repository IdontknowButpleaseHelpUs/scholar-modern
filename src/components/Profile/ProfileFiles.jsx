import React, { useState, useEffect } from 'react';
import styles from '../../styles/profilefiles.module.css';
import FilePreviewModal from './FilePreviewModal';

const BACKENDURL = "http://127.0.0.1:5000/api";
const BACKENDHOST = "https://scholar-modern.onrender.com/api";

const ProfileFiles = ({ loggedUser, profileData }) => {
   const [files, setFiles] = useState(profileData.personalFiles || []);
   const [selectedFile, setSelectedFile] = useState(null);
   const [previewFile, setPreviewFile] = useState(null);
   const [uploading, setUploading] = useState(false);
   const [storageInfo, setStorageInfo] = useState({
      storageUsed: 0,
      storageLimit: 50 * 1024 * 1024,
      storagePercent: 0
   });

   // Fetch storage info on mount
   useEffect(() => {
      fetchStorageInfo();
   }, []);

   // Update files when profileData changes
   useEffect(() => {
      setFiles(profileData.personalFiles || []);
      calculateStorage(profileData.personalFiles || []);
   }, [profileData]);

   const fetchStorageInfo = async () => {
      try {
         const res = await fetch(
            `${BACKENDURL}/files/storage/${loggedUser.role}/${loggedUser.username}`,
            {
               headers: {
                  "Authorization": `Bearer ${loggedUser.token}`
               }
            }
         );
         if (res.ok) {
            const data = await res.json();
            setStorageInfo(data.data);
         }
      } catch (err) {
         console.error("Error fetching storage info:", err);
      }
   };

   const calculateStorage = (fileList) => {
      const totalSize = fileList.reduce((acc, file) => acc + (file.size || 0), 0);
      const limit = 50 * 1024 * 1024;
      setStorageInfo({
         storageUsed: totalSize,
         storageLimit: limit,
         storagePercent: (totalSize / limit) * 100
      });
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
         hour12: true,
         timeZone: 'Asia/Bangkok'
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
         'txt': '📝',
         'mp4': '🎥',
         'mp3': '🎵'
      };
      return iconMap[ext] || '📄';
   };

   const handleFileClick = (file) => {
      setPreviewFile(file);
   };

   const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Check file size before upload
      if (storageInfo.storageUsed + file.size > storageInfo.storageLimit) {
         const remaining = storageInfo.storageLimit - storageInfo.storageUsed;
         alert(`Storage limit exceeded! You have ${formatFileSize(remaining)} remaining.`);
         return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
         const res = await fetch(
            `${BACKENDURL}/files/upload/${loggedUser.role}/${loggedUser.username}`,
            {
               method: 'POST',
               headers: {
                  "Authorization": `Bearer ${loggedUser.token}`
               },
               body: formData
            }
         );

         const data = await res.json();

         if (data.success) {
            setFiles([...files, data.data.file]);
            setStorageInfo({
               storageUsed: data.data.storageUsed,
               storageLimit: data.data.storageLimit,
               storagePercent: (data.data.storageUsed / data.data.storageLimit) * 100
            });
            alert('File uploaded successfully!');
         } else {
            alert(data.message || 'Upload failed');
         }
      } catch (err) {
         console.error("Upload error:", err);
         alert('Error uploading file');
      } finally {
         setUploading(false);
         event.target.value = ''; // Reset input
      }
   };

   const handleDeleteFile = async (fileId) => {
      try {
         const res = await fetch(
            `${BACKENDURL}/files/delete/${loggedUser.role}/${loggedUser.username}/${fileId}`,
            {
               method: 'DELETE',
               headers: {
                  "Authorization": `Bearer ${loggedUser.token}`
               }
            }
         );

         const data = await res.json();

         if (data.success) {
            setFiles(files.filter(f => f.id !== fileId));
            setStorageInfo({
               storageUsed: data.data.storageUsed,
               storageLimit: data.data.storageLimit,
               storagePercent: (data.data.storageUsed / data.data.storageLimit) * 100
            });
            setSelectedFile(null);
            alert('File deleted successfully!');
         } else {
            alert(data.message || 'Delete failed');
         }
      } catch (err) {
         console.error("Delete error:", err);
         alert('Error deleting file');
      }
   };

   const handleRenameFile = async (fileId, newFilename) => {
      try {
         const res = await fetch(
            `${BACKENDURL}/files/rename/${loggedUser.role}/${loggedUser.username}/${fileId}`,
            {
               method: 'PUT',
               headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${loggedUser.token}`
               },
               body: JSON.stringify({ filename: newFilename })
            }
         );

         const data = await res.json();

         if (data.success) {
            setFiles(files.map(f => f.id === fileId ? data.data.file : f));
            alert('File renamed successfully!');
         } else {
            alert(data.message || 'Rename failed');
         }
      } catch (err) {
         console.error("Rename error:", err);
         alert('Error renaming file');
      }
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
            </>
         )}

         {/* Upload Section */}
         <div className={styles.uploadSection}>
            <label htmlFor="fileUpload" className={styles.uploadBtn}>
               {uploading ? '⏳ Uploading...' : '⬆️ Upload New File'}
            </label>
            <input
               id="fileUpload"
               type="file"
               onChange={handleFileUpload}
               disabled={uploading}
               style={{ display: 'none' }}
               accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip,.rar,.mp4,.mp3"
            />
            <p className={styles.uploadHint}>
               Maximum file size: 10MB | Allowed types: PDF, DOC, XLS, PPT, TXT, JPG, PNG, ZIP, MP4, MP3
            </p>
         </div>

         {/* Storage Bar */}
         <div className={styles.storageSection}>
            <div className={styles.storageHeader}>
               <span className={styles.storageLabel}>Storage</span>
               <span className={styles.storageText}>
                  {formatFileSize(storageInfo.storageUsed)} / {formatFileSize(storageInfo.storageLimit)}
               </span>
            </div>
            <div className={styles.storageBarContainer}>
               <div 
                  className={styles.storageBar}
                  style={{ 
                     width: `${Math.min(storageInfo.storagePercent, 100)}%`,
                     backgroundColor: storageInfo.storagePercent > 90 ? '#e74c3c' : 
                                    storageInfo.storagePercent > 70 ? '#f39c12' : '#3498db'
                  }}
               />
            </div>
            <p className={styles.storagePercent}>
               {storageInfo.storagePercent.toFixed(1)}% used
            </p>
         </div>

         {/* File Preview Modal */}
         {previewFile && (
            <FilePreviewModal
               file={previewFile}
               onClose={() => setPreviewFile(null)}
               onDelete={handleDeleteFile}
               onRename={handleRenameFile}
               backendUrl={BACKENDURL}
            />
         )}
      </div>
   );
};

export default ProfileFiles;