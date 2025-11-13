import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/login.module.css";
import Header from "./Compulsory/Header";
import Sidebar from "./Compulsory/Sidebar";
import MainCompo from "./Compulsory/MainCompo";
import Footer from "./Compulsory/Footer";
import { makeGuest } from "../utils/auth";

const BACKENDURL = "http://127.0.0.1:5000/api";
const BACKENDHOST = "https://scholar-modern.onrender.com/api";

const Login = () => {
   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");
   const [status, setStatus] = useState("");

   // ===== Sidebar state =====
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
   const closeSidebar = () => setSidebarOpen(false);

   const navigate = useNavigate();

   const handleSubmit = async (e) => {
      e.preventDefault();

      try {
         const res = await fetch(`${BACKENDURL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
         });

         const data = await res.json();

         if (data.success) {
            const loggedUserPayload = {
               username,
               role: data.role,
               name: data.name || username,
               title: data.title || "",
               firstName: data.firstName || "",
               lastName: data.lastName || "",
               courses: Array.isArray(data.courses) ? data.courses : [],
               token: data.token || "",
            };
            localStorage.setItem("loggedUser", JSON.stringify(loggedUserPayload));
            setStatus(`${data.role.toUpperCase()} logged in as "${username}"`);
            console.log("Logged in as:", loggedUserPayload);
            setTimeout(() => {
               navigate("/dashboard");
            }, 4000);
         } else {
            setStatus(data.message);
         }
      } catch (err) {
         console.error(err);
         setStatus("Server error, please try again later.");
      }
   };

   const loggedUser = JSON.parse(localStorage.getItem("loggedUser")) || makeGuest();

   return (
      <>
         {/* Header + Sidebar */}
         <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
         <Sidebar isOpen={sidebarOpen} loggedUser={loggedUser} closeSidebar={closeSidebar} />

         {/* Main content */}
         <MainCompo />
         <div className={styles.loginContainer}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className={styles.loginForm}>
               <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
               />
               <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
               />
               <button type="submit" className={styles.submitButton}>
                  Login
               </button>
               <button
                  type="button"
                  onClick={() => alert("Forgot password?")}
                  className={styles.forgotButton}
               >
                  Forgot Password?
               </button>
            </form>
            <p className={styles.status}>{status}</p>
            <button
               type="button"
               onClick={() => navigate("/")}
               className={styles.backButton}
            >
               ← Go Back
            </button>
         </div>

         <Footer />
      </>
   );
};

export default Login;
