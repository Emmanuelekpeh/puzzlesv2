import React, { useEffect, useState } from 'react';
import { getGlobalStats, getAllAchievements } from '../services/indexedDBService';
import StreakCalendar from './StreakCalendar';
import './PerformanceInsights.css';

const PerformanceInsights = () => {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInsights = async () => {
    try {
      const globalStats = await getGlobalStats();
      const allAchievements = await getAllAchievements();
      setStats(globalStats);
      setAchievements(allAchievements);
      generateInsights(globalStats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading insights:', error);
      setLoading(false);
    }
  };

  const generateInsights = (stats) => {
    const insights = [];

    // Find weakest theme
    const themePerf = stats.themePerformance || {};
    const themes = Object.entries(themePerf)
      .filter(([_, data]) => data.attempted >= 5)
      .sort((a, b) => {
        const accA = a[1].solved / a[1].attempted;
        const accB = b[1].solved / b[1].attempted;
        return accA - accB;
      });

    if (themes.length > 0) {
      const weakest = themes[0];
      const accuracy = Math.round((weakest[1].solved / weakest[1].attempted) * 100);
      insights.push({
        type: 'weakness',
        title: 'Focus Area',
        message: `${weakest[0]} (${accuracy}%)`,
        action: 'theme',
        actionData: weakest[0]
      });
    }

    // Check rating trend
    if (stats.estimatedRating > 1550) {
      insights.push({
        type: 'progress',
        title: 'Rating Progress',
        message: `+${stats.estimatedRating - 1500} from start`,
        action: null
      });
    }

    // Check if they're improving
    const recentSessions = (stats.sessionHistory || []).slice(-5);
    if (recentSessions.length >= 3) {
      const avgRecent = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
      if (avgRecent > 75) {
        insights.push({
          type: 'progress',
          title: 'Strong Performance',
          message: `${Math.round(avgRecent)}% accuracy (recent sessions)`,
          action: null
        });
      }
    }

    // Streak tracking
    if (stats.currentStreak >= 3) {
      insights.push({
        type: 'streak',
        title: 'Consistency',
        message: `${stats.currentStreak} day streak`,
        action: null
      });
    }

    setInsights(insights);
  };

  const getThemeAccuracy = (themeData) => {
    if (!themeData || themeData.attempted === 0) return 0;
    return Math.round((themeData.solved / themeData.attempted) * 100);
  };

  const getThemeColor = (accuracy) => {
    if (accuracy >= 80) return '#64ffda';
    if (accuracy >= 60) return '#8892b0';
    return '#e94560';
  };

  if (loading) {
    return <div className="performance-insights loading">Loading insights...</div>;
  }

  if (!stats) {
    return <div className="performance-insights">No data available</div>;
  }

  const themePerf = stats.themePerformance || {};
  const topThemes = Object.entries(themePerf)
    .filter(([_, data]) => data.attempted >= 3)
    .sort((a, b) => b[1].attempted - a[1].attempted)
    .slice(0, 10);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const inProgressAchievements = achievements
    .filter(a => !a.unlocked && a.progress > 0)
    .sort((a, b) => (b.progress / b.target) - (a.progress / a.target))
    .slice(0, 5);

  return (
    <div className="performance-insights">
      <StreakCalendar />

      {(unlockedAchievements.length > 0 || inProgressAchievements.length > 0) && (
        <div className="achievements-section">
          <h3>Achievements</h3>
          
          {unlockedAchievements.length > 0 && (
            <div className="achievements-unlocked">
              <h4>Unlocked ({unlockedAchievements.length})</h4>
              <div className="achievement-grid">
                {unlockedAchievements.slice(-6).reverse().map(achievement => (
                  <div key={achievement.id} className="achievement-badge unlocked">
                    <div className="achievement-icon">✓</div>
                    <div className="achievement-name">{achievement.name}</div>
                    <div className="achievement-desc">{achievement.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inProgressAchievements.length > 0 && (
            <div className="achievements-progress">
              <h4>In Progress</h4>
              <div className="achievement-list">
                {inProgressAchievements.map(achievement => {
                  const progress = Math.round((achievement.progress / achievement.target) * 100);
                  return (
                    <div key={achievement.id} className="achievement-progress-item">
                      <div className="achievement-progress-info">
                        <span className="achievement-name">{achievement.name}</span>
                        <span className="achievement-progress-text">
                          {achievement.progress}/{achievement.target}
                        </span>
                      </div>
                      <div className="achievement-progress-bar">
                        <div 
                          className="achievement-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {insights.length > 0 && (
        <div className="insights-grid">
          {insights.map((insight, idx) => (
            <div key={idx} className={`insight-card insight-${insight.type}`}>
              <div className="insight-header">{insight.title}</div>
              <div className="insight-message">{insight.message}</div>
            </div>
          ))}
        </div>
      )}

      {topThemes.length > 0 && (
        <div className="theme-performance-section">
          <h3>Theme Performance</h3>
          <div className="theme-list">
            {topThemes.map(([theme, data]) => {
              const accuracy = getThemeAccuracy(data);
              return (
                <div key={theme} className="theme-item">
                  <div className="theme-info">
                    <span className="theme-name">{theme}</span>
                    <span className="theme-stats">
                      {data.solved}/{data.attempted}
                    </span>
                  </div>
                  <div className="theme-bar">
                    <div 
                      className="theme-bar-fill"
                      style={{ 
                        width: `${accuracy}%`,
                        backgroundColor: getThemeColor(accuracy)
                      }}
                    />
                  </div>
                  <span className="theme-accuracy" style={{ color: getThemeColor(accuracy) }}>
                    {accuracy}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rating-section">
        <h3>Rating Distribution</h3>
        <div className="rating-info">
          <div className="rating-current">
            <span className="rating-label">Current</span>
            <span className="rating-value">{stats.estimatedRating}</span>
          </div>
          <div className="rating-change">
            <span className="rating-label">Progress</span>
            <span className="rating-value">
              {stats.estimatedRating > 1500 ? '+' : ''}{stats.estimatedRating - 1500}
            </span>
          </div>
        </div>
      </div>

      {stats.sessionHistory && stats.sessionHistory.length > 0 && (
        <div className="session-history-section">
          <h3>Recent Sessions</h3>
          <div className="session-list">
            {stats.sessionHistory.slice(-5).reverse().map((session, idx) => (
              <div key={idx} className="session-item">
                <span className="session-date">
                  {new Date(session.date).toLocaleDateString()}
                </span>
                <span className="session-puzzles">{session.puzzlesSolved} solved</span>
                <span className="session-accuracy">{session.accuracy}%</span>
                <span className="session-time">{Math.round(session.timeSpent / 60)}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceInsights;
