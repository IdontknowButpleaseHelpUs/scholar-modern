// src/components/AdminPanel.jsx - Fully Functional Version
import React, { useEffect, useState } from "react";
import styles from "../../styles/admin.module.css";
import CourseControlPanel from "./CourseControlPanel";
import LecturerControlPanel from "./LecturerControlPanel";
import StudentControlPanel from "./StudentControlPanel";
import { loadProfilePics } from "../../utils/profileDynamicLoader";

export default function AdminPanel({ token }) {
   const [loggedUser, setLoggedUser] = useState(null);
   const [activeTab, setActiveTab] = useState("dashboard");
   const [lecturers, setLecturers] = useState([]);
   const [searchLecturer, setSearchLecturer] = useState("");
   const [searchCourse, setSearchCourse] = useState("");
   const [searchStudent, setSearchStudent] = useState("");
   const [courses, setCourses] = useState([]);
   const [students, setStudents] = useState([]);
   
   // Edit states
   const [editingCourse, setEditingCourse] = useState(null);
   const [editingLecturer, setEditingLecturer] = useState(null);
   const [editingStudent, setEditingStudent] = useState(null);

   // --- Authentication check ---
   useEffect(() => {
      const user = JSON.parse(localStorage.getItem("loggedUser"));
      if (!user || !user.token) {
         alert("Please log in first!");
         window.location.href = "/login";
         return;
      }
      if (user.role !== "admin") {
         alert("You are not authorized!");
         window.location.href = "/login";
         return;
      }
      setLoggedUser(user);
   }, []);

   // --- Profile load ---
   useEffect(() => {
      if (!loggedUser) return;
      async function loadProfile() {
         try {
            const res = await fetch(
               `http://127.0.0.1:5000/api/${loggedUser.role}/${loggedUser.username}`,
               { headers: { Authorization: loggedUser.token } }
            );
            if (!res.ok) throw new Error("Failed to load profile");
            const data = await res.json();
            const welcomeText = document.getElementById("welcomeUser");
            const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
            if (welcomeText) {
               welcomeText.textContent = `Welcome, ${loggedUser.title || ""} ${fullName || loggedUser.username}!`;
            }
            const pfpElement = document.getElementById("pfp");
            if (pfpElement) {
               loadProfilePics(data.profilePic, null, pfpElement);
            }
         } catch (err) {
            console.error(err);
         }
      }
      loadProfile();
   }, [loggedUser]);

   // --- Fetch lecturers ---
   const fetchLecturers = async () => {
      if (!loggedUser) return;
      try {
         const res = await fetch("http://127.0.0.1:5000/api/lecturers", {
            headers: { Authorization: loggedUser.token },
         });
         if (!res.ok) throw new Error("Failed to fetch lecturers");
         const data = await res.json();
         setLecturers(data.data || []);
      } catch (err) {
         console.error("Error fetching lecturers:", err);
      }
   };

   useEffect(() => {
      fetchLecturers();
   }, [loggedUser]);

   // --- Fetch Courses ---
   const fetchCourses = async () => {
      if (!loggedUser) return;
      try {
         const res = await fetch("http://127.0.0.1:5000/api/courses", {
            headers: { Authorization: loggedUser.token },
         });
         if (!res.ok) throw new Error("Failed to fetch courses");
         const data = await res.json();
         setCourses(data.data || []);
      } catch (err) {
         console.error("Error fetching courses:", err);
      }
   };

   useEffect(() => {
      fetchCourses();
   }, [loggedUser]);

   // --- Fetch Students ---
   const fetchStudents = async () => {
      if (!loggedUser) return;
      try {
         const res = await fetch("http://127.0.0.1:5000/api/students", {
            headers: { Authorization: loggedUser.token },
         });
         if (!res.ok) throw new Error("Failed to fetch students");
         const data = await res.json();
         const studentsArray = Array.isArray(data.data) 
            ? data.data 
            : Object.values(data.data || {});
         setStudents(studentsArray);
      } catch (err) {
         console.error("Error fetching students:", err);
      }
   };

   useEffect(() => {
      fetchStudents();
   }, [loggedUser]);

   // --- Filter functions ---
   const filteredLecturers = lecturers.filter((lec) => {
      const query = searchLecturer.toLowerCase();
      return (
         lec.username.toLowerCase().includes(query) ||
         `${lec.firstName || ""} ${lec.lastName || ""}`.toLowerCase().includes(query) ||
         (lec.title || "").toLowerCase().includes(query) ||
         (lec.email || "").toLowerCase().includes(query)
      );
   });

   const filteredCourses = courses.filter((course) => {
      const query = searchCourse.toLowerCase();
      return (
         (course.courseid || "").toLowerCase().includes(query) ||
         (course.title || "").toLowerCase().includes(query) ||
         (course.lecturer || "").toLowerCase().includes(query)
      );
   });

   const filteredStudents = students.filter((student) => {
      const query = searchStudent.toLowerCase();
      return (
         (student.username || "").toLowerCase().includes(query) ||
         `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase().includes(query) ||
         (student.email || "").toLowerCase().includes(query)
      );
   });

   // --- Course Handlers ---
   const handleAddCourse = async (courseData) => {
      try {
         const res = await fetch("http://127.0.0.1:5000/api/courses", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": loggedUser.token
            },
            body: JSON.stringify(courseData)
         });
         if (!res.ok) throw new Error("Failed to add course");
         alert("Course added successfully!");
         fetchCourses();
         setEditingCourse(null);
      } catch (err) {
         alert("Error adding course: " + err.message);
      }
   };

   const handleUpdateCourse = async (courseData) => {
      if (!editingCourse) {
         alert("Please select a course to edit first!");
         return;
      }
      try {
         const res = await fetch(`http://127.0.0.1:5000/api/courses/${editingCourse.courseid}`, {
            method: "PUT",
            headers: {
               "Content-Type": "application/json",
               "Authorization": loggedUser.token
            },
            body: JSON.stringify(courseData)
         });
         if (!res.ok) throw new Error("Failed to update course");
         alert("Course updated successfully!");
         fetchCourses();
         setEditingCourse(null);
      } catch (err) {
         alert("Error updating course: " + err.message);
      }
   };

   const handleDeleteCourse = async (courseid) => {
      const confirm = window.confirm(`Are you sure you want to delete course ${courseid}?`);
      if (!confirm) return;

      try {
         const res = await fetch(`http://127.0.0.1:5000/api/courses/${courseid}`, {
            method: "DELETE",
            headers: { "Authorization": loggedUser.token }
         });
         if (!res.ok) throw new Error("Failed to delete course");
         alert("Course deleted successfully!");
         fetchCourses();
         setEditingCourse(null);
      } catch (err) {
         alert("Error deleting course: " + err.message);
      }
   };

   // --- Lecturer Handlers ---
   const handleAddLecturer = async (lecturerData) => {
      try {
         const res = await fetch("http://127.0.0.1:5000/api/lecturers", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": loggedUser.token
            },
            body: JSON.stringify(lecturerData)
         });
         if (!res.ok) throw new Error("Failed to add lecturer");
         alert("Lecturer added successfully!");
         fetchLecturers();
         setEditingLecturer(null);
      } catch (err) {
         alert("Error adding lecturer: " + err.message);
      }
   };

   const handleUpdateLecturer = async (lecturerData) => {
      if (!editingLecturer) {
         alert("Please select a lecturer to edit first!");
         return;
      }
      try {
         const res = await fetch(`http://127.0.0.1:5000/api/lecturers/${editingLecturer.username}`, {
            method: "PUT",
            headers: {
               "Content-Type": "application/json",
               "Authorization": loggedUser.token
            },
            body: JSON.stringify(lecturerData)
         });
         if (!res.ok) throw new Error("Failed to update lecturer");
         alert("Lecturer updated successfully!");
         fetchLecturers();
         setEditingLecturer(null);
      } catch (err) {
         alert("Error updating lecturer: " + err.message);
      }
   };

   const handleDeleteLecturer = async (username) => {
      const confirm = window.confirm(`Are you sure you want to delete lecturer ${username}?`);
      if (!confirm) return;

      try {
         const res = await fetch(`http://127.0.0.1:5000/api/lecturers/${username}`, {
            method: "DELETE",
            headers: { "Authorization": loggedUser.token }
         });
         if (!res.ok) throw new Error("Failed to delete lecturer");
         alert("Lecturer deleted successfully!");
         fetchLecturers();
         setEditingLecturer(null);
      } catch (err) {
         alert("Error deleting lecturer: " + err.message);
      }
   };

   // --- Student Handlers ---
   const handleAddStudent = async (studentData) => {
      try {
         const res = await fetch("http://127.0.0.1:5000/api/students", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": loggedUser.token
            },
            body: JSON.stringify(studentData)
         });
         if (!res.ok) throw new Error("Failed to add student");
         alert("Student added successfully!");
         fetchStudents();
         setEditingStudent(null);
      } catch (err) {
         alert("Error adding student: " + err.message);
      }
   };

   const handleUpdateStudent = async (studentData) => {
      if (!editingStudent) {
         alert("Please select a student to edit first!");
         return;
      }
      try {
         const res = await fetch(`http://127.0.0.1:5000/api/students/${editingStudent.username}`, {
            method: "PUT",
            headers: {
               "Content-Type": "application/json",
               "Authorization": loggedUser.token
            },
            body: JSON.stringify(studentData)
         });
         if (!res.ok) throw new Error("Failed to update student");
         alert("Student updated successfully!");
         fetchStudents();
         setEditingStudent(null);
      } catch (err) {
         alert("Error updating student: " + err.message);
      }
   };

   const handleDeleteStudent = async (username) => {
      const confirm = window.confirm(`Are you sure you want to delete student ${username}?`);
      if (!confirm) return;

      try {
         const res = await fetch(`http://127.0.0.1:5000/api/students/${username}`, {
            method: "DELETE",
            headers: { "Authorization": loggedUser.token }
         });
         if (!res.ok) throw new Error("Failed to delete student");
         alert("Student deleted successfully!");
         fetchStudents();
         setEditingStudent(null);
      } catch (err) {
         alert("Error deleting student: " + err.message);
      }
   };

   return (
      <div className={styles.dashboardContainer}>
         <div className={styles.tabNav}>
            <button
               className={`${styles.tabBtn} ${activeTab === "dashboard" ? styles.active : ""}`}
               onClick={() => setActiveTab("dashboard")}
            >
               Dashboard
            </button>
            <button
               className={`${styles.tabBtn} ${activeTab === "courses" ? styles.active : ""}`}
               onClick={() => setActiveTab("courses")}
            >
               Manage Courses
            </button>
            <button
               className={`${styles.tabBtn} ${activeTab === "lecturers" ? styles.active : ""}`}
               onClick={() => setActiveTab("lecturers")}
            >
               Manage Lecturers
            </button>
            <button
               className={`${styles.tabBtn} ${activeTab === "students" ? styles.active : ""}`}
               onClick={() => setActiveTab("students")}
            >
               Manage Students
            </button>
         </div>

         <div className={styles.dashboardContent}>
            {activeTab === "dashboard" && (
               <section>
                  <h1>Admin Dashboard</h1>
                  <p>Welcome back, Admin! Here's a quick overview:</p>
                  <div className={styles.cards}>
                     <div className={styles.card}>
                        <h3>Students</h3>
                        <p>{students.length} registered</p>
                     </div>
                     <div className={styles.card}>
                        <h3>Courses</h3>
                        <p>{courses.length} active</p>
                     </div>
                     <div className={styles.card}>
                        <h3>Lecturers</h3>
                        <p>{lecturers.length} total</p>
                     </div>
                  </div>
               </section>
            )}

            {activeTab === "lecturers" && (
               <section>
                  <h1>Manage Lecturers</h1>
                  <div className={styles.managementSection}>
                     <div className={styles.tableSection}>
                        <input
                           type="text"
                           placeholder="Search lecturer..."
                           value={searchLecturer}
                           className={styles.searchBar}
                           onChange={(e) => setSearchLecturer(e.target.value)}
                           style={{ marginBottom: "1rem", padding: "0.5rem" }}
                        />
                        <table>
                           <thead>
                              <tr>
                                 <th>Username</th>
                                 <th>Title</th>
                                 <th>Full Name</th>
                                 <th>Email</th>
                                 <th>Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {filteredLecturers.map((lec, idx) => (
                                 <tr key={idx}>
                                    <td>{lec.username}</td>
                                    <td>{lec.title || ""}</td>
                                    <td>{`${lec.firstName || ""} ${lec.lastName || ""}`}</td>
                                    <td>{lec.email || ""}</td>
                                    <td>
                                       <button 
                                          className={styles.editBtn}
                                          onClick={() => setEditingLecturer(lec)}
                                       >
                                          Edit
                                       </button>
                                       <button 
                                          className={styles.deleteBtn}
                                          onClick={() => handleDeleteLecturer(lec.username)}
                                       >
                                          Delete
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                              {filteredLecturers.length === 0 && (
                                 <tr>
                                    <td colSpan="5" style={{ textAlign: "center" }}>
                                       No lecturers found.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>

                     <LecturerControlPanel
                        editingData={editingLecturer}
                        onAdd={handleAddLecturer}
                        onUpdate={handleUpdateLecturer}
                        onDelete={handleDeleteLecturer}
                        onClear={() => setEditingLecturer(null)}
                     />
                  </div>
               </section>
            )}

            {activeTab === "courses" && (
               <section>
                  <h1>Manage Courses</h1>
                  <div className={styles.managementSection}>
                     <div className={styles.tableSection}>
                        <input
                           type="text"
                           placeholder="Search courses..."
                           value={searchCourse}
                           className={styles.searchBar}
                           onChange={(e) => setSearchCourse(e.target.value)}
                           style={{ marginBottom: "1rem", padding: "0.5rem" }}
                        />
                        <table>
                           <thead>
                              <tr>
                                 <th>Course ID</th>
                                 <th>Course Name</th>
                                 <th>Teacher</th>
                                 <th>Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {filteredCourses.map((course, idx) => (
                                 <tr key={idx}>
                                    <td>{course.courseid || "N/A"}</td>
                                    <td>{course.title || course.courseName || "Untitled"}</td>
                                    <td>{course.lecturer || course.teacher || "Unassigned"}</td>
                                    <td>
                                       <button 
                                          className={styles.editBtn}
                                          onClick={() => setEditingCourse(course)}
                                       >
                                          Edit
                                       </button>
                                       <button 
                                          className={styles.deleteBtn}
                                          onClick={() => handleDeleteCourse(course.courseid)}
                                       >
                                          Delete
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                              {filteredCourses.length === 0 && (
                                 <tr>
                                    <td colSpan="4" style={{ textAlign: "center" }}>
                                       No courses found.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>

                     <CourseControlPanel
                        lecturers={lecturers}
                        editingData={editingCourse}
                        onAdd={handleAddCourse}
                        onUpdate={handleUpdateCourse}
                        onDelete={handleDeleteCourse}
                        onClear={() => setEditingCourse(null)}
                     />
                  </div>
               </section>
            )}

            {activeTab === "students" && (
               <section>
                  <h1>Manage Students</h1>
                  <div className={styles.managementSection}>
                     <div className={styles.tableSection}>
                        <input
                           type="text"
                           placeholder="Search students..."
                           value={searchStudent}
                           className={styles.searchBar}
                           onChange={(e) => setSearchStudent(e.target.value)}
                           style={{ marginBottom: "1rem", padding: "0.5rem" }}
                        />
                        <table>
                           <thead>
                              <tr>
                                 <th>Username</th>
                                 <th>Full Name</th>
                                 <th>Email</th>
                                 <th>Phone</th>
                                 <th>Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {filteredStudents.map((student, idx) => (
                                 <tr key={idx}>
                                    <td>{student.username}</td>
                                    <td>{`${student.firstName || ""} ${student.lastName || ""}`}</td>
                                    <td>{student.email || ""}</td>
                                    <td>{student.phone || ""}</td>
                                    <td>
                                       <button 
                                          className={styles.editBtn}
                                          onClick={() => setEditingStudent(student)}
                                       >
                                          Edit
                                       </button>
                                       <button 
                                          className={styles.deleteBtn}
                                          onClick={() => handleDeleteStudent(student.username)}
                                       >
                                          Delete
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                              {filteredStudents.length === 0 && (
                                 <tr>
                                    <td colSpan="5" style={{ textAlign: "center" }}>
                                       No students found.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>

                     <StudentControlPanel
                        editingData={editingStudent}
                        courses={courses}
                        onAdd={handleAddStudent}
                        onUpdate={handleUpdateStudent}
                        onDelete={handleDeleteStudent}
                        onClear={() => setEditingStudent(null)}
                     />
                  </div>
               </section>
            )}
         </div>
      </div>
   );
}