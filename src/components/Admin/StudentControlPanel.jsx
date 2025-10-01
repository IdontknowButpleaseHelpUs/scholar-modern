import React, { useState, useEffect } from "react";
import styles from "../../styles/admin.module.css";

export default function StudentControlPanel({ editingData, courses, onAdd, onUpdate, onDelete, onClear }) {
   const [form, setForm] = useState({
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      courses: [],
   });

   // Update form when editingData changes
   useEffect(() => {
      if (editingData) {
         setForm({
            username: editingData.username || "",
            firstName: editingData.firstName || "",
            lastName: editingData.lastName || "",
            email: editingData.email || "",
            phone: editingData.phone || "",
            password: "", // Don't show password for security
            courses: editingData.courses || [],
         });
      }
   }, [editingData]);

   const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
   };

   const handleCourseSelect = (e) => {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setForm({ ...form, courses: selectedOptions });
   };

   const handleAdd = () => {
      if (!form.username || !form.firstName || !form.lastName) {
         alert("Username, First Name, and Last Name are required!");
         return;
      }

      if (!form.password) {
         alert("Password is required for new student!");
         return;
      }

      const studentData = {
         username: form.username,
         password: form.password,
         firstName: form.firstName,
         lastName: form.lastName,
         email: form.email,
         phone: form.phone,
         country: "",
         location: "",
         description: "",
         profilePic: "",
         courses: form.courses,
         homeworkSubmissions: [],
         personalFiles: [],
         timetable: []
      };

      onAdd(studentData);
      handleClear();
   };

   const handleUpdate = () => {
      if (!form.username || !form.firstName || !form.lastName) {
         alert("Username, First Name, and Last Name are required!");
         return;
      }

      const studentData = {
         username: form.username,
         firstName: form.firstName,
         lastName: form.lastName,
         email: form.email,
         phone: form.phone,
         courses: form.courses,
      };

      // Only include password if it's been changed
      if (form.password) {
         studentData.password = form.password;
      }

      onUpdate(studentData);
      handleClear();
   };

   const handleDelete = () => {
      if (!form.username) {
         alert("Please select a student to delete!");
         return;
      }
      onDelete(form.username);
      handleClear();
   };

   const handleClear = () => {
      setForm({
         username: "",
         firstName: "",
         lastName: "",
         email: "",
         phone: "",
         password: "",
         courses: [],
      });
      onClear();
   };

   return (
      <div className={styles.controlPanel}>
         <h3>Student Control</h3>
         <form>
            <label>Username</label>
            <input
               name="username"
               value={form.username}
               onChange={handleChange}
               disabled={!!editingData}
               placeholder="e.g. student123"
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
               placeholder={editingData ? "Leave empty to keep current" : "Required for new student"}
            />

            <label>Enrolled Courses (Hold Ctrl/Cmd to select multiple)</label>
            <select
               multiple
               name="courses"
               value={form.courses}
               onChange={handleCourseSelect}
               style={{ minHeight: "120px" }}
            >
               {courses.map((course) => (
                  <option key={course.courseid} value={course.courseid}>
                     {course.courseid} - {course.title || course.courseName}
                  </option>
               ))}
            </select>

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