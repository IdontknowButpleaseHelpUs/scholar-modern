import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Page from "./Page"; 
import Profile from "./Profile";
import Dashboard from "./Dashboard";
import SettingPage from "./Settings";
import CourseView from "./CourseView";
import Login from "./components/Login"; 

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<SettingPage />} />
        <Route path="/course/view" element={<CourseView />} />
        {/* you can add more routes later */}
      </Routes>
    </Router>
  );
};

export default App;
