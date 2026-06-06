import React, { useState } from 'react';
import './PostSolveAnalysis.css';

const PostSolveAnalysis = ({ 
  puzzle, 
  solved, 
  timeSpent, 
  onClose,
  onRetry,
  onNext
}) => {
  const [userRating, setUserRating] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeExplanation = (theme) => {
    const explanations = {
      'fork': 'A fork attacks two or more pieces simultaneously.',
      'pin': 'A pin restricts a piece from moving because it would expose a more valuable piece.',
      'skewer': 'A skewer forces a valuable piece to move, exposing a piece behind it.',
      'discoveredAttack': 'Moving one piece reveals an attack from another piece.',
      'doubleCheck': 'Two pieces give check simultaneously, forcing the king to move.',
      'backRankMate': 'Checkmate on the back rank when the king is trapped by its own pieces.',
      'hangingPiece': 'An undefended piece that can be captured for free.',
      'trappedPiece': 'A piece with no safe squares, destined to be captured.',
      'mate': 'A sequence leading to checkmate.',
      'mateIn2': 'A forced checkmate in two moves.',
      'sacrifice': 'Giving up material for a positional or tactical advantage.',
      'defensiveMove': 'A move that prevents opponent threats.',
      'endgame': 'Tactical patterns in the endgame.',
      'middlegame': 'Tactics in the middlegame.',
      'opening': 'Tactical traps in the opening.'
    };
    
    return explanations[theme] || 'A tactical pattern that gives you an advantage.';
  };

  const handleRating = (rating) => {
    setUserRating(rating);
    import('../services/indexedDBService').then(({ updateUserProgress, getUserProgress }) => {
      getUserProgress(puzzle.id).then(progress => {
        updateUserProgress(puzzle.id, {
          ...progress,
          userRating: rating
        });
      });
    });
  };

  return (
    <div className="analysis-popup">
      <button className="popup-close" onClick={onClose} title="Close (or press any key)">×</button>
      
      <div className="popup-header">
        <span className="popup-icon">{solved ? '✓' : '—'}</span>
        <h3>{solved ? 'Solved' : 'Skipped'}</h3>
      </div>

      <div className="popup-stats">
        <span>{puzzle.rating}</span>
        <span>{formatTime(timeSpent)}</span>
        <span>{puzzle.themes[0]}</span>
      </div>

      {showDetails && (
        <div className="popup-details">
          <p className="theme-explanation">
            <strong>{puzzle.themes[0]}:</strong> {getThemeExplanation(puzzle.themes[0])}
          </p>
          
          <div className="rating-section-compact">
            <span className="rating-label">Rate:</span>
            <div className="star-rating-compact">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`star-btn-compact ${userRating >= star ? 'star-active' : ''}`}
                  onClick={() => handleRating(star)}
                >
                  {userRating >= star ? '●' : '○'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="popup-actions">
        <button className="popup-btn popup-btn-secondary" onClick={onRetry}>
          Retry
        </button>
        <button 
          className="popup-btn popup-btn-info" 
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '−' : '+'} 
        </button>
        <button className="popup-btn popup-btn-primary" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
};

export default PostSolveAnalysis;
