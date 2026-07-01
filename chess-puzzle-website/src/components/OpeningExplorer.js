import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { fetchOpeningPosition, countPuzzlesForOpening } from '../services/openingService';
import { addToRepertoire, getRepertoire } from '../services/indexedDBService';
import './OpeningExplorer.css';

const OpeningExplorer = ({ onStartTraining, onPracticePuzzles, onBack, initialMoves }) => {
  // Initialize chess instance with moves if provided
  const [chess, setChess] = useState(() => {
    const g = new Chess();
    if (initialMoves && initialMoves.length > 0) {
      initialMoves.forEach(m => {
        try { g.move(m); } catch (e) {}
      });
    }
    return g;
  });
  
  const [position, setPosition] = useState(chess.fen());
  
  const [moveHistory, setMoveHistory] = useState(() => {
    if (initialMoves && initialMoves.length > 0) {
      const g = new Chess();
      const history = [];
      initialMoves.forEach(m => {
        try {
          const res = g.move(m);
          if (res) history.push(res.san);
        } catch (e) {}
      });
      return history;
    }
    return [];
  });
  
  const [moveSequence, setMoveSequence] = useState(initialMoves || []); // UCI moves
  const [availableMoves, setAvailableMoves] = useState([]);
  const [openingInfo, setOpeningInfo] = useState({ name: 'Starting Position', eco: 'A00' });
  const [loading, setLoading] = useState(false);
  const [boardWidth, setBoardWidth] = useState(480);
  const [repertoire, setRepertoire] = useState([]);
  const [showStats, setShowStats] = useState(true);
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity', 'white', 'draws', 'black'
  const [puzzleCount, setPuzzleCount] = useState(0);
  const [showTrainingOptions, setShowTrainingOptions] = useState(false);
  const [moveFrom, setMoveFrom] = useState(null);
  const [optionSquares, setOptionSquares] = useState({});

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

  // Show legal moves for a selected piece
  const showLegalMoves = (square) => {
    const moves = chess.moves({ square, verbose: true });
    if (moves.length === 0) return;

    const options = {};
    moves.forEach((move) => {
      const isCapture = move.flags.includes('c') || move.flags.includes('e');
      options[move.to] = {
        background: isCapture 
          ? 'radial-gradient(transparent 0%, transparent 75%, rgba(100, 255, 218, 0.7) 76%, rgba(100, 255, 218, 0.7) 100%)'
          : 'radial-gradient(rgba(100, 255, 218, 0.5) 22%, transparent 23%)',
        borderRadius: '50%'
      };
    });
    setOptionSquares(options);
  };

  // Handle user-initiated move (drag or click)
  const handleUserMove = (from, to) => {
    const moves = chess.moves({ verbose: true });
    const validMove = moves.find(m => m.from === from && m.to === to);
    
    if (!validMove) {
      console.log('Invalid move');
      return false;
    }

    // Determine if promotion is needed
    let promotion = 'q';
    if (validMove.flags.includes('p')) {
      // For now, always promote to queen. Could add UI for selection later.
      promotion = 'q';
    }

    // Make the move
    const result = chess.move({ from, to, promotion });
    if (!result) {
      console.log('Move failed');
      return false;
    }

    // Update state immediately
    const newPosition = chess.fen();
    const uciMove = `${from}${to}${result.promotion || ''}`;
    
    setPosition(newPosition);
    setMoveHistory([...moveHistory, result.san]);
    setMoveSequence([...moveSequence, uciMove]);
    setMoveFrom(null);
    setOptionSquares({});

    // Fetch stats asynchronously (non-blocking)
    fetchMoves();

    return true;
  };

  // Handle piece drag begin
  const onPieceDragBegin = (piece, sourceSquare) => {
    // Check if it's the correct player's turn
    if (piece[0] !== chess.turn()) return;
    setMoveFrom(sourceSquare);
    showLegalMoves(sourceSquare);
  };

  // Handle piece drop
  const onPieceDrop = (sourceSquare, targetSquare) => {
    const success = handleUserMove(sourceSquare, targetSquare);
    if (!success) {
      setMoveFrom(null);
      setOptionSquares({});
    }
    return success;
  };

  // Handle square click (for click-to-move)
  const onSquareClick = (square) => {
    // If no piece selected, try to select this square
    if (!moveFrom) {
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setMoveFrom(square);
        showLegalMoves(square);
      }
      return;
    }

    // If clicking the same square, deselect
    if (square === moveFrom) {
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    // If clicking another piece of same color, select that instead
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setMoveFrom(square);
      showLegalMoves(square);
      return;
    }

    // Try to make the move
    handleUserMove(moveFrom, square);
  };

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

  // Play a move from the suggestions list
  const playMove = (move) => {
    try {
      const result = chess.move(move.san);
      if (result) {
        const newPosition = chess.fen();
        setPosition(newPosition);
        setMoveHistory([...moveHistory, move.san]);
        setMoveSequence([...moveSequence, move.uci]);
        setChess(new Chess(newPosition)); // Update chess instance
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  // Go back one move
  const goBack = () => {
    if (moveHistory.length === 0) return;
    
    const newHistory = moveHistory.slice(0, -1);
    const newSequence = moveSequence.slice(0, -1);
    
    const newGame = new Chess();
    newHistory.forEach(move => newGame.move(move));
    
    setChess(newGame);
    setPosition(newGame.fen());
    setMoveHistory(newHistory);
    setMoveSequence(newSequence);
    setMoveFrom(null);
    setOptionSquares({});
  };

  // Reset to starting position
  const reset = () => {
    const newGame = new Chess();
    setChess(newGame);
    setPosition(newGame.fen());
    setMoveHistory([]);
    setMoveSequence([]);
    setMoveFrom(null);
    setOptionSquares({});
    setShowTrainingOptions(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBack && (
            <button className="btn-explorer" onClick={onBack} style={{ padding: '0.4rem 0.8rem' }}>
              ←
            </button>
          )}
          <h2>Opening Explorer</h2>
        </div>
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
              arePiecesDraggable={true}
              onPieceDragBegin={onPieceDragBegin}
              onPieceDrop={onPieceDrop}
              onSquareClick={onSquareClick}
              customSquareStyles={{
                ...optionSquares,
                ...(moveFrom ? {
                  [moveFrom]: {
                    backgroundColor: 'rgba(100, 255, 218, 0.4)',
                    boxShadow: 'inset 0 0 0 3px rgba(100, 255, 218, 0.8)'
                  }
                } : {})
              }}
              customBoardStyle={{ borderRadius: '4px' }}
            />
          </div>

          <div className="opening-info">
            <div className="explorer-instructions">
              <span className="instruction-icon">💡</span>
              <span>Move pieces on the board or click a suggested move below</span>
            </div>
            
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
                  className="btn-toggle-training"
                  onClick={() => setShowTrainingOptions(!showTrainingOptions)}
                >
                  {showTrainingOptions ? '▼' : '▶'} Training Options
                </button>
                
                {showTrainingOptions && (
                  <div className="training-options-content">
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
                          onClick={() => onPracticePuzzles && onPracticePuzzles(openingInfo, moveSequence)}
                        >
                          📊 Practice Puzzles ({puzzleCount})
                        </button>
                      </div>
                    )}
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
                    <div className="move-stats-labels">
                      <span className="label-white">{move.winRate.white}%</span>
                      <span className="label-draws">{move.winRate.draws}%</span>
                      <span className="label-black">{move.winRate.black}%</span>
                    </div>
                    <div className="stat-bar">
                      <div className="bar-white" style={{ width: `${move.winRate.white}%` }}></div>
                      <div className="bar-draws" style={{ width: `${move.winRate.draws}%` }}></div>
                      <div className="bar-black" style={{ width: `${move.winRate.black}%` }}></div>
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
