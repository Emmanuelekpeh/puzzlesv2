import React, { useEffect, useState } from 'react';
import { getGlobalStats } from '../services/indexedDBService';
import './StreakCalendar.css';

const StreakCalendar = () => {
  const [stats, setStats] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    const globalStats = await getGlobalStats();
    setStats(globalStats);
    generateCalendar(globalStats);
  };

  const generateCalendar = (stats) => {
    const days = [];
    const today = new Date();
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if user played on this day (simplified - would need session history)
      const lastPlayDate = stats.lastPlayDate ? new Date(stats.lastPlayDate).toISOString().split('T')[0] : null;
      const isToday = dateStr === today.toISOString().split('T')[0];
      const hasPlayed = lastPlayDate === dateStr || (isToday && stats.lastPlayDate);
      
      days.push({
        date: dateStr,
        day: date.getDate(),
        hasPlayed: hasPlayed,
        isToday: isToday
      });
    }
    
    setCalendarDays(days);
  };

  if (!stats) {
    return <div className="streak-calendar loading">Loading...</div>;
  }

  return (
    <div className="streak-calendar">
      <div className="streak-header">
        <h3>Daily Streak</h3>
        <div className="streak-stats">
          <div className="streak-current">
            <span className="streak-label">Current</span>
            <span className="streak-value">{stats.currentStreak}</span>
          </div>
          <div className="streak-longest">
            <span className="streak-label">Longest</span>
            <span className="streak-value">{stats.longestStreak}</span>
          </div>
        </div>
      </div>
      
      <div className="calendar-grid">
        {calendarDays.map((day, idx) => (
          <div 
            key={idx}
            className={`calendar-day ${day.hasPlayed ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
            title={day.date}
          >
            <span className="day-number">{day.day}</span>
          </div>
        ))}
      </div>
      
      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-box active"></span>
          Played
        </span>
        <span className="legend-item">
          <span className="legend-box"></span>
          Missed
        </span>
      </div>
    </div>
  );
};

export default StreakCalendar;
