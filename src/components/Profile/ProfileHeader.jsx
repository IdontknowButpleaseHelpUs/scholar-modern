import React from 'react';
import styles from '../../styles/profileheader.module.css';

const ProfileHeader = ({ loggedUser, profileData }) => {
   const getProfileImage = () => {
      if (profileData.profilePic) {
         return profileData.profilePic.startsWith('/static/') || profileData.profilePic.startsWith('http')
            ? profileData.profilePic.startsWith('http')
               ? profileData.profilePic
               : `http://127.0.0.1:5000${profileData.profilePic}`
            : `https://scholar-modern.onrender.comstatic/${profileData.profilePic}`;
      }
      return '/assets/user.png';
   };

   const getUserId = () => {
      if (loggedUser.role === 'student') return profileData.studentId;
      if (loggedUser.role === 'lecturer') return profileData.lecturerId;
      if (loggedUser.role === 'admin') return profileData.adminId;
      return 'N/A';
   };

   const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
      });
   };

   const getRoleBadgeClass = () => {
      switch (loggedUser.role) {
         case 'admin': return styles.badgeAdmin;
         case 'lecturer': return styles.badgeLecturer;
         case 'student': return styles.badgeStudent;
         default: return styles.badgeDefault;
      }
   };

   return (
      <div className={styles.headerContainer}>
         {/* Cover Image */}
         <div className={styles.coverImage}>
            <div className={styles.coverOverlay}></div>
         </div>

         {/* Profile Content */}
         <div className={styles.profileContent}>
            {/* Profile Picture */}
            <div className={styles.profilePictureWrapper}>
               <img
                  src={getProfileImage()}
                  alt="Profile"
                  className={styles.profilePicture}
               />
            </div>

            {/* User Info */}
            <div className={styles.userInfo}>
               <div className={styles.nameSection}>
                  <h1 className={styles.fullName}>
                     {profileData.title && `${profileData.title} `}
                     {profileData.firstName} {profileData.lastName}
                  </h1>
                  <span className={`${styles.roleBadge} ${getRoleBadgeClass()}`}>
                     {loggedUser.role.toUpperCase()}
                  </span>
               </div>

               <div className={styles.metaInfo}>
                  <div className={styles.metaItem}>
                     <span className={styles.metaLabel}>ID:</span>
                     <span className={styles.metaValue}>{getUserId()}</span>
                  </div>
                  <div className={styles.metaDivider}>•</div>
                  <div className={styles.metaItem}>
                     <span className={styles.metaLabel}>Joined:</span>
                     <span className={styles.metaValue}>{formatDate(profileData.joinDate)}</span>
                  </div>
                  <div className={styles.metaDivider}>•</div>
                  <div className={styles.metaItem}>
                     <span className={styles.metaLabel}>Location:</span>
                     <span className={styles.metaValue}>{profileData.location || 'N/A'}</span>
                  </div>
               </div>

               <div className={styles.contactInfo}>
                  {profileData.email && (
                     <div className={styles.contactItem}>
                        <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{profileData.email}</span>
                     </div>
                  )}
                  {profileData.phone && (
                     <div className={styles.contactItem}>
                        <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{profileData.phone}</span>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* About Me Section */}
         {profileData.description && (
            <div className={styles.aboutSection}>
               <h2 className={styles.aboutTitle}>About Me</h2>
               <p className={styles.aboutText}>{profileData.description}</p>
            </div>
         )}
      </div>
   );
};

export default ProfileHeader;