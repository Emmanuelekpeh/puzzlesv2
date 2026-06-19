import React, { useState, useEffect } from 'react';
import { getRepertoire, getAllOpeningProgress } from '../services/indexedDBService';
import './OpeningSelector.css';

const OpeningSelector = ({ onSelect, onModeChange }) => {
  const [view, setView] = useState('main'); // 'main', 'repertoire', 'color'
  const [repertoire, setRepertoire] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const rep = await getRepertoire();
    const prog = await getAllOpeningProgress();
    setRepertoire(rep);
    setProgress(prog);
  };

  const getProgressForOpening = (opening) => {
    return progress.find(p => 
      p.eco === opening.eco && 
      p.color === opening.color
    );
  };

  const handleExplore = () => {
    onModeChange('explore');
  };

  const handleTrainByColor = (color) => {
    setSelectedColor(color);
    setView('repertoire');
  };

  const handleSelectOpening = (opening) => {
    onSelect(opening);
  };

  if (view === 'main') {
    return (
      <div className="opening-selector">
        <h2>Opening Training</h2>
        <p className="selector-subtitle">Choose how you want to practice</p>

        <div className="selector-options">
          <button className="selector-card" onClick={handleExplore}>
            <div className="card-icon">🔍</div>
            <h3>Opening Explorer</h3>
            <p>Browse openings, see statistics, and explore variations from the Lichess database</p>
          </button>

          <button className="selector-card" onClick={() => setView('color')}>
            <div className="card-icon">🎯</div>
            <h3>Train Opening</h3>
            <p>Practice your opening repertoire with "Guess the Move" drills</p>
          </button>

          <button className="selector-card" onClick={() => onModeChange('repertoire')}>
            <div className="card-icon">📚</div>
            <h3>My Repertoire</h3>
            <p>View and manage your saved opening lines ({repertoire.length})</p>
          </button>
        </div>

        <button className="back-to-puzzles" onClick={() => onModeChange('standard')}>
          ← Back to Puzzles
        </button>
      </div>
    );
  }

  if (view === 'color') {
    return (
      <div className="opening-selector">
        <h2>Train Opening</h2>
        <p className="selector-subtitle">Choose which color to practice</p>

        <div className="selector-options">
          <button className="selector-card color-card" onClick={() => handleTrainByColor('white')}>
            <div className="card-icon">⚪</div>
            <h3>White Openings</h3>
            <p>Practice your opening repertoire as White</p>
            {repertoire.filter(r => r.color === 'white').length > 0 && (
              <span className="card-badge">{repertoire.filter(r => r.color === 'white').length} in repertoire</span>
            )}
          </button>

          <button className="selector-card color-card" onClick={() => handleTrainByColor('black')}>
            <div className="card-icon">⚫</div>
            <h3>Black Openings</h3>
            <p>Practice your opening repertoire as Black</p>
            {repertoire.filter(r => r.color === 'black').length > 0 && (
              <span className="card-badge">{repertoire.filter(r => r.color === 'black').length} in repertoire</span>
            )}
          </button>
        </div>

        <button className="back-button" onClick={() => setView('main')}>
          ← Back
        </button>
      </div>
    );
  }

  if (view === 'repertoire') {
    const colorRepertoire = selectedColor 
      ? repertoire.filter(r => r.color === selectedColor)
      : repertoire;

    return (
      <div className="opening-selector">
        <h2>
          {selectedColor 
            ? `${selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)} Openings`
            : 'My Repertoire'
          }
        </h2>
        <p className="selector-subtitle">
          {colorRepertoire.length === 0 
            ? 'No openings in your repertoire yet. Use the Opening Explorer to add some!'
            : 'Select an opening to practice'
          }
        </p>

        {colorRepertoire.length > 0 && (
          <div className="repertoire-list">
            {colorRepertoire.map((opening) => {
              const prog = getProgressForOpening(opening);
              return (
                <button 
                  key={opening.id} 
                  className="repertoire-item"
                  onClick={() => handleSelectOpening(opening)}
                >
                  <div className="opening-header">
                    <span className="eco-badge">{opening.eco}</span>
                    <h4>{opening.name}</h4>
                  </div>
                  <div className="opening-meta">
                    <span>{opening.moves.length} moves</span>
                    {prog && (
                      <>
                        <span className="divider">•</span>
                        <span className="mastery">
                          Mastery: {prog.masteryLevel || 0}%
                        </span>
                        <span className="divider">•</span>
                        <span className={`accuracy ${prog.accuracy >= 70 ? 'good' : 'needs-work'}`}>
                          Accuracy: {prog.accuracy || 0}%
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="selector-actions">
          {colorRepertoire.length === 0 && (
            <button className="btn-secondary" onClick={handleExplore}>
              Open Explorer to Add Openings
            </button>
          )}
          <button className="back-button" onClick={() => setView(selectedColor ? 'color' : 'main')}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OpeningSelector;
