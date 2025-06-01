import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PuzzleSolver from '../components/PuzzleSolver';
import { samplePuzzles } from '../services/puzzleService';
import { usePuzzle } from '../contexts/PuzzleContext';
import './PuzzleSolverPage.css';

const PuzzleSolverPage = () => {
  const navigate = useNavigate();
  const { currentPuzzleId, nextPuzzle, refreshPuzzles, loading, currentIndex, total } = usePuzzle();
  const [puzzle, setPuzzle] = useState(null);

  useEffect(() => {
    if (currentPuzzleId) {
      const found = samplePuzzles.find(p => p.id === currentPuzzleId);
      setPuzzle(found);
    }
  }, [currentPuzzleId]);

  const handleBackToPuzzles = () => {
    navigate('/puzzles');
  };

  // All puzzles played
  if (!loading && currentIndex >= total) {
    return (
      <div className="puzzle-solver-page">
        <div className="all-puzzles-complete">
          <h2>🎉 You've completed all puzzles!</h2>
          <button className="btn btn-primary" onClick={refreshPuzzles}>
            Restart / Shuffle Again
          </button>
          <button className="btn btn-secondary" onClick={handleBackToPuzzles}>
            Back to Puzzles
          </button>
        </div>
      </div>
    );
  }

  if (loading || !puzzle) {
    return (
      <div className="puzzle-solver-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading puzzle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="puzzle-solver-page">
      <div className="page-header">
        <button onClick={handleBackToPuzzles} className="back-btn">
          ← Back to Puzzles
        </button>
        <h1>Puzzle #{puzzle.id}</h1>
      </div>
      <PuzzleSolver 
        puzzle={puzzle}
        onSolved={nextPuzzle}
        onNext={nextPuzzle}
      />
    </div>
  );
};

export default PuzzleSolverPage;
