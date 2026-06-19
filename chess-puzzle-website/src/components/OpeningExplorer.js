import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { fetchOpeningPosition, getOpeningName, countPuzzlesForOpening } from '../services/openingService';
import { addToRepertoire, getRepertoire } from '../services/indexedDBService';
import './OpeningExplorer.css';

const OpeningExplorer = ({ onStartTraining }) => {
  const [chess] = useState(new Chess());
  const [position, setPosition] = useState(chess.fen());
  const [moveHistory, setMoveHistory] = useState([]);
  const [moveSequence, setMoveSequence] = useState([]); // UCI moves
  const [availableMoves, setAvailableMoves] = useState([]);
  const [openingInfo, setOpeningInfo] = useState({ name: 'Starting Position', eco: 'A00' });
  const [loading, setLoading] = useState(false);
  const [boardWidth, setBoardWidth] = useState(480);
  const [repertoire, setRepertoire] = useState([]);
  const [showStats, setShowStats] = useState(true);
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity', 'white', 'draws', 'black'
  const [puzzleCount, setPuzzleCount] = useState(0);

  // Calculate board width
  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      if (vw <= 480) setBoardWidth(vw - 32);
      else if (vw <= 768) setBoardWidth(Math.min(vw - 64, 480));
      else setBoardWidth(480);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load repertoire
  useEffect(() => {
    const loadRepertoire = async () => {
      const rep = await getRepertoire();
      setRepertoire(rep);
    };
    loadRepertoire();
  }, []);

  // Fetch moves for current position
  const fetchMoves = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOpeningPosition(position, moveSequence);
      
      if (data) {
        setAvailableMoves(data.moves || []);
        setOpeningInfo(data.opening || { name: 'Unknown Position', eco: '' });
      }
      
      // Count puzzles for this opening (if we have moves)
      if (moveSequence.length >= 3) {
        const count = await countPuzzlesForOpening(
          data?.opening?.eco || '',
          data?.opening?.name || '',
          moveSequence
        );
        setPuzzleCount(count);
      } else {
        setPuzzleCount(0);
      }
    } catch (error) {
      console.error('Error fetching moves:', error);
    } finally {
      setLoading(false);
    }
  }, [position, moveSequence]);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  // Sort moves
  const sortedMoves = [...availableMoves].sort((a, b) => {
    switch (sortBy) {
      case 'white':
        return b.white - a.white;
      case 'draws':
        return b.draws - a.draws;
      case 'black':
        return b.black - a.black;
      case 'popularity':
      default:
        return b.total - a.total;
    }
  });

  // Play a move
  const playMove = (move) => {
    const game = new Chess(position);
    try {
      const result = game.move(move.san);
      if (result) {
        setPosition(game.fen());
        setMoveHistory([...moveHistory, move.san]);
        setMoveSequence([...moveSequence, move.uci]);
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  // Go back one move
  const goBack = () => {
    if (moveHistory.length === 0) return;
    
    const game = new Chess();
    const newHistory = moveHistory.slice(0, -1);
    const newSequence = moveSequence.slice(0, -1);
    
    newHistory.forEach(move => game.move(move));
    
    setPosition(game.fen());
    setMoveHistory(newHistory);
    setMoveSequence(newSequence);
  };

  // Reset to starting position
  const reset = () => {
    const game = new Chess();
    setPosition(game.fen());
    setMoveHistory([]);
    setMoveSequence([]);
  };

  // Add current line to repertoire
  const addToUserRepertoire = async () => {
    if (moveHistory.length < 3) {
      alert('Play at least 3 moves to save to repertoire');
      return;
    }

    const color = moveHistory.length % 2 === 1 ? 'white' : 'black';
    
    await addToRepertoire({
      name: openingInfo.name || 'Custom Line',
      eco: openingInfo.eco || 'A00',
      color,
      moves: moveSequence,
      variations: []
    });

    const updated = await getRepertoire();
    setRepertoire(updated);
    alert(`Added ${openingInfo.name} to your repertoire!`);
  };

  // Check if current line is in repertoire
  const isInRepertoire = repertoire.some(item => 
    item.eco === openingInfo.eco && 
    item.moves.length === moveSequence.length &&
    item.moves.every((m, i) => m === moveSequence[i])
  );

  return (
    <div className="opening-explorer">
      <div className="explorer-header">
        <h2>Opening Explorer</h2>
        <div className="explorer-controls">
          <button className="btn-explorer" onClick={reset} disabled={moveHistory.length === 0}>
            Reset
          </button>
          <button className="btn-explorer" onClick={goBack} disabled={moveHistory.length === 0}>
            ← Back
          </button>
          <button 
            className="btn-explorer btn-primary" 
            onClick={addToUserRepertoire}
            disabled={isInRepertoire || moveHistory.length < 3}
          >
            {isInRepertoire ? '✓ In Repertoire' : '+ Add to Repertoire'}
          </button>
        </div>
      </div>

      <div className="explorer-content">
        <div className="explorer-left">
          <div className="explorer-board">
            <Chessboard
              position={position}
              boardWidth={boardWidth}
              arePiecesDraggable={false}
              customBoardStyle={{ borderRadius: '4px' }}
            />
          </div>

          <div className="opening-info">
            <div className="opening-name">
              <span className="eco-code">{openingInfo.eco}</span>
              <h3>{openingInfo.name}</h3>
            </div>
            
            {moveHistory.length > 0 && (
              <div className="move-history">
                {moveHistory.map((move, i) => (
                  <span key={i} className="move-item">
                    {i % 2 === 0 && <span className="move-num">{Math.floor(i / 2) + 1}.</span>}
                    {move}
                  </span>
                ))}
              </div>
            )}

            {moveHistory.length >= 3 && (
              <div className="training-actions">
                <button 
                  className="btn-train"
                  onClick={() => onStartTraining && onStartTraining(moveSequence, openingInfo)}
                >
                  🎯 Train This Line
                </button>
                {puzzleCount > 0 && (
                  <div className="puzzle-connection">
                    <span className="puzzle-badge">
                      {puzzleCount} puzzles from this opening
                    </span>
                    <button 
                      className="btn-puzzles"
                      onClick={() => window.alert('Puzzle filtering coming soon!')}
                    >
                      📊 Practice Puzzles
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="explorer-right">
          <div className="moves-header">
            <h4>Available Moves {loading && <span className="loader">...</span>}</h4>
            <div className="sort-controls">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="popularity">Most Popular</option>
                <option value="white">White Wins</option>
                <option value="draws">Most Draws</option>
                <option value="black">Black Wins</option>
              </select>
              <button 
                className="stats-toggle"
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </button>
            </div>
          </div>

          <div className="moves-list">
            {sortedMoves.length === 0 && !loading && (
              <div className="no-moves">No game data for this position</div>
            )}

            {sortedMoves.map((move, index) => (
              <div 
                key={index} 
                className="move-option"
                onClick={() => playMove(move)}
              >
                <div className="move-notation">
                  <span className="move-san">{move.san}</span>
                  <span className="move-games">{move.total.toLocaleString()} games</span>
                </div>

                {showStats && (
                  <div className="move-stats">
                    <div className="stat-bar">
                      <div className="bar-white" style={{ width: `${move.winRate.white}%` }}>
                        {move.winRate.white > 10 && `${move.winRate.white}%`}
                      </div>
                      <div className="bar-draws" style={{ width: `${move.winRate.draws}%` }}>
                        {move.winRate.draws > 10 && `${move.winRate.draws}%`}
                      </div>
                      <div className="bar-black" style={{ width: `${move.winRate.black}%` }}>
                        {move.winRate.black > 10 && `${move.winRate.black}%`}
                      </div>
                    </div>
                    <div className="popularity">{move.popularity}% popularity</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningExplorer;
