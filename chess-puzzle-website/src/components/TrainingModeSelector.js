import React, { useState, useEffect } from 'react';
import { getFailedPuzzles, getGlobalStats } from '../services/indexedDBService';
import './TrainingModeSelector.css';

const TrainingModeSelector = ({ currentMode, onModeChange }) => {
  const [showSelector, setShowSelector] = useState(false);
  const [failedCount, setFailedCount] = useState(0);
  const [themes] = useState([
    'fork', 'pin', 'skewer', 'discoveredAttack', 'doubleCheck',
    'backRankMate', 'hangingPiece', 'trappedPiece', 'mate', 'mateIn2',
    'sacrifice', 'defensiveMove', 'endgame', 'middlegame', 'opening'
  ]);
  const [selectedTheme, setSelectedTheme] = useState('fork');
  const [ratingRange, setRatingRange] = useState({ min: 1400, max: 1800 });

  useEffect(() => {
    loadFailedCount();
  }, []);

  const loadFailedCount = async () => {
    const failed = await getFailedPuzzles();
    setFailedCount(failed.length);
  };

  const modes = [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Adaptive difficulty with spaced repetition'
    },
    {
      id: 'failed',
      name: 'Review Failed',
      description: `Practice what you struggled with (${failedCount})`,
      disabled: failedCount === 0
    },
    {
      id: 'theme',
      name: 'Master Theme',
      description: 'Focus on specific tactical pattern'
    },
    {
      id: 'rating',
      name: 'Rating Zone',
      description: 'Train within rating range'
    }
  ];

  const handleModeSelect = (modeId) => {
    if (modeId === 'theme') {
      onModeChange(modeId, { theme: selectedTheme });
    } else if (modeId === 'rating') {
      onModeChange(modeId, { min: ratingRange.min, max: ratingRange.max });
    } else {
      onModeChange(modeId, {});
    }
    setShowSelector(false);
  };

  const getCurrentModeName = () => {
    const mode = modes.find(m => m.id === currentMode);
    return mode ? mode.name : 'Standard';
  };

  return (
    <div className="training-mode-selector">
      <button 
        className="mode-selector-trigger"
        onClick={() => setShowSelector(!showSelector)}
      >
        <span className="current-mode">{getCurrentModeName()}</span>
        <span className="dropdown-arrow">{showSelector ? '▲' : '▼'}</span>
      </button>

      {showSelector && (
        <>
          <div className="mode-selector-overlay" onClick={() => setShowSelector(false)} />
          <div className="mode-selector-dropdown">
            {modes.map(mode => (
              <div key={mode.id} className="mode-group">
                <button
                  className={`mode-option ${currentMode === mode.id ? 'active' : ''} ${mode.disabled ? 'disabled' : ''}`}
                  onClick={() => !mode.disabled && (mode.id === 'theme' || mode.id === 'rating' ? null : handleModeSelect(mode.id))}
                  disabled={mode.disabled}
                >
                  <div className="mode-header">
                    <span className="mode-name">{mode.name}</span>
                    {currentMode === mode.id && <span className="active-badge">✓</span>}
                  </div>
                  <span className="mode-description">{mode.description}</span>
                </button>

                {mode.id === 'theme' && (
                  <div className="mode-config">
                    <label>Select Theme:</label>
                    <select 
                      value={selectedTheme} 
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {themes.map(theme => (
                        <option key={theme} value={theme}>
                          {theme.charAt(0).toUpperCase() + theme.slice(1).replace(/([A-Z])/g, ' $1')}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="start-mode-btn"
                      onClick={() => handleModeSelect('theme')}
                    >
                      Begin
                    </button>
                  </div>
                )}

                {mode.id === 'rating' && (
                  <div className="mode-config">
                    <label>Rating Range:</label>
                    <div className="range-inputs">
                      <input
                        type="number"
                        value={ratingRange.min}
                        onChange={(e) => setRatingRange({ ...ratingRange, min: parseInt(e.target.value) })}
                        onClick={(e) => e.stopPropagation()}
                        min="800"
                        max="3000"
                        step="100"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        value={ratingRange.max}
                        onChange={(e) => setRatingRange({ ...ratingRange, max: parseInt(e.target.value) })}
                        onClick={(e) => e.stopPropagation()}
                        min="800"
                        max="3000"
                        step="100"
                      />
                    </div>
                    <button 
                      className="start-mode-btn"
                      onClick={() => handleModeSelect('rating')}
                    >
                      Begin
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TrainingModeSelector;
