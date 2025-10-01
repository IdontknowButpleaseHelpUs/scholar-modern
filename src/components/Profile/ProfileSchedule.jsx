import React, { useState, useEffect } from 'react';
import styles from '../../styles/profileschedule.module.css';

const ProfileSchedule = ({ loggedUser, profileData }) => {
  const [courses, setCourses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    fetchCourses();
  }, [loggedUser]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/courses', {
        headers: { Authorization: `Bearer ${loggedUser.token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = await res.json();
      let allCourses = Array.isArray(data.data) ? data.data : [];

      // Filter user's courses
      allCourses = allCourses.filter(course =>
        (profileData.courses || []).includes(course.courseid)
      );

      setCourses(allCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    }
  };

  const parseSchedule = (scheduleStr) => {
    // Example: "Mon 9:00 AM - 12:00 PM" or "Tue 1:00 PM - 4:00 PM"
    if (!scheduleStr) return null;
    
    const parts = scheduleStr.split(' ');
    if (parts.length < 4) return null;
    
    return {
      day: parts[0],
      startTime: parts[1] + ' ' + parts[2],
      endTime: parts[4] + ' ' + parts[5]
    };
  };

  const getDayOfWeek = (dayStr) => {
    const dayMap = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 
      'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    return dayMap[dayStr] || -1;
  };

  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getCoursesForDay = (date) => {
    if (!date) return [];
    const dayOfWeek = date.getDay();
    
    return courses.filter(course => {
      const schedule = parseSchedule(course.schedule);
      if (!schedule) return false;
      return getDayOfWeek(schedule.day) === dayOfWeek;
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className={styles.scheduleContainer}>
      <h2 className={styles.sectionTitle}>Monthly Schedule</h2>

      {/* Month Navigation */}
      <div className={styles.monthNavigation}>
        <button
          onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
          className={styles.navBtn}
        >
          ‹ Previous
        </button>
        <h3 className={styles.monthTitle}>
          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
          className={styles.navBtn}
        >
          Next ›
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarWrapper}>
        <div className={styles.calendarGrid}>
          {/* Day Headers */}
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {getDaysInMonth().map((date, idx) => {
            const coursesForDay = getCoursesForDay(date);
            return (
              <div
                key={idx}
                className={`
                  ${styles.dayCell}
                  ${!date ? styles.emptyday : ''}
                  ${date && isToday(date) ? styles.today : ''}
                `}
              >
                {date && (
                  <>
                    <div className={styles.dateNumber}>{date.getDate()}</div>
                    <div className={styles.coursesList}>
                      {coursesForDay.map((course, cidx) => {
                        const schedule = parseSchedule(course.schedule);
                        return (
                          <div key={cidx} className={styles.courseItem}>
                            <div className={styles.courseCode}>{course.courseid}</div>
                            <div className={styles.courseTime}>
                              {schedule?.startTime}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileSchedule;