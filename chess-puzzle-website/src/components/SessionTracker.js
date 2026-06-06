import React, { useState, useEffect } from 'react';
import './SessionTracker.css';

const SessionTracker = ({ onEndSession }) => {
  const [sessionStats, setSessionStats] = useState({
    puzzlesAttempted: 0,
    puzzlesSolved: 0,
    timeSpent: 0,
    startTime: Date.now(),
  });
  const [dailyGoal, setDailyGoal] = useState(10);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    // Load daily goal and progress from localStorage
    const storedGoal = localStorage.getItem('dailyGoal');
    if (storedGoal) setDailyGoal(parseInt(storedGoal));

    const today = new Date().toISOString().split('T')[0];
    const storedProgress = localStorage.getItem('dailyProgress');
    const storedDate = localStorage.getItem('dailyProgressDate');
    
    if (storedDate === today && storedProgress) {
      setDailyProgress(parseInt(storedProgress));
    } else {
      // Reset daily progress for new day
      setDailyProgress(0);
      localStorage.setItem('dailyProgressDate', today);
      localStorage.setItem('dailyProgress', '0');
    }

    // Timer for session duration
    const interval = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateSessionStats = (solved) => {
    setSessionStats(prev => ({
      ...prev,
      puzzlesAttempted: prev.puzzlesAttempted + 1,
      puzzlesSolved: solved ? prev.puzzlesSolved + 1 : prev.puzzlesSolved,
    }));

    if (solved) {
      const newProgress = dailyProgress + 1;
      setDailyProgress(newProgress);
      localStorage.setItem('dailyProgress', newProgress.toString());
    }
  };

  // Expose update function to parent
  useEffect(() => {
    window.updateSessionStats = updateSessionStats;
    return () => {
      delete window.updateSessionStats;
    };
  }, [dailyProgress]);

  const handleEndSession = () => {
    setShowSummary(true);
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    // Reset session stats
    setSessionStats({
      puzzlesAttempted: 0,
      puzzlesSolved: 0,
      timeSpent: 0,
      startTime: Date.now(),
    });
    if (onEndSession) onEndSession();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sessionAccuracy = sessionStats.puzzlesAttempted > 0
    ? Math.round((sessionStats.puzzlesSolved / sessionStats.puzzlesAttempted) * 100)
    : 0;

  const dailyPercentage = Math.min(100, Math.round((dailyProgress / dailyGoal) * 100));

  return (
    <>
      <div className="session-tracker">
        <div className="session-daily-goal">
          <span className="goal-text">
            Daily: <strong>{dailyProgress}/{dailyGoal}</strong>
          </span>
          <div className="goal-progress-bar">
            <div 
              className="goal-progress-fill" 
              style={{ width: `${dailyPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="session-stats">
          <span className="session-stat">
            {formatTime(sessionStats.timeSpent)}
          </span>
          <span className="session-stat">
            {sessionStats.puzzlesAttempted} attempted
          </span>
          <span className="session-stat">
            {sessionStats.puzzlesSolved} solved
          </span>
          {sessionStats.puzzlesAttempted > 0 && (
            <span className="session-stat">
              {sessionAccuracy}%
            </span>
          )}
        </div>

        <button className="end-session-btn" onClick={handleEndSession}>
          End Session
        </button>
      </div>

      {showSummary && (
        <div className="session-summary-overlay" onClick={handleCloseSummary}>
          <div className="session-summary-modal" onClick={e => e.stopPropagation()}>
            <h2>Session Summary</h2>
            
            <div className="summary-stats">
              <div className="summary-stat-card">
                <div className="summary-stat-value">{sessionStats.puzzlesAttempted}</div>
                <div className="summary-stat-label">Puzzles Attempted</div>
              </div>
              
              <div className="summary-stat-card">
                <div className="summary-stat-value">{sessionStats.puzzlesSolved}</div>
                <div className="summary-stat-label">Puzzles Solved</div>
              </div>
              
              <div className="summary-stat-card">
                <div className="summary-stat-value">{sessionAccuracy}%</div>
                <div className="summary-stat-label">Accuracy</div>
              </div>
              
              <div className="summary-stat-card">
                <div className="summary-stat-value">{formatTime(sessionStats.timeSpent)}</div>
                <div className="summary-stat-label">Time Spent</div>
              </div>
            </div>

            {dailyProgress >= dailyGoal && (
              <div className="summary-achievement">
                Daily goal completed
              </div>
            )}

            <div className="summary-actions">
              <button className="summary-btn summary-btn-primary" onClick={handleCloseSummary}>
                Continue Training
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionTracker;
