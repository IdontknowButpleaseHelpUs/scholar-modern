import React from "react";
import AdminPanel from "./components/AdminPanel";
import CourseCards from "./components/CourseCards";
import Page from "./Page";
import { makeGuest } from "./utils/auth";

const Dashboard = () => {
   const loggedUser = JSON.parse(localStorage.getItem("loggedUser")) || makeGuest();

   let content;
   if (loggedUser.role === "admin") {
      content = <AdminPanel />;
   } else if (loggedUser.role === "student") {
      content = <CourseCards courses={loggedUser.courses || []} />;
   } else if (loggedUser.role === "lecturer") {
      content = <p>📚 Lecturer Dashboard (customize later)</p>;
   } else {
      content = <Page></Page>;
   }

   return <Page>{content}</Page>;
};

export default Dashboard;
