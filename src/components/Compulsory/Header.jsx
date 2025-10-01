// Header.jsx - Fixed version with proper token expiry checking
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "../../styles/header.module.css";
import { makeGuest } from "../../utils/auth";

const Header = ({ sidebarOpen, toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggedUser, setLoggedUser] = useState(makeGuest());
  const navigate = useNavigate();
  const location = useLocation();

  // Load user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("loggedUser");
    let user;
    try {
      user = stored ? JSON.parse(stored) : makeGuest();
    } catch (e) {
      user = makeGuest();
    }
    setLoggedUser(user);
  }, [location.pathname]);

  // Token expiry checker - Skip on login page
  useEffect(() => {
    // Don't check token on login page
    if (location.pathname === "/login") {
      return;
    }

    const checkTokenExpiration = () => {
      const stored = localStorage.getItem("loggedUser");
      if (!stored) return;

      try {
        const user = JSON.parse(stored);
        const token = user?.token;

        // Skip check for guest users
        if (!token || token === "guest_token_secret_n0t_real" || user.role === "guest") {
          return;
        }

        // Check if token has JWT format (3 parts separated by dots)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn("Invalid token format");
          return;
        }

        try {
          // Decode JWT payload
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          // Check if token has expired
          if (payload.exp && payload.exp < currentTime) {
            alert("Your session has expired. Please log in again.");
            handleLogout();
            const currentPage = location.pathname;
            if (currentPage !== "/") {
              navigate("/");
            } else {
              navigate(currentPage);
            }
          }
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Set up interval to check every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const confirmLogout = () => {
    const confirm = window.confirm("Are you sure you want to log out?");
    if (confirm) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    console.log("Logging out as", loggedUser.role);
    
    setTimeout(() => {
      localStorage.removeItem("loggedUser");
      setLoggedUser(makeGuest());
      setDropdownOpen(false);
      navigate("/");
    }, 3000);
  };

  return (
    <div className={styles.header}>
      {/* Menu Logo */}
      <img
        src="/assets/menu.png"
        alt="menu logo"
        className={`${styles.menuLogo} ${sidebarOpen ? styles.menuLogoActive : ""}`}
        onClick={toggleSidebar}
      />

      {/* Right items */}
      <div className={styles.rightHeaderItems}>
        {loggedUser.role === "guest" ? (
          <Link className={styles.loginButton} to="/login">
            Login
          </Link>
        ) : (
          <span className={styles.loginButton}>{loggedUser.name || loggedUser.username}</span>
        )}

        <img src="/assets/user.png" alt="pfp" className={styles.pfp} />
        <img
          src="/assets/down-arrow.png"
          alt="drop down arrow"
          className={`${styles.dropDown} ${dropdownOpen ? styles.dropDownActive : ""}`}
          onClick={toggleDropdown}
        />

        <div
          className={`${styles.dropdownContent} ${dropdownOpen ? styles.dropdownContentActive : ""}`}
        >
          <Link className={styles.dropdownContentA} to="/settings">
            Settings
          </Link>
          <Link className={styles.dropdownContentA} to="/profile">
            Profile
          </Link>
          <Link className={styles.dropdownContentA} onClick={confirmLogout}>
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;