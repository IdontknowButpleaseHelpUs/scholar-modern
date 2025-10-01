// src/components/Sidebar.jsx
import React from "react";
import styles from "../../styles/sidebar.module.css";

const Sidebar = ({ isOpen, loggedUser, closeSidebar }) => {
   return (
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
         <div className={styles.sidebarClose} onClick={closeSidebar}>
            <div className={styles.sidebarCloseLine}></div>
         </div>

         {loggedUser.role !== "guest" ? (
            <ul className={styles.sidebarUl}>
               <li className={styles.sidebarLi}>Dashboard</li>
               <li className={styles.sidebarLi}>Profile</li>
               <li className={styles.sidebarLi}>Settings</li>
            </ul>
         ) : (
            <div className={styles.sidebarGuest}>
               <h2 className={styles.sidebarH2}>Log in to view content</h2>
            </div>
         )}
      </div>

   );
};

export default Sidebar;
