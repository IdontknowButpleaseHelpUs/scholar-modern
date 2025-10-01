import React, { useState } from 'react';
import styles from '../../styles/profiletodolist.module.css';

const ProfileTodoList = ({ loggedUser, profileData }) => {
   const [tasks, setTasks] = useState(profileData.tasks || []);
   const [selectedDate, setSelectedDate] = useState(new Date());
   const [newTask, setNewTask] = useState({ title: '', dueDate: '' });
   const [showAddForm, setShowAddForm] = useState(false);

   const toggleTaskComplete = (taskId) => {
      setTasks(tasks.map(task =>
         task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
   };

   const handleAddTask = () => {
      if (!newTask.title.trim() || !newTask.dueDate) {
         alert('Please fill in all fields');
         return;
      }

      const task = {
         id: `task${Date.now()}`,
         title: newTask.title,
         dueDate: newTask.dueDate,
         completed: false,
         courseId: null
      };

      setTasks([...tasks, task]);
      setNewTask({ title: '', dueDate: '' });
      setShowAddForm(false);
   };

   const getTasksForDate = (date) => {
      const dateStr = date.toISOString().split('T')[0];
      return tasks.filter(task => task.dueDate === dateStr);
   };

   const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
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

   const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
   };

   const isToday = (date) => {
      if (!date) return false;
      const today = new Date();
      return date.toDateString() === today.toDateString();
   };

   const hasTasksOnDate = (date) => {
      if (!date) return false;
      const dateStr = date.toISOString().split('T')[0];
      return tasks.some(task => task.dueDate === dateStr);
   };

   const pendingTasks = tasks.filter(t => !t.completed);
   const completedTasks = tasks.filter(t => t.completed);

   return (
      <div className={styles.todoContainer}>
         <h2 className={styles.sectionTitle}>To-Do List</h2>

         {/* Add Task Button */}
         <div className={styles.addTaskSection}>
            <button
               onClick={() => setShowAddForm(!showAddForm)}
               className={styles.addTaskBtn}
            >
               {showAddForm ? '✕ Cancel' : '+ Add New Task'}
            </button>
         </div>

         {/* Add Task Form */}
         {showAddForm && (
            <div className={styles.addTaskForm}>
               <input
                  type="text"
                  placeholder="Task title..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className={styles.taskInput}
               />
               <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className={styles.dateInput}
               />
               <button onClick={handleAddTask} className={styles.saveTaskBtn}>
                  Save Task
               </button>
            </div>
         )}

         {/* Tasks List */}
         <div className={styles.tasksSection}>
            <h3 className={styles.subsectionTitle}>Pending Tasks ({pendingTasks.length})</h3>
            {pendingTasks.length > 0 ? (
               <div className={styles.tasksList}>
                  {pendingTasks.map(task => (
                     <div key={task.id} className={styles.taskItem}>
                        <input
                           type="checkbox"
                           checked={task.completed}
                           onChange={() => toggleTaskComplete(task.id)}
                           className={styles.taskCheckbox}
                        />
                        <div className={styles.taskContent}>
                           <span className={styles.taskTitle}>{task.title}</span>
                           <span className={styles.taskDue}>Due: {formatDate(task.dueDate)}</span>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className={styles.emptyState}>
                  <p>No pending tasks. Great job!</p>
               </div>
            )}

            {completedTasks.length > 0 && (
               <>
                  <h3 className={styles.subsectionTitle}>Completed ({completedTasks.length})</h3>
                  <div className={styles.tasksList}>
                     {completedTasks.map(task => (
                        <div key={task.id} className={`${styles.taskItem} ${styles.taskCompleted}`}>
                           <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTaskComplete(task.id)}
                              className={styles.taskCheckbox}
                           />
                           <div className={styles.taskContent}>
                              <span className={styles.taskTitle}>{task.title}</span>
                              <span className={styles.taskDue}>Due: {formatDate(task.dueDate)}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </>
            )}
         </div>

         {/* Calendar */}
         <div className={styles.calendarSection}>
            <h3 className={styles.subsectionTitle}>Calendar View</h3>
            <div className={styles.calendar}>
               <div className={styles.calendarHeader}>
                  <button
                     onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                     className={styles.calendarNavBtn}
                  >
                     ‹
                  </button>
                  <span className={styles.calendarMonth}>
                     {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                     onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                     className={styles.calendarNavBtn}
                  >
                     ›
                  </button>
               </div>

               <div className={styles.calendarGrid}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                     <div key={day} className={styles.calendarDayHeader}>
                        {day}
                     </div>
                  ))}
                  {getDaysInMonth(selectedDate).map((date, idx) => (
                     <div
                        key={idx}
                        className={`
                              ${styles.calendarDay}
                              ${!date ? styles.calendarDayEmpty : ''}
                              ${date && isToday(date) ? styles.calendarDayToday : ''}
                              ${date && hasTasksOnDate(date) ? styles.calendarDayHasTasks : ''}
                              `}
                        >
                        {date && (
                           <>
                              <span className={styles.dayNumber}>{date.getDate()}</span>
                              {hasTasksOnDate(date) && (
                                 <span className={styles.taskDot}></span>
                              )}
                           </>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default ProfileTodoList;