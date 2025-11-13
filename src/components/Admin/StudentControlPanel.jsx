import React, { useState, useEffect } from "react";
import styles from "../../styles/admin.module.css";

function StudentControlPanel({ editingData, courses, onAdd, onUpdate, onDelete, onClear }) {
   const [form, setForm] = useState({
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      courses: [],
   });
   const [syncing, setSyncing] = useState(false);

   const BACKENDURL = "http://127.0.0.1:5000/api";
   const BACKENDHOST = "https://scholar-modern.onrender.com/api";

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

   // Sync student to course members
   const syncStudentToCourses = async (username, newCourses, oldCourses = []) => {
      setSyncing(true);
      const token = JSON.parse(localStorage.getItem("loggedUser"))?.token;

      try {
         // Find courses to add student to (new courses that weren't in old list)
         const coursesToAdd = newCourses.filter(c => !oldCourses.includes(c));
         
         // Find courses to remove student from (old courses not in new list)
         const coursesToRemove = oldCourses.filter(c => !newCourses.includes(c));

         console.log("Syncing courses:", { coursesToAdd, coursesToRemove });

         // Add student to new courses
         for (const courseId of coursesToAdd) {
            await addStudentToCourse(courseId, username, token);
         }

         // Remove student from removed courses
         for (const courseId of coursesToRemove) {
            await removeStudentFromCourse(courseId, username, token);
         }

         console.log("Course sync completed");
      } catch (err) {
         console.error("❌ Error syncing courses:", err);
         alert("Warning: Student saved but course sync may have failed. Please refresh and check course members.");
      } finally {
         setSyncing(false);
      }
   };

   const addStudentToCourse = async (courseId, username, token) => {
      try {
         // Fetch current course data
         const res = await fetch(`${BACKENDURL}/courses`, {
            headers: { "Authorization": token }
         });
         const data = await res.json();
         const course = data.data.find(c => c.courseid === courseId);

         if (!course) {
            console.warn(`Course ${courseId} not found`);
            return;
         }

         // Initialize members if not exists
         if (!course.members) {
            course.members = { lecturer: [], asstProf: [], students: [] };
         }
         if (!course.members.students) {
            course.members.students = [];
         }

         // Add student if not already in list
         if (!course.members.students.includes(username)) {
            course.members.students.push(username);

            // Update course
            await fetch(`${BACKENDURL}/courses/${courseId}`, {
               method: "PUT",
               headers: {
                  "Content-Type": "application/json",
                  "Authorization": token
               },
               body: JSON.stringify({ members: course.members })
            });

            console.log(`Added ${username} to course ${courseId}`);
         }
      } catch (err) {
         console.error(`Error adding student to course ${courseId}:`, err);
      }
   };

   const removeStudentFromCourse = async (courseId, username, token) => {
      try {
         // Fetch current course data
         const res = await fetch(`${BACKENDURL}/courses`, {
            headers: { "Authorization": token }
         });
         const data = await res.json();
         const course = data.data.find(c => c.courseid === courseId);

         if (!course || !course.members || !course.members.students) {
            console.warn(`Course ${courseId} not found or has no students`);
            return;
         }

         // Remove student from list
         const studentIndex = course.members.students.indexOf(username);
         if (studentIndex > -1) {
            course.members.students.splice(studentIndex, 1);

            // Update course
            await fetch(`${BACKENDURL}/courses/${courseId}`, {
               method: "PUT",
               headers: {
                  "Content-Type": "application/json",
                  "Authorization": token
               },
               body: JSON.stringify({ members: course.members })
            });

            console.log(`Removed ${username} from course ${courseId}`);
         }
      } catch (err) {
         console.error(`Error removing student from course ${courseId}:`, err);
      }
   };

   const handleAdd = async () => {
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

      // Add student first
      await onAdd(studentData);

      // Then sync to courses
      if (form.courses.length > 0) {
         await syncStudentToCourses(form.username, form.courses, []);
      }

      handleClear();
   };

   const handleUpdate = async () => {
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

      // Get old courses before update
      const oldCourses = editingData?.courses || [];

      // Update student first
      await onUpdate(studentData);

      // Then sync courses (add to new, remove from old)
      await syncStudentToCourses(form.username, form.courses, oldCourses);

      handleClear();
   };

   const handleDelete = async () => {
      if (!form.username) {
         alert("Please select a student to delete!");
         return;
      }

      // Remove student from all their courses before deleting
      if (form.courses.length > 0) {
         await syncStudentToCourses(form.username, [], form.courses);
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
         {syncing && (
            <div style={{ 
               padding: '10px', 
               background: '#fff3cd', 
               border: '1px solid #ffc107',
               borderRadius: '6px',
               marginBottom: '10px',
               textAlign: 'center'
            }}>
               ⏳ Syncing courses...
            </div>
         )}
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
            <p style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '5px' }}>
               💡 Changes will automatically sync to course members
            </p>

            <div className={styles.buttonGroup}>
               <button
                  type="button"
                  onClick={handleAdd}
                  className={styles.addBtn}
                  disabled={!!editingData || syncing}
               >
                  {syncing ? "⏳ Syncing..." : "Add"}
               </button>
               <button
                  type="button"
                  onClick={handleUpdate}
                  className={styles.updateBtn}
                  disabled={!editingData || syncing}
               >
                  {syncing ? "⏳ Syncing..." : "Update"}
               </button>
               <button
                  type="button"
                  onClick={handleDelete}
                  className={styles.deleteBtn}
                  disabled={!editingData || syncing}
               >
                  Delete
               </button>
               <button
                  type="button"
                  onClick={handleClear}
                  className={styles.clearBtn}
                  disabled={syncing}
               >
                  Clear
               </button>
            </div>
         </form>
      </div>
   );
}

export default StudentControlPanel;