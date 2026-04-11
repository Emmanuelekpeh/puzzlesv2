import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { recordAttempt, recordSolve, getPuzzleTrack } from '../services/puzzleService';
import './PuzzleSolver.css';

function uciToMove(uci) {
  if (!uci || uci.length < 4) return null;
  const obj = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  if (uci.length > 4) obj.promotion = uci[4];
  return obj;
}

const PuzzleSolver = ({ puzzle, onNext }) => {
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

  const calcBoardWidth = useCallback(() => {
    const vw = window.innerWidth;
    if (vw <= 480) return Math.min(vw - 24, 360);
    if (vw <= 768) return Math.min(vw - 40, 420);
    return 420;
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
    setPuzzleTrack(getPuzzleTrack(puzzle.id));

    if (timerRef.current) clearInterval(timerRef.current);

    // Auto-play the opponent's setup move after a brief delay
    const setupMove = uciToMove(puzzle.moves[0]);
    if (setupMove) {
      const timer = setTimeout(() => {
        try {
          const result = g.move(setupMove);
          if (result) {
            setPosition(g.fen());
            setMoveHistory([result.san]);
            setFeedback({ type: 'prompt', message: `Your turn. Find the best move for ${g.turn() === 'w' ? 'White' : 'Black'}.` });
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
          setFeedback({ type: 'success', message: 'Solved.' });
          setTimerActive(false);
          setSolved(true);
          recordSolve(puzzle.id);
          setPuzzleTrack(getPuzzleTrack(puzzle.id));
          return;
        }
        if (result) {
          const newHistory = [...history, result.san];
          setPosition(g.fen());
          setMoveHistory(newHistory);
          setUserMoveIdx(nextIdx + 1);

          if (nextIdx + 1 >= puzzle.moves.length) {
            setTimerActive(false);
            setSolved(true);
            recordSolve(puzzle.id);
            setPuzzleTrack(getPuzzleTrack(puzzle.id));
            setFeedback({ type: 'success', message: 'Solved.' });
          } else {
            setFeedback({ type: 'correct', message: 'Correct. Keep going.' });
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
      setHintSquare(fromSq);
      setFeedback({ type: 'hint', message: `Look at the piece on ${fromSq}.` });
    }
  };

  const onDrop = (from, to, piece) => {
    if (locked || solved || !chess) return false;

    if (!attempted) {
      setAttempted(true);
      recordAttempt(puzzle.id);
      setPuzzleTrack(getPuzzleTrack(puzzle.id));
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
      setHintSquare(null);
      const newHistory = [...moveHistory, move.san];
      setChess(g);
      setPosition(g.fen());
      setMoveHistory(newHistory);

      const nextIdx = userMoveIdx + 1;

      if (nextIdx >= puzzle.moves.length) {
        setTimerActive(false);
        setSolved(true);
        setLocked(true);
        recordSolve(puzzle.id);
        setPuzzleTrack(getPuzzleTrack(puzzle.id));
        setFeedback({ type: 'success', message: 'Solved.' });
      } else {
        setUserMoveIdx(nextIdx);
        playOpponentMove(g, nextIdx, newHistory);
      }
      return true;
    } else {
      setFeedback({ type: 'error', message: 'Wrong move. Try again.' });
      return false;
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
    setUserMoveIdx(1);
    setFeedback({ type: 'prompt', message: `Your turn. Find the best move for ${g.turn() === 'w' ? 'White' : 'Black'}.` });
    setLocked(false);
    setSolved(false);
    setAttempted(false);
    setHintSquare(null);
    setMoveHistory(g.history());
    setTimeSpent(0);
    setTimerActive(true);
    startRef.current = Date.now();
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="solver">
      <div className="solver-info">
        <div className="solver-meta">
          <span className="meta-rating">{puzzle.rating}</span>
          <span className="meta-themes">{puzzle.themes.slice(0, 3).join(' · ')}</span>
          <span className="meta-timer">{formatTime(timeSpent)}</span>
        </div>
        <div className="solver-puzzle-stats">
          <span>Seen {puzzleTrack.appearances}x</span>
          <span>Attempted {puzzleTrack.attempts}x</span>
          <span>Solved {puzzleTrack.solves}x</span>
        </div>
      </div>

      <div className="solver-board">
        <Chessboard
          position={position}
          onPieceDrop={onDrop}
          boardWidth={boardWidth}
          arePiecesDraggable={!locked && !solved}
          boardOrientation={puzzle.orientation}
          animationDuration={300}
          customBoardStyle={{
            borderRadius: '4px',
          }}
          customDarkSquareStyle={{ backgroundColor: '#779952' }}
          customLightSquareStyle={{ backgroundColor: '#edeed1' }}
          customSquareStyles={hintSquare ? { [hintSquare]: { boxShadow: 'inset 0 0 0 4px #e9a820' } } : {}}
        />
      </div>

      {feedback && (
        <div className={`solver-feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="solver-moves">
        {moveHistory.length > 0 && moveHistory.map((m, i) => (
          <span key={i} className="move-notation">
            {i % 2 === 0 && <span className="move-number">{Math.floor(i / 2) + 1}.</span>}
            {m}
          </span>
        ))}
      </div>

      <div className="solver-actions">
        <button className="btn-solver btn-retry" onClick={handleRetry} disabled={locked && !solved}>
          Retry
        </button>
        <button className="btn-solver btn-hint" onClick={handleHint} disabled={locked || solved || hintSquare}>
          Hint
        </button>
        <button className="btn-solver btn-next" onClick={onNext}>
          {solved ? 'Next' : 'Skip'}
        </button>
      </div>
    </div>
  );
};

export default PuzzleSolver;
