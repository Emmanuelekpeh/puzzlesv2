import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import confetti from 'canvas-confetti';
import { useSwipeable } from 'react-swipeable';
import { recordAttempt, recordSolve, getPuzzleTrack } from '../services/puzzleService';
import { analyzeWrongMove } from '../services/errorDetectionService';
import { checkAchievements } from '../services/achievementService';
import { getGlobalStats } from '../services/indexedDBService';
import PostSolveAnalysis from './PostSolveAnalysis';
import './PuzzleSolver.css';

function uciToMove(uci) {
  if (!uci || uci.length < 4) return null;
  const obj = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  if (uci.length > 4) obj.promotion = uci[4];
  return obj;
}

const THEMES = {
  green: { light: '#edeed1', dark: '#779952' },
  wood: { light: '#f0d9b5', dark: '#b58863' },
  blue: { light: '#dee3e6', dark: '#8ca2ad' },
  purple: { light: '#efedfa', dark: '#76689a' },
};

const vibrate = (pattern) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try { window.navigator.vibrate(pattern); } catch(e) {}
  }
};

const PuzzleSolver = ({ puzzle, onNext, refreshStats }) => {
  const [position, setPosition] = useState(puzzle.fen);
  const [chess, setChess] = useState(null);
  const [userMoveIdx, setUserMoveIdx] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(true);
  const [solved, setSolved] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const [puzzleTrack, setPuzzleTrack] = useState({ appearances: 0, attempts: 0, solves: 0 });
  const [boardWidth, setBoardWidth] = useState(400);
  const [hintSquare, setHintSquare] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [inCheck, setInCheck] = useState(false);
  const [kingSquare, setKingSquare] = useState(null);
  const [moveFrom, setMoveFrom] = useState(null);
  const [optionSquares, setOptionSquares] = useState({});
  const [boardTheme, setBoardTheme] = useState(() => localStorage.getItem('chessTheme') || 'green');
  const [historyFens, setHistoryFens] = useState([]);
  const [reviewIdx, setReviewIdx] = useState(null);
  const [showThemes, setShowThemes] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [playingSolution, setPlayingSolution] = useState(false);
  const [solutionMoveIdx, setSolutionMoveIdx] = useState(0);
  const solutionTimerRef = useRef(null);
  const [swipeIndicator, setSwipeIndicator] = useState(null);

  useEffect(() => {
    localStorage.setItem('chessTheme', boardTheme);
  }, [boardTheme]);

  const calcBoardWidth = useCallback(() => {
    const vw = window.innerWidth;
    if (vw <= 480) return vw - 16; // Use almost full width on mobile
    if (vw <= 768) return Math.min(vw - 32, 480);
    return 480; // Larger board on desktop
  }, []);

  const updateCheckState = useCallback((g) => {
    if (g.inCheck()) {
      setInCheck(true);
      const turn = g.turn();
      const board = g.board();
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const piece = board[i][j];
          if (piece && piece.type === 'k' && piece.color === turn) {
            setKingSquare(String.fromCharCode(97 + j) + (8 - i));
            return;
          }
        }
      }
    } else {
      setInCheck(false);
      setKingSquare(null);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setBoardWidth(calcBoardWidth());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calcBoardWidth]);

  // Initialize puzzle: load FEN, auto-play opponent setup move
  useEffect(() => {
    const g = new Chess();
    g.load(puzzle.fen);

    setChess(g);
    setPosition(puzzle.fen);
    setUserMoveIdx(1);
    setFeedback(null);
    setLocked(true);
    setSolved(false);
    setAttempted(false);
    setMoveHistory([]);
    setTimeSpent(0);
    setTimerActive(false);
    setHintSquare(null);
    setLastMove(null);
    setInCheck(false);
    setKingSquare(null);
    setMoveFrom(null);
    setOptionSquares({});
    setHistoryFens([]);
    setReviewIdx(null);
    setShowThemes(false); // Hide themes on new puzzle
    setShowAnalysis(false); // Hide analysis on new puzzle
    setPlayingSolution(false);
    setSolutionMoveIdx(0);
    setPuzzleTrack(getPuzzleTrack(puzzle.id));

    if (timerRef.current) clearInterval(timerRef.current);
    if (solutionTimerRef.current) clearInterval(solutionTimerRef.current);

    // Auto-play the opponent's setup move after a brief delay
    const setupMove = uciToMove(puzzle.moves[0]);
    if (setupMove) {
      const timer = setTimeout(() => {
        try {
          const result = g.move(setupMove);
          if (result) {
            setPosition(g.fen());
            setHistoryFens([g.fen()]);
            setMoveHistory([result.san]);
            setLastMove({ from: result.from, to: result.to });
            updateCheckState(g);
            setFeedback({ type: 'prompt', message: `Your turn. Find the move for ${g.turn() === 'w' ? 'white' : 'black'}.` });
          } else {
            setFeedback({ type: 'error', message: 'Broken puzzle. Skipping...' });
            setTimeout(() => onNext(), 1000);
            return;
          }
        } catch {
          setFeedback({ type: 'error', message: 'Broken puzzle. Skipping...' });
          setTimeout(() => onNext(), 1000);
          return;
        }
        setLocked(false);
        setTimerActive(true);
        startRef.current = Date.now();
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setLocked(false);
      setTimerActive(true);
      startRef.current = Date.now();
    }
  }, [puzzle]);

  // Timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  const playOpponentMove = useCallback((g, nextIdx, history) => {
    if (nextIdx >= puzzle.moves.length) return;

    setLocked(true);
    const oppMove = uciToMove(puzzle.moves[nextIdx]);

    setTimeout(() => {
      if (oppMove) {
        let result;
        try {
          result = g.move(oppMove);
        } catch {
          setFeedback({ type: 'success', message: 'Puzzle solved.' });
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#64ffda', '#3498db', '#e9a820']
          });
          setTimerActive(false);
          setSolved(true);
          setShowThemes(true); // Reveal themes on solve
          const wasFirstTry = !attempted || (history.length === 1);
          recordSolve(puzzle.id, timeSpent, wasFirstTry);
          setPuzzleTrack(getPuzzleTrack(puzzle.id));
          if (typeof refreshStats === 'function') {
            refreshStats();
          }
          // Check achievements
          (async () => {
            const stats = await getGlobalStats();
            const newAchievements = await checkAchievements(stats, { timeSpent, wasFirstTry });
            if (newAchievements.length > 0 && typeof window.showAchievement === 'function') {
              newAchievements.forEach(ach => window.showAchievement(ach));
            }
          })();
          // Update session stats
          if (typeof window.updateSessionStats === 'function') {
            window.updateSessionStats(true);
          }
          // Show post-solve analysis after short delay
          setTimeout(() => {
            setShowAnalysis(true);
            setShowThemes(true);
          }, 1500);
          return;
        }
        if (result) {
          const newHistory = [...history, result.san];
          setPosition(g.fen());
          setHistoryFens(prev => [...prev, g.fen()]);
          setMoveHistory(newHistory);
          setUserMoveIdx(nextIdx + 1);
          setLastMove({ from: result.from, to: result.to });
          updateCheckState(g);

          if (nextIdx + 1 >= puzzle.moves.length) {
            vibrate([100, 50, 100]); // Puzzle solved buzz
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#64ffda', '#3498db', '#e9a820']
            });
            setTimerActive(false);
            setSolved(true);
            setShowThemes(true); // Reveal themes on solve
            const wasFirstTry = newHistory.length <= 2; // Setup move + 1 user move
            recordSolve(puzzle.id, timeSpent, wasFirstTry);
            setPuzzleTrack(getPuzzleTrack(puzzle.id));
            setFeedback({ type: 'success', message: 'Puzzle solved.' });
            if (typeof refreshStats === 'function') {
              refreshStats();
            }
            // Check achievements
            (async () => {
              const stats = await getGlobalStats();
              const newAchievements = await checkAchievements(stats, { timeSpent, wasFirstTry });
              if (newAchievements.length > 0 && typeof window.showAchievement === 'function') {
                newAchievements.forEach(ach => window.showAchievement(ach));
              }
            })();
            // Update session stats
            if (typeof window.updateSessionStats === 'function') {
              window.updateSessionStats(true);
            }
            // Show post-solve analysis after short delay
            setTimeout(() => {
              setShowAnalysis(true);
              setShowThemes(true);
            }, 1500);
          } else {
            vibrate(10); // Correct move bump
            setFeedback({ type: 'correct', message: 'Correct. Continue.' });
            setLocked(false);
          }
        }
      } else {
        setLocked(false);
      }
    }, 500);
  }, [puzzle]);

  const handleHint = () => {
    if (locked || solved) return;
    const nextMove = puzzle.moves[userMoveIdx];
    if (nextMove) {
      const fromSq = nextMove.slice(0, 2);
      // More subtle hint - just highlight the piece, don't tell them the square
      setHintSquare(fromSq);
      setFeedback({ type: 'hint', message: 'Consider your most forcing move.' });
    }
  };

  const handleShowTheme = () => {
    if (locked || solved || showThemes) return;
    setShowThemes(true);
    setFeedback({ type: 'hint', message: `Theme: ${puzzle.themes.slice(0, 2).join(', ')}` });
  };

  const onDrop = (from, to, piece) => {
    if (locked || solved || !chess) return false;

    setMoveFrom(null); // Clear selected square on drop
    setOptionSquares({});
    setReviewIdx(null);

    if (!attempted) {
      setAttempted(true);
      recordAttempt(puzzle.id);
      setPuzzleTrack(getPuzzleTrack(puzzle.id));
      // Update session stats for attempt
      if (typeof window.updateSessionStats === 'function') {
        window.updateSessionStats(false);
      }
    }

    const expected = puzzle.moves[userMoveIdx];
    const isPromotion = piece?.[1] === 'P' && (to[1] === '8' || to[1] === '1');

    // For promotions: if from/to match the expected answer, use its promotion piece.
    // This handles underpromotion puzzles (knight, rook, bishop) without a picker.
    let promo = undefined;
    if (isPromotion) {
      const expectedFrom = expected?.slice(0, 2);
      const expectedTo = expected?.slice(2, 4);
      const expectedPromo = expected?.length > 4 ? expected[4] : 'q';
      promo = (from === expectedFrom && to === expectedTo) ? expectedPromo : 'q';
    }

    const g = new Chess(chess.fen());
    let move;
    try {
      move = g.move({ from, to, promotion: promo });
    } catch {
      setFeedback({ type: 'error', message: 'Illegal move.' });
      return false;
    }
    if (!move) {
      setFeedback({ type: 'error', message: 'Illegal move.' });
      return false;
    }

    const userUci = move.from + move.to + (move.promotion || '');

    if (userUci === expected) {
      vibrate(10); // Correct move bump
      setHintSquare(null);
      setMoveFrom(null);
      const newHistory = [...moveHistory, move.san];
      setChess(g);
      setPosition(g.fen());
      setHistoryFens(prev => [...prev, g.fen()]);
      setMoveHistory(newHistory);
      setLastMove({ from: move.from, to: move.to });
      updateCheckState(g);

      const nextIdx = userMoveIdx + 1;

      if (nextIdx >= puzzle.moves.length) {
        vibrate([100, 50, 100]); // Puzzle solved buzz
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#64ffda', '#3498db', '#e9a820']
        });
        setTimerActive(false);
        setSolved(true);
        setLocked(true);
        setShowThemes(true); // Reveal themes on solve
        const wasFirstTry = newHistory.length <= 2; // Setup move + 1 user move
        recordSolve(puzzle.id, timeSpent, wasFirstTry);
        setPuzzleTrack(getPuzzleTrack(puzzle.id));
        setFeedback({ type: 'success', message: '🎉 Excellent! Puzzle Solved.' });
        if (typeof refreshStats === 'function') {
          refreshStats();
        }
        // Check achievements
        (async () => {
          const stats = await getGlobalStats();
          const newAchievements = await checkAchievements(stats, { timeSpent, wasFirstTry });
          if (newAchievements.length > 0 && typeof window.showAchievement === 'function') {
            newAchievements.forEach(ach => window.showAchievement(ach));
          }
        })();
        // Update session stats
        if (typeof window.updateSessionStats === 'function') {
          window.updateSessionStats(true);
        }
        // Show post-solve analysis after short delay
        setTimeout(() => {
          setShowAnalysis(true);
          setShowThemes(true);
        }, 1500);
      } else {
        setUserMoveIdx(nextIdx);
        playOpponentMove(g, nextIdx, newHistory);
      }
      return true;
    } else {
      vibrate([50, 50, 50]); // Error buzz
      
      // Enhanced wrong move feedback
      const analysis = analyzeWrongMove(chess.fen(), { from, to, promotion: promo }, expected, puzzle);
      setFeedback({ type: 'error', message: analysis.message });
      
      setMoveFrom(null);
      return false;
    }
  };

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
    if (locked || solved || !chess) return;
    setReviewIdx(null);
    if (piece[0] === chess.turn()) {
      setMoveFrom(sourceSquare);
      showLegalMoves(sourceSquare);
    }
  };

  const onSquareClick = (square) => {
    if (locked || solved || !chess) return;
    setReviewIdx(null);

    // If we haven't selected a square yet
    if (!moveFrom) {
      const piece = chess.get(square);
      // Only select if there's a piece and it belongs to the player to move
      if (piece && piece.color === chess.turn()) {
        setMoveFrom(square);
        showLegalMoves(square);
      }
      return;
    }

    // If we click the same square again, deselect it
    if (square === moveFrom) {
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    // If we click another piece of our own color, select that one instead
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setMoveFrom(square);
      showLegalMoves(square);
      return;
    }

    // Otherwise, attempt to move from moveFrom to the clicked square
    // For click-to-move, we need to handle promotion. 
    // We'll pass the piece type from the starting square to onDrop to help it figure out if it's a promotion.
    const sourcePiece = chess.get(moveFrom);
    const pieceStr = sourcePiece ? sourcePiece.color + sourcePiece.type.toUpperCase() : null;
    
    const moveSuccess = onDrop(moveFrom, square, pieceStr);
    if (!moveSuccess) {
      setMoveFrom(null); // Clear selection on invalid move
      setOptionSquares({});
    }
  };

  const handleRetry = () => {
    const g = new Chess();
    g.load(puzzle.fen);
    const setupMove = uciToMove(puzzle.moves[0]);
    if (setupMove) {
      try { g.move(setupMove); } catch { /* skip */ }
    }

    setChess(g);
    setPosition(g.fen());
    setHistoryFens(g.history().length > 0 ? [g.fen()] : []);
    setUserMoveIdx(1);
    setFeedback({ type: 'prompt', message: `Your turn. Find the move for ${g.turn() === 'w' ? 'white' : 'black'}.` });
    setLocked(false);
    setSolved(false);
    setAttempted(false);
    setHintSquare(null);
    setMoveFrom(null);
    setOptionSquares({});
    setReviewIdx(null);
    setShowAnalysis(false); // Hide analysis on retry
    setPlayingSolution(false);
    setSolutionMoveIdx(0);
    setMoveHistory(g.history());
    
    const hist = g.history({ verbose: true });
    if (hist.length > 0) {
      const last = hist[hist.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }
    updateCheckState(g);

    setTimeSpent(0);
    setTimerActive(true);
    startRef.current = Date.now();
  };

  const handleSkip = () => {
    setShowAnalysis(true);
    setShowThemes(true);
    setLocked(true);
    setTimerActive(false);
    // Start solution playback
    playSolution();
  };

  const playSolution = () => {
    // Reset to starting position
    const g = new Chess();
    g.load(puzzle.fen);
    
    // Play setup move
    const setupMove = uciToMove(puzzle.moves[0]);
    if (setupMove) {
      try { g.move(setupMove); } catch { /* skip */ }
    }

    setChess(g);
    setPosition(g.fen());
    setPlayingSolution(true);
    setSolutionMoveIdx(1); // Start from first user move
    setMoveHistory([]);
    setHistoryFens([g.fen()]);

    // Auto-play solution moves
    let idx = 1;
    const intervalId = setInterval(() => {
      if (idx >= puzzle.moves.length) {
        clearInterval(intervalId);
        setPlayingSolution(false);
        return;
      }

      const move = uciToMove(puzzle.moves[idx]);
      if (move) {
        try {
          const result = g.move(move);
          setPosition(g.fen());
          setHistoryFens(prev => [...prev, g.fen()]);
          setMoveHistory(prev => [...prev, result.san]);
          setLastMove({ from: result.from, to: result.to });
          updateCheckState(g);
          setSolutionMoveIdx(idx + 1);
        } catch {
          clearInterval(intervalId);
          setPlayingSolution(false);
        }
      }

      idx++;
    }, 1000); // 1 second per move

    solutionTimerRef.current = intervalId;
  };

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    if (solutionTimerRef.current) {
      clearInterval(solutionTimerRef.current);
      setPlayingSolution(false);
    }
  };

  // Swipe gesture handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!locked && !solved && !showAnalysis) {
        handleHint();
        setSwipeIndicator('hint');
        setTimeout(() => setSwipeIndicator(null), 500);
      }
    },
    onSwipedRight: () => {
      if (!showAnalysis) {
        if (solved) {
          onNext();
        } else {
          handleSkip();
        }
        setSwipeIndicator('next');
        setTimeout(() => setSwipeIndicator(null), 500);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 50
  });

  // Keyboard shortcuts state ref to avoid stale closures
  const stateRef = useRef({ solved, locked, onNext, handleRetry, handleHint });
  useEffect(() => {
    stateRef.current = { solved, locked, onNext, handleRetry, handleHint };
  }, [solved, locked, onNext, handleRetry, handleHint]);

  // Keyboard navigation for review mode and actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input (though we don't have any right now)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const { solved, locked, onNext, handleRetry, handleHint } = stateRef.current;

      // Close analysis on any key press when it's showing
      if (showAnalysis) {
        handleCloseAnalysis();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setReviewIdx(prev => {
          if (prev === null) return historyFens.length > 1 ? historyFens.length - 2 : -1;
          return Math.max(-1, prev - 1);
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setReviewIdx(prev => {
          if (prev === null) return null;
          const next = prev + 1;
          return next >= historyFens.length - 1 ? null : next;
        });
      } else if (e.key.toLowerCase() === 'n' || e.key === ' ') {
        e.preventDefault();
        onNext();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (locked && !solved) handleRetry();
      } else if (e.key.toLowerCase() === 'h' || e.key === '?') {
        e.preventDefault();
        if (!locked && !solved) handleHint();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        if (!locked && !solved && !showThemes) handleShowTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyFens, showAnalysis]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const customSquareStyles = { ...optionSquares };
  if (lastMove) {
    customSquareStyles[lastMove.from] = { ...customSquareStyles[lastMove.from], backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    customSquareStyles[lastMove.to] = { ...customSquareStyles[lastMove.to], backgroundColor: 'rgba(255, 255, 0, 0.4)' };
  }
  if (inCheck && kingSquare) {
    customSquareStyles[kingSquare] = { 
      ...customSquareStyles[kingSquare], 
      background: 'radial-gradient(ellipse at center, red 0%, transparent 70%)', 
      borderRadius: '50%' 
    };
  }
  if (hintSquare) {
    customSquareStyles[hintSquare] = { 
      ...customSquareStyles[hintSquare], 
      boxShadow: 'inset 0 0 0 4px #e9a820' 
    };
  }
  if (moveFrom) {
    customSquareStyles[moveFrom] = {
      ...customSquareStyles[moveFrom],
      backgroundColor: 'rgba(100, 255, 218, 0.4)',
      boxShadow: 'inset 0 0 0 3px rgba(100, 255, 218, 0.8)'
    };
  }

  const displayPosition = reviewIdx !== null ? (reviewIdx === -1 ? puzzle.fen : historyFens[reviewIdx]) : position;

  return (
    <div className="solver" {...swipeHandlers}>
      <div className="solver-info">
        <div className="solver-meta">
          <span className="meta-rating">{puzzle.rating}</span>
          <span className="meta-themes">
            {showThemes || solved 
              ? puzzle.themes.slice(0, 3).join(' · ') 
              : 'find the move'}
          </span>
          <span className="meta-timer">{formatTime(timeSpent)}</span>
        </div>
        <div className="solver-puzzle-stats">
          <span>{puzzleTrack.appearances}×</span>
          <span>{puzzleTrack.attempts} attempts</span>
          <span>{puzzleTrack.solves} solved</span>
          {playingSolution && (
            <span style={{ color: '#64ffda' }}>
              playing solution {solutionMoveIdx}/{puzzle.moves.length}
            </span>
          )}
        </div>
      </div>

      <div className="solver-board">
        <Chessboard
          position={displayPosition}
          onPieceDrop={onDrop}
          onPieceDragBegin={onPieceDragBegin}
          onSquareClick={onSquareClick}
          boardWidth={boardWidth}
          arePiecesDraggable={!locked && !solved && reviewIdx === null}
          boardOrientation={puzzle.orientation}
          animationDuration={200}
          customBoardStyle={{
            borderRadius: '4px',
          }}
          customDarkSquareStyle={{ backgroundColor: THEMES[boardTheme].dark }}
          customLightSquareStyle={{ backgroundColor: THEMES[boardTheme].light }}
          customSquareStyles={customSquareStyles}
        />
      </div>

      <div className="theme-selector">
        {Object.keys(THEMES).map(t => (
          <button 
            key={t} 
            className={`theme-btn ${boardTheme === t ? 'active' : ''}`}
            style={{ backgroundColor: THEMES[t].dark, borderLeftColor: THEMES[t].light }}
            onClick={() => setBoardTheme(t)}
            title={`${t.charAt(0).toUpperCase() + t.slice(1)} Theme`}
          />
        ))}
      </div>

      {feedback && (
        <div className={`solver-feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="solver-moves">
        {moveHistory.length > 0 && moveHistory.map((m, i) => (
          <span 
            key={i} 
            className={`move-notation ${reviewIdx === i ? 'active' : ''}`}
            onClick={() => setReviewIdx(i)}
          >
            {i % 2 === 0 && <span className="move-number">{Math.floor(i / 2) + 1}.</span>}
            {m}
          </span>
        ))}
      </div>

      <div className="solver-actions">
        <button className="btn-solver btn-retry" onClick={handleRetry} disabled={locked && !solved} title="R">
          Retry
        </button>
        <button className="btn-solver btn-hint" onClick={handleHint} disabled={locked || solved || hintSquare} title="H / ?">
          Hint
        </button>
        {!showThemes && !solved && (
          <button className="btn-solver btn-theme" onClick={handleShowTheme} disabled={locked || solved} title="T">
            Theme
          </button>
        )}
        <button className="btn-solver btn-next" onClick={solved ? onNext : handleSkip} title="N / Space">
          {solved ? 'Next' : 'Skip'}
        </button>
      </div>

      {showAnalysis && (
        <PostSolveAnalysis
          puzzle={puzzle}
          solved={solved}
          timeSpent={timeSpent}
          onClose={handleCloseAnalysis}
          onRetry={handleRetry}
          onNext={onNext}
        />
      )}

      {swipeIndicator && (
        <div className={`swipe-indicator swipe-${swipeIndicator}`}>
          {swipeIndicator === 'hint' ? '← Hint' : 'Next →'}
        </div>
      )}
    </div>
  );
};

export default PuzzleSolver;
