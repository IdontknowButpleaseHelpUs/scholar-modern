import React, { useState } from 'react';
import styles from '../../styles/uploadfilemodal.module.css';

const BACKENDURL = "http://127.0.0.1:5000";

const UploadFileModal = ({ isOpen, onClose, courseId, loggedUser, onSuccess }) => {
   const [file, setFile] = useState(null);
   const [description, setDescription] = useState('');
   const [uploading, setUploading] = useState(false);

   if (!isOpen) return null;

   const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;

      // Check file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
         alert('File too large! Maximum size is 50MB');
         e.target.value = '';
         return;
      }

      setFile(selectedFile);
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!file) {
         alert('Please select a file');
         return;
      }

      setUploading(true);

      try {
         const formData = new FormData();
         formData.append('file', file);
         formData.append('description', description);
         formData.append('courseId', courseId);

         const res = await fetch(`${BACKENDURL}/api/courses/${courseId}/files/upload`, {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${loggedUser.token}`
            },
            body: formData
         });

         const data = await res.json();

         if (data.success) {
            alert('✅ File uploaded successfully!');
            if (onSuccess) onSuccess();
            handleClose();
         } else {
            alert(data.message || 'Upload failed');
         }
      } catch (err) {
         console.error('Upload error:', err);
         alert('Error uploading file');
      } finally {
         setUploading(false);
      }
   };

   const handleClose = () => {
      setFile(null);
      setDescription('');
      onClose();
   };

   return (
      <div className={styles.modalOverlay} onClick={handleClose}>
         <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
               <h2>⬆️ Upload Course File</h2>
               <button onClick={handleClose} className={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
               <div className={styles.formGroup}>
                  <label>📎 Select File *</label>
                  <input
                     type="file"
                     onChange={handleFileChange}
                     className={styles.fileInput}
                     required
                  />
                  {file && (
                     <p className={styles.selectedFile}>✓ Selected: {file.name}</p>
                  )}
                  <p className={styles.hint}>Max size: 50MB</p>
               </div>

               <div className={styles.formGroup}>
                  <label>📝 Description (Optional)</label>
                  <textarea
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder="e.g., Week 1 lecture slides, Chapter 3 reading material..."
                     rows={4}
                     className={styles.textarea}
                  />
               </div>

               <div className={styles.modalActions}>
                  <button
                     type="button"
                     onClick={handleClose}
                     className={styles.cancelBtn}
                     disabled={uploading}
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className={styles.submitBtn}
                     disabled={uploading || !file}
                  >
                     {uploading ? '⏳ Uploading...' : '⬆️ Upload'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export default UploadFileModal;