import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Page from "./Page"; // your main front page
import Login from "./components/Login"; // login component we just made
import Profile from "./Profile";
import SettingPage from "./Settings";
import Dashboard from "./Dashboard";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<SettingPage />} />
        {/* you can add more routes later */}
      </Routes>
    </Router>
  );
};

export default App;
