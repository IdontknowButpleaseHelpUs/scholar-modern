import React, { useState, useEffect } from "react";
import styles from "../../styles/admin.module.css";

export default function CourseControlPanel({ lecturers, editingData, onAdd, onUpdate, onDelete, onClear }) {
   const [form, setForm] = useState({
      id: "",
      name: "",
      credits: "",
      lecturer: "",
      schedule: "",
      description: "",
   });

   // Update form when editingData changes
   useEffect(() => {
      if (editingData) {
         setForm({
            id: editingData.courseid || "",
            name: editingData.title || editingData.courseName || "",
            credits: editingData.credit || editingData.credits || "",
            lecturer: editingData.lecturer || "",
            schedule: editingData.schedule || "",
            description: editingData.description || "",
         });
      }
   }, [editingData]);

   const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
   };

   const handleAdd = () => {
      if (!form.id || !form.name || !form.credits) {
         alert("Course ID, Name, and Credits are required!");
         return;
      }

      const courseData = {
         courseid: form.id,
         title: form.name,
         credit: parseInt(form.credits),
         lecturer: form.lecturer,
         schedule: form.schedule,
         description: form.description,
         members: {
            lecturer: form.lecturer ? [form.lecturer] : [],
            asstProf: [],
            students: []
         }
      };

      onAdd(courseData);
      handleClear();
   };

   const handleUpdate = () => {
      if (!form.id || !form.name) {
         alert("Course ID and Name are required!");
         return;
      }

      const courseData = {
         courseid: form.id,
         title: form.name,
         credit: parseInt(form.credits),
         lecturer: form.lecturer,
         schedule: form.schedule,
         description: form.description,
      };

      onUpdate(courseData);
      handleClear();
   };

   const handleDelete = () => {
      if (!form.id) {
         alert("Please select a course to delete!");
         return;
      }
      onDelete(form.id);
      handleClear();
   };

   const handleClear = () => {
      setForm({
         id: "",
         name: "",
         credits: "",
         lecturer: "",
         schedule: "",
         description: "",
      });
      onClear();
   };

   return (
      <div className={styles.controlPanel}>
         <h3>Course Control</h3>
         <form>
            <label>Course ID</label>
            <input 
               name="id" 
               value={form.id} 
               onChange={handleChange} 
               placeholder="e.g. 96011111"
               disabled={!!editingData}
            />

            <label>Course Name</label>
            <input 
               name="name" 
               value={form.name} 
               onChange={handleChange} 
               placeholder="Course Name" 
            />

            <label>Course Credits</label>
            <input
               type="number"
               name="credits"
               value={form.credits}
               onChange={handleChange}
               min="1"
               max="4"
            />

            <label>Lecturer</label>
            <select name="lecturer" value={form.lecturer} onChange={handleChange}>
               <option value="">-- Select Lecturer --</option>
               {lecturers.map((lec) => (
                  <option key={lec.username} value={lec.username}>
                     {lec.title} {lec.firstName} {lec.lastName}
                  </option>
               ))}
            </select>

            <label>Schedule</label>
            <input
               name="schedule"
               value={form.schedule}
               onChange={handleChange}
               placeholder="Mon 9:00 AM - 12:00 PM"
            />

            <label>Description</label>
            <textarea
               name="description"
               value={form.description}
               onChange={handleChange}
               placeholder="Enter course description"
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