import React, { useState, useEffect } from 'react';
import styles from '../../styles/profiledashboard.module.css';

const BACKENDURL = "http://127.0.0.1:5000/api";
const BACKENDHOST = "https://scholar-modern.onrender.com/api";

const ProfileDashboard = ({ loggedUser, profileData }) => {
  const [courses, setCourses] = useState([]);
  const [pendingHomework, setPendingHomework] = useState([]);

  useEffect(() => {
    fetchCourses();
    if (loggedUser.role === 'student') {
      getPendingHomework();
    }
  }, [loggedUser]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${BACKENDURL}/courses`, {
        headers: { Authorization: `Bearer ${loggedUser.token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = await res.json();
      let allCourses = Array.isArray(data.data) ? data.data : [];

      // Filter courses based on role
      if (loggedUser.role === 'student') {
        allCourses = allCourses.filter(course =>
          (profileData.courses || []).includes(course.courseid)
        );
      } else if (loggedUser.role === 'lecturer') {
        allCourses = allCourses.filter(course =>
          (profileData.courses || []).includes(course.courseid)
        );
      }
      // Admin sees all courses

      setCourses(allCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    }
  };

  const getPendingHomework = () => {
    const pending = (profileData.homeworkSubmissions || []).filter(hw => !hw.submitted);
    setPendingHomework(pending);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.sectionTitle}>Dashboard Overview</h2>

      {/* Pending Homework Section (Students Only) */}
      {loggedUser.role === 'student' && (
        <div className={styles.section}>
          <h3 className={styles.subsectionTitle}>
            📝 Pending Homework ({pendingHomework.length})
          </h3>
          
          {pendingHomework.length > 0 ? (
            <div className={styles.homeworkList}>
              {pendingHomework.map((hw, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.homeworkCard} ${isOverdue(hw.dueDate) ? styles.overdue : ''}`}
                >
                  <div className={styles.homeworkHeader}>
                    <h4 className={styles.homeworkTitle}>{hw.title}</h4>
                    <span className={`${styles.dueBadge} ${isOverdue(hw.dueDate) ? styles.dueBadgeOverdue : ''}`}>
                      {isOverdue(hw.dueDate) ? 'Overdue' : 'Due'}: {formatDate(hw.dueDate)}
                    </span>
                  </div>
                  <p className={styles.homeworkCourse}>Course: {hw.courseId}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>🎉 No pending homework! You're all caught up.</p>
            </div>
          )}
        </div>
      )}

      {/* Courses Section */}
      <div className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          {loggedUser.role === 'student' ? '📚 My Courses' : loggedUser.role === 'admin' ? '📚 Available Courses' : '👨‍🏫 Teaching Courses'} ({courses.length})
        </h3>
        
        {courses.length > 0 ? (
          <div className={styles.coursesList}>
            {courses.map((course, idx) => (
              <div key={idx} className={styles.courseRow}>
                <div className={styles.courseIdColumn}>
                  <span className={styles.courseId}>{course.courseid}</span>
                </div>
                <div className={styles.courseNameColumn}>
                  <span className={styles.courseName}>{course.title}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No courses assigned yet.</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{courses.length}</p>
            <p className={styles.statLabel}>Total Courses</p>
          </div>
        </div>

        {loggedUser.role === 'student' && (
          <>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📝</div>
              <div className={styles.statContent}>
                <p className={styles.statValue}>{pendingHomework.length}</p>
                <p className={styles.statLabel}>Pending Homework</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>✓</div>
              <div className={styles.statContent}>
                <p className={styles.statValue}>
                  {(profileData.homeworkSubmissions || []).filter(hw => hw.submitted).length}
                </p>
                <p className={styles.statLabel}>Completed</p>
              </div>
            </div>
          </>
        )}

        {loggedUser.role === 'lecturer' && (
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <p className={styles.statValue}>
                {courses.reduce((total, course) => 
                  total + (course.members?.students?.length || 0), 0
                )}
              </p>
              <p className={styles.statLabel}>Total Students</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDashboard;