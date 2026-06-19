import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { fetchOpeningPosition, getMoveExplanation } from '../services/openingService';
import { updateOpeningProgress, getOpeningProgress } from '../services/indexedDBService';
import './OpeningTrainer.css';

const OpeningTrainer = ({ line, onComplete }) => {
  const [chess, setChess] = useState(new Chess());
  const [position, setPosition] = useState('');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(null);
  const [boardWidth, setBoardWidth] = useState(480);
  const [optionSquares, setOptionSquares] = useState({});
  const [moveFrom, setMoveFrom] = useState(null);

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

  // Load progress
  useEffect(() => {
    const loadProgress = async () => {
      const lineId = `${line.eco}_${line.color}_${line.moves.join('_')}`;
      const prog = await getOpeningProgress(lineId);
      setProgress(prog);
    };
    loadProgress();
  }, [line]);

  // Initialize position
  useEffect(() => {
    const game = new Chess();
    setChess(game);
    setPosition(game.fen());
    setCurrentMoveIndex(0);
    setFeedback({ type: 'prompt', message: `Playing as ${line.color}. Make the opening move.` });
  }, [line]);

  const showLegalMoves = (square) => {
    if (!chess) return;
    const moves = chess.moves({ square, verbose: true });
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

  const onPieceDragBegin = (piece, sourceSquare) => {
    if (completed) return;
    if (piece[0] !== chess.turn()) return;
    setMoveFrom(sourceSquare);
    showLegalMoves(sourceSquare);
  };

  const onSquareClick = (square) => {
    if (completed) return;

    if (!moveFrom) {
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setMoveFrom(square);
        showLegalMoves(square);
      }
      return;
    }

    if (square === moveFrom) {
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setMoveFrom(square);
      showLegalMoves(square);
      return;
    }

    // Try to make the move
    onDrop(moveFrom, square);
  };

  const onDrop = async (from, to) => {
    if (completed) return false;

    const game = new Chess(chess.fen());
    let move;
    try {
      move = game.move({ from, to, promotion: 'q' });
    } catch {
      setFeedback({ type: 'error', message: 'Illegal move' });
      return false;
    }

    if (!move) {
      setFeedback({ type: 'error', message: 'Illegal move' });
      return false;
    }

    setMoveFrom(null);
    setOptionSquares({});

    // Check if this is the correct move
    const correctMove = line.moves[currentMoveIndex];
    const userUci = `${move.from}${move.to}${move.promotion || ''}`;

    if (userUci === correctMove || move.san === correctMove) {
      // Correct!
      setChess(game);
      setPosition(game.fen());
      setFeedback({ 
        type: 'correct', 
        message: getMoveExplanation(line.name, currentMoveIndex, move.san) 
      });

      // Update progress
      if (progress) {
        const lineId = `${line.eco}_${line.color}_${line.moves.join('_')}`;
        await updateOpeningProgress(lineId, {
          ...progress,
          eco: line.eco,
          name: line.name,
          color: line.color,
          attempts: (progress.attempts || 0) + 1,
          correctMoves: (progress.correctMoves || 0) + 1
        });
      }

      // Move to next
      const nextIndex = currentMoveIndex + 1;

      if (nextIndex >= line.moves.length) {
        // Line complete!
        setCompleted(true);
        setFeedback({ type: 'success', message: `🎉 Opening line complete! You've mastered ${line.name}` });
        setTimeout(() => onComplete && onComplete(), 2000);
        return true;
      }

      // Play opponent's response (if any)
      if (nextIndex < line.moves.length) {
        setTimeout(() => {
          playOpponentMove(game, nextIndex);
        }, 800);
      }

      setCurrentMoveIndex(nextIndex);
      return true;
    } else {
      // Wrong move
      setFeedback({ 
        type: 'error', 
        message: `Not the book move. Try again!` 
      });

      // Update progress
      if (progress) {
        const lineId = `${line.eco}_${line.color}_${line.moves.join('_')}`;
        await updateOpeningProgress(lineId, {
          ...progress,
          eco: line.eco,
          name: line.name,
          color: line.color,
          attempts: (progress.attempts || 0) + 1,
          incorrectMoves: (progress.incorrectMoves || 0) + 1
        });
      }

      return false;
    }
  };

  const playOpponentMove = useCallback((game, moveIndex) => {
    const oppMove = line.moves[moveIndex];
    if (!oppMove) return;

    try {
      const result = game.move(oppMove);
      if (result) {
        setChess(game);
        setPosition(game.fen());
        setCurrentMoveIndex(moveIndex + 1);
        
        if (moveIndex + 1 < line.moves.length) {
          setFeedback({ type: 'prompt', message: 'Your turn. What\'s the next move?' });
        }
      }
    } catch (error) {
      console.error('Error playing opponent move:', error);
    }
  }, [line]);

  const handleHint = async () => {
    if (completed) return;
    const nextMove = line.moves[currentMoveIndex];
    if (nextMove) {
      const from = nextMove.slice(0, 2);
      setFeedback({ type: 'hint', message: `Hint: Look at the piece on ${from}` });
    }
  };

  const handleShowMove = () => {
    if (completed) return;
    const nextMove = line.moves[currentMoveIndex];
    if (nextMove) {
      setFeedback({ type: 'hint', message: `The book move is: ${nextMove}` });
    }
  };

  const handleRetry = () => {
    const game = new Chess();
    setChess(game);
    setPosition(game.fen());
    setCurrentMoveIndex(0);
    setCompleted(false);
    setFeedback({ type: 'prompt', message: `Playing as ${line.color}. Make the opening move.` });
    setMoveFrom(null);
    setOptionSquares({});
  };

  const customSquareStyles = { ...optionSquares };
  if (moveFrom) {
    customSquareStyles[moveFrom] = {
      ...customSquareStyles[moveFrom],
      backgroundColor: 'rgba(100, 255, 218, 0.4)',
      boxShadow: 'inset 0 0 0 3px rgba(100, 255, 218, 0.8)'
    };
  }

  return (
    <div className="opening-trainer">
      <div className="trainer-header">
        <div className="opening-info-compact">
          <span className="eco-badge">{line.eco}</span>
          <h3>{line.name}</h3>
        </div>
        <div className="progress-indicator">
          <span>Move {currentMoveIndex + 1} / {line.moves.length}</span>
          {progress && (
            <span className="mastery">Mastery: {progress.masteryLevel || 0}%</span>
          )}
        </div>
      </div>

      <div className="trainer-board">
        <Chessboard
          position={position}
          onPieceDrop={onDrop}
          onPieceDragBegin={onPieceDragBegin}
          onSquareClick={onSquareClick}
          boardWidth={boardWidth}
          arePiecesDraggable={!completed}
          boardOrientation={line.color === 'white' ? 'white' : 'black'}
          customSquareStyles={customSquareStyles}
        />
      </div>

      {feedback && (
        <div className={`trainer-feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="trainer-actions">
        <button className="btn-trainer" onClick={handleHint} disabled={completed}>
          Hint
        </button>
        <button className="btn-trainer" onClick={handleShowMove} disabled={completed}>
          Show Move
        </button>
        <button className="btn-trainer" onClick={handleRetry}>
          Retry
        </button>
        {completed && (
          <button className="btn-trainer btn-primary" onClick={onComplete}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default OpeningTrainer;
