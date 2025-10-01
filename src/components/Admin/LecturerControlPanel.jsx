import React, { useState, useEffect } from "react";
import styles from "../../styles/admin.module.css";

export default function LecturerControlPanel({ editingData, onAdd, onUpdate, onDelete, onClear }) {
   const [form, setForm] = useState({
      username: "",
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
   });

   // Update form when editingData changes
   useEffect(() => {
      if (editingData) {
         setForm({
            username: editingData.username || "",
            title: editingData.title || "",
            firstName: editingData.firstName || "",
            lastName: editingData.lastName || "",
            email: editingData.email || "",
            phone: editingData.phone || "",
            password: "", // Don't show password for security
         });
      }
   }, [editingData]);

   const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
   };

   const handleAdd = () => {
      if (!form.username || !form.firstName || !form.lastName) {
         alert("Username, First Name, and Last Name are required!");
         return;
      }

      if (!form.password) {
         alert("Password is required for new lecturer!");
         return;
      }

      const lecturerData = {
         username: form.username,
         password: form.password,
         title: form.title,
         firstName: form.firstName,
         lastName: form.lastName,
         email: form.email,
         phone: form.phone,
         country: "",
         location: "",
         description: "",
         profilePic: "",
         courses: [],
         files: {},
         homework: {},
         personalFiles: [],
         timetable: []
      };

      onAdd(lecturerData);
      handleClear();
   };

   const handleUpdate = () => {
      if (!form.username || !form.firstName || !form.lastName) {
         alert("Username, First Name, and Last Name are required!");
         return;
      }

      const lecturerData = {
         username: form.username,
         title: form.title,
         firstName: form.firstName,
         lastName: form.lastName,
         email: form.email,
         phone: form.phone,
      };

      // Only include password if it's been changed
      if (form.password) {
         lecturerData.password = form.password;
      }

      onUpdate(lecturerData);
      handleClear();
   };

   const handleDelete = () => {
      if (!form.username) {
         alert("Please select a lecturer to delete!");
         return;
      }
      onDelete(form.username);
      handleClear();
   };

   const handleClear = () => {
      setForm({
         username: "",
         title: "",
         firstName: "",
         lastName: "",
         email: "",
         phone: "",
         password: "",
      });
      onClear();
   };

   return (
      <div className={styles.controlPanel}>
         <h3>Lecturer Control</h3>
         <form>
            <label>Username</label>
            <input 
               name="username" 
               value={form.username} 
               onChange={handleChange}
               disabled={!!editingData}
               placeholder="e.g. ajohnson"
            />

            <label>Title</label>
            <input 
               name="title" 
               value={form.title} 
               onChange={handleChange}
               placeholder="e.g. Dr., Prof."
            />

            <label>First Name</label>
            <input 
               name="firstName" 
               value={form.firstName} 
               onChange={handleChange}
               placeholder="First Name"
            />

            <label>Last Name</label>
            <input 
               name="lastName" 
               value={form.lastName} 
               onChange={handleChange}
               placeholder="Last Name"
            />

            <label>Email</label>
            <input 
               name="email" 
               type="email" 
               value={form.email} 
               onChange={handleChange}
               placeholder="example@domain.com"
            />

            <label>Phone</label>
            <input 
               name="phone" 
               value={form.phone} 
               onChange={handleChange}
               placeholder="+66 0000 0000"
            />

            <label>Password {editingData && "(leave empty to keep current)"}</label>
            <input 
               name="password" 
               type="password" 
               value={form.password} 
               onChange={handleChange}
               placeholder={editingData ? "Leave empty to keep current" : "Required for new lecturer"}
            />

            <div className={styles.buttonGroup}>
               <button 
                  type="button" 
                  onClick={handleAdd} 
                  className={styles.addBtn}
                  disabled={!!editingData}
               >
                  Add
               </button>
               <button 
                  type="button" 
                  onClick={handleUpdate} 
                  className={styles.updateBtn}
                  disabled={!editingData}
               >
                  Update
               </button>
               <button 
                  type="button" 
                  onClick={handleDelete} 
                  className={styles.deleteBtn}
                  disabled={!editingData}
               >
                  Delete
               </button>
               <button
                  type="button"
                  onClick={handleClear}
                  className={styles.clearBtn}
               >
                  Clear
               </button>
            </div>
         </form>
      </div>
   );
}