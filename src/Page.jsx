import React, { useEffect, useState } from "react";
import Header from "./components/Compulsory/Header";
import Sidebar from "./components/Compulsory/Sidebar";
import Footer from "./components/Compulsory/Footer";
import CompulsoryBanner from "./components/Compulsory/CompulsoryBanner";
import MainCompo from "./components/Compulsory/MainCompo";
import SearchBar from "./components/Compulsory/SearchBar";
import CourseCards from "./components/Courses/CourseCards";
import AdminPanel from "./components/Admin/AdminPanel";
import { makeGuest } from "./utils/auth";

import styles from "./styles/page.module.css";

const BACKENDURL = "http://127.0.0.1:5000/api";
const BACKENDHOST = "https://scholar-modern.onrender.com/api";

const Page = () => {
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [loggedUser, setLoggedUser] = useState(makeGuest());
   const [courses, setCourses] = useState([]);

   const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
   const closeSidebar = () => setSidebarOpen(false);

   // ====== Auth + Redirect Handling ======
   useEffect(() => {
      let user = null;

      try {
         const stored = localStorage.getItem("loggedUser");
         user = stored ? JSON.parse(stored) : null;
      } catch (e) {
         console.warn("Invalid loggedUser in storage, resetting to guest.");
         user = null;
      }

      if (!user || !user.token) {
         user = makeGuest();
         localStorage.setItem("loggedUser", JSON.stringify(user));
      }

      setLoggedUser(user);
      console.log("Page: current user:", user);
   }, []);

   // ====== Fetch Courses ======
   useEffect(() => {
      let cancelled = false;

      const fetchCourses = async () => {
         try {
            const url = `${BACKENDURL}/courses`;

            const opts = {
               method: "GET",
               headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${loggedUser.token || "guest"}`,
               },
            };

            const res = await fetch(url, opts);

            if (res.status === 401 || res.status === 403) {
               console.log("Token rejected by API – switching to guest view");
               const guest = makeGuest();
               localStorage.setItem("loggedUser", JSON.stringify(guest));
               if (!cancelled) {
                  setLoggedUser(guest);
                  setCourses([]);
               }
               return;
            }

            if (!res.ok) throw new Error(`Failed to fetch courses (${res.status})`);

            const data = await res.json();

            const coursesArray = Array.isArray(data.data) ? data.data : [];

            if (!cancelled) setCourses(coursesArray);

         } catch (err) {
            console.error("Error fetching courses:", err);
            if (!cancelled) setCourses([]);
         }
      };

      fetchCourses();
      return () => { cancelled = true; };
   }, []);

   return (
      <div className={styles.container}>
         <div className="main">
            <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <Sidebar
               isOpen={sidebarOpen}
               loggedUser={loggedUser}
               closeSidebar={() => setSidebarOpen(false)}
            />
         </div>

         {/* ====== Main Section (Courses) ====== */}
         <div className={styles.mainSection}>
            
            {loggedUser.role === "admin" && <MainCompo /> ?
               (
                  <>
                     <CompulsoryBanner />
                     <AdminPanel />
                  </>
               ) : (
                  <>
                     <MainCompo />
                     <CourseCards />
                  </>
               )}
         </div>
         <Footer />

      </div>
   );
};

export default Page;
