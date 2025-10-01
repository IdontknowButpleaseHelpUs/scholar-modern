import React, { useEffect, useState } from "react";
import { makeGuest, rand } from "../../utils/auth";
import styles from "../../styles/coursecards.module.css";

const CourseCards = () => {
   const [courses, setCourses] = useState([]);
   const [loading, setLoading] = useState(true);

   const loggedUser =
      JSON.parse(localStorage.getItem("loggedUser")) || makeGuest();

   useEffect(() => {
      const fetchCourses = async () => {
         setLoading(true);
         try {
            const res = await fetch("http://127.0.0.1:5000/api/courses", {
               headers: {
                  "Content-Type": "application/json",
                  "Authorization": `${loggedUser.token }`
               }
            });

            if (!res.ok) throw new Error("Failed to fetch courses");
            const data = await res.json();
            let allCourses = Array.isArray(data.data) ? data.data : [];

            // === Student: only keep their courses ===
            if (loggedUser.role === "student") {
               allCourses = allCourses.filter(course =>
                  (loggedUser.courses || []).includes(course.courseid)
               );
            }

            // === Guest: empty course list ===
            // if (loggedUser.role === "guest") {
            //    allCourses = [];
            // }

            setCourses(allCourses);
         } catch (err) {
            console.error("Error loading courses:", err);
            setCourses([]);
         } finally {
            setLoading(false);
         }
      };

      fetchCourses();
   }, []);

   const makeGradient = () => {
      const topColor = `rgba(${rand()}, ${rand()}, ${rand()}, 0.4)`;
      const bottomColor = `rgba(${rand()}, ${rand()}, ${rand()}, 0.4)`;
      const overlayOpacity = (Math.random() * 0.2 + 0.3).toFixed(2);
      return {
         background: `linear-gradient(to bottom, ${topColor}, ${bottomColor})`,
         overlayOpacity,
      };
   };

   if (loading) {
      return <p className={styles.emptyMessage}>Loading courses...</p>;
   }

   if (!courses.length) {
      if (loggedUser.role === "guest") {
         return <p className={styles.emptyMessage}>👤 Guest view — please login.</p>;
      }
      if (loggedUser.role === "student") {
         return <p className={styles.emptyMessage}>You have no courses assigned!</p>;
      }
      return <p className={styles.emptyMessage}>No courses found.</p>;
   }

   return (
      <div className={styles.courseGrid} id="courseGrid">
         {courses.map((course, idx) => {
            const key = course.courseid || course.id || course._id || `${idx}`;
            const title = course.title || course.name || "Untitled Course";
            const courseId = course.courseid || course.id || course.code || `unknown-${idx}`;
            const description = course.description || "No description available.";

            const gradient = makeGradient();

            return (
               <div
                  key={key}
                  className={styles.courseCard}
                  onClick={() => {
                     const courseIdEncoded = encodeURIComponent(courseId);
                     window.location.href = `/course/view?id=${courseIdEncoded}`;
                  }}
               >
                  <div
                     className={styles.courseCardHeader}
                     style={{ background: gradient.background }}
                  >
                     <div
                        className={styles.courseCardOverlay}
                        style={{ background: `rgba(255,255,255,${gradient.overlayOpacity})` }}
                     />
                     <h3>{title}</h3>
                     <span className={styles.courseId}>{courseId}</span>
                  </div>
                  <p>{description}</p>
               </div>
            );
         })}
      </div>
   );
};

export default CourseCards;
