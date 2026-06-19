import React, { useState, useCallback, useEffect } from 'react';
import PuzzleSolver from './components/PuzzleSolver';
import SessionTracker from './components/SessionTracker';
import TrainingModeSelector from './components/TrainingModeSelector';
import PerformanceInsights from './components/PerformanceInsights';
import AchievementNotification from './components/AchievementNotification';
import OpeningSelector from './components/OpeningSelector';
import OpeningExplorer from './components/OpeningExplorer';
import OpeningTrainer from './components/OpeningTrainer';
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
  const [openingMode, setOpeningMode] = useState('selector'); // 'selector', 'explore', 'train'
  const [selectedOpening, setSelectedOpening] = useState(null);

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
    // Reset opening state when switching modes
    if (mode === 'openings') {
      setOpeningMode('selector');
      setSelectedOpening(null);
    }
  }, []);

  const handleOpeningModeChange = useCallback((mode) => {
    setOpeningMode(mode);
    if (mode === 'selector') {
      setSelectedOpening(null);
    }
  }, []);

  const handleOpeningSelect = useCallback((opening) => {
    setSelectedOpening(opening);
    setOpeningMode('train');
  }, []);

  const handleStartTraining = useCallback((moves, openingInfo) => {
    setSelectedOpening({
      moves,
      name: openingInfo.name,
      eco: openingInfo.eco,
      color: moves.length % 2 === 1 ? 'white' : 'black'
    });
    setOpeningMode('train');
  }, []);

  const handleTrainingComplete = useCallback(() => {
    setOpeningMode('selector');
    setSelectedOpening(null);
  }, []);

  const handlePracticePuzzles = useCallback(async (openingInfo, moveSequence) => {
    // Get puzzle IDs for this opening
    const { findPuzzlesFromOpening } = await import('./services/openingService');
    const puzzleIds = await findPuzzlesFromOpening(
      openingInfo.eco,
      openingInfo.name,
      moveSequence
    );
    
    if (puzzleIds.length === 0) {
      alert('No puzzles found for this opening. Try exploring more moves!');
      return;
    }
    
    // Switch to opening-puzzles mode
    setTrainingMode({
      mode: 'opening-puzzles',
      config: { 
        puzzleIds,
        openingName: openingInfo.name,
        openingEco: openingInfo.eco
      }
    });
    
    // Load first puzzle
    const nextPuzzle = await getNextPuzzle('opening-puzzles', { puzzleIds });
    setPuzzle(nextPuzzle);
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
          <h1 className="app-title">
            {trainingMode.mode === 'opening-puzzles' && trainingMode.config.openingName 
              ? `${trainingMode.config.openingName} Puzzles`
              : 'Chess Puzzles'
            }
          </h1>
          <TrainingModeSelector 
            currentMode={trainingMode.mode === 'opening-puzzles' ? 'openings' : trainingMode.mode} 
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
      
      {trainingMode.mode === 'openings' ? (
        <main className="app-main">
          {openingMode === 'selector' && (
            <OpeningSelector
              onSelect={handleOpeningSelect}
              onModeChange={handleOpeningModeChange}
            />
          )}
          {openingMode === 'explore' && (
            <OpeningExplorer 
              onStartTraining={handleStartTraining}
              onPracticePuzzles={handlePracticePuzzles}
            />
          )}
          {openingMode === 'train' && selectedOpening && (
            <OpeningTrainer
              line={selectedOpening}
              onComplete={handleTrainingComplete}
            />
          )}
        </main>
      ) : trainingMode.mode === 'opening-puzzles' ? (
        <main className="app-main">
          {trainingMode.config.openingEco && (
            <div style={{ 
              textAlign: 'center', 
              padding: '0.5rem', 
              background: '#0f3460',
              color: '#64ffda',
              borderRadius: '6px',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              <span style={{ background: '#16213e', padding: '0.25rem 0.6rem', borderRadius: '4px', marginRight: '0.5rem' }}>
                {trainingMode.config.openingEco}
              </span>
              Practicing puzzles from {trainingMode.config.openingName}
              <button 
                onClick={() => handleModeChange('openings', {})}
                style={{
                  marginLeft: '1rem',
                  padding: '0.25rem 0.6rem',
                  background: '#16213e',
                  border: '1px solid #64ffda',
                  borderRadius: '4px',
                  color: '#64ffda',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                ← Back to Openings
              </button>
            </div>
          )}
          <PuzzleSolver key={puzzle.id} puzzle={puzzle} onNext={handleNext} refreshStats={refreshStats} />
        </main>
      ) : showInsights ? (
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
