import React, { useState, useCallback, useEffect } from 'react';
import PuzzleSolver from './components/PuzzleSolver';
import SessionTracker from './components/SessionTracker';
import TrainingModeSelector from './components/TrainingModeSelector';
import PerformanceInsights from './components/PerformanceInsights';
import AchievementNotification from './components/AchievementNotification';
import { getNextPuzzle, getGlobalStatsFormatted } from './services/puzzleService';
import { migrateToIndexedDB, needsMigration } from './services/migrationService';
import { initializeAchievements, updateStreak } from './services/achievementService';
import './App.css';

function App() {
  const [puzzle, setPuzzle] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [trainingMode, setTrainingMode] = useState({ mode: 'standard', config: {} });
  const [showInsights, setShowInsights] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if migration is needed
        if (needsMigration()) {
          setMigrationStatus('Migrating data to new system...');
          const result = await migrateToIndexedDB();
          if (result.success) {
            setMigrationStatus('Migration complete!');
          } else {
            setMigrationStatus('Migration failed. Using default data.');
          }
        }
        
        // Initialize achievements
        await initializeAchievements();
        
        // Update streak
        await updateStreak();
        
        // Load initial puzzle and stats
        const initialPuzzle = await getNextPuzzle(trainingMode.mode, trainingMode.config);
        const initialStats = await getGlobalStatsFormatted();
        
        setPuzzle(initialPuzzle);
        setStats(initialStats);
        setLoading(false);
        setMigrationStatus('');
      } catch (error) {
        console.error('Initialization error:', error);
        setMigrationStatus('Error loading app. Please refresh.');
        setLoading(false);
      }
    };

    initialize();
  }, [trainingMode]);

  const refreshStats = useCallback(async () => {
    const updatedStats = await getGlobalStatsFormatted();
    setStats(updatedStats);
  }, []);

  const handleNext = useCallback(async () => {
    const nextPuzzle = await getNextPuzzle(trainingMode.mode, trainingMode.config);
    setPuzzle(nextPuzzle);
    await refreshStats();
  }, [refreshStats, trainingMode]);

  const handleModeChange = useCallback((mode, config) => {
    setTrainingMode({ mode, config });
  }, []);

  const toggleInsights = useCallback(() => {
    setShowInsights(prev => !prev);
  }, []);

  const showAchievement = useCallback((achievement) => {
    setAchievementQueue(prev => [...prev, achievement]);
  }, []);

  const dismissAchievement = useCallback(() => {
    setAchievementQueue(prev => prev.slice(1));
  }, []);

  // Expose showAchievement globally for PuzzleSolver
  useEffect(() => {
    window.showAchievement = showAchievement;
    return () => {
      delete window.showAchievement;
    };
  }, [showAchievement]);

  if (loading) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '1.5rem', color: '#64ffda' }}>Loading...</div>
          {migrationStatus && <div style={{ color: '#8892b0', fontSize: '0.9rem' }}>{migrationStatus}</div>}
        </div>
      </div>
    );
  }

  if (!puzzle || !stats) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          color: '#e94560'
        }}>
          Error loading puzzles. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">Chess Puzzles</h1>
          <TrainingModeSelector 
            currentMode={trainingMode.mode} 
            onModeChange={handleModeChange} 
          />
        </div>
        <div className="app-stats">
          <span>{stats.puzzlesSeen}/{stats.totalPuzzles}</span>
          <span>{stats.totalSolves}/{stats.totalAttempts}</span>
          <span>{stats.solveRate}%</span>
          <span style={{ color: '#64ffda', fontWeight: 600 }}>{stats.estimatedRating}</span>
          <button className="insights-toggle" onClick={toggleInsights} title="View insights">
            {showInsights ? '×' : 'i'}
          </button>
        </div>
      </header>
      <SessionTracker />
      
      {showInsights ? (
        <main className="app-main">
          <PerformanceInsights />
        </main>
      ) : (
        <main className="app-main">
          <PuzzleSolver key={puzzle.id} puzzle={puzzle} onNext={handleNext} refreshStats={refreshStats} />
        </main>
      )}

      {achievementQueue[0] && (
        <AchievementNotification 
          achievement={achievementQueue[0]} 
          onClose={dismissAchievement} 
        />
      )}
    </div>
  );
}

export default App;
