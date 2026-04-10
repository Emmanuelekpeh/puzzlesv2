import React, { useState, useCallback } from 'react';
import PuzzleSolver from './components/PuzzleSolver';
import { getNextPuzzle, getGlobalStats } from './services/puzzleService';
import './App.css';

function App() {
  const [puzzle, setPuzzle] = useState(() => getNextPuzzle());
  const [stats, setStats] = useState(() => getGlobalStats());

  const refreshStats = useCallback(() => setStats(getGlobalStats()), []);

  const handleNext = useCallback(() => {
    setPuzzle(getNextPuzzle());
    refreshStats();
  }, [refreshStats]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Chess Puzzles</h1>
        <div className="app-stats">
          <span>{stats.puzzlesSeen}/{stats.totalPuzzles} seen</span>
          <span>{stats.totalSolves}/{stats.totalAttempts} solved</span>
          <span>{stats.solveRate}% rate</span>
        </div>
      </header>
      <main className="app-main">
        <PuzzleSolver key={puzzle.id + '-' + stats.totalAppearances} puzzle={puzzle} onNext={handleNext} />
      </main>
    </div>
  );
}

export default App;
