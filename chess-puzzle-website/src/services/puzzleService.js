import lichessPuzzleData from '../data/lichess_puzzles.json';

const STORAGE_KEY = 'chess_puzzle_tracker';

// Filter out broken puzzles: need at least 2 moves (setup + 1 solver move)
const puzzles = lichessPuzzleData.puzzles
  .filter(p => p.moves && p.moves.length >= 2)
  .map(p => ({
    id: p.id,
    fen: p.fen,
    moves: p.moves,
    rating: p.rating,
    themes: p.themes,
    orientation: p.fen.includes(' w ') ? 'black' : 'white',
  }));

function loadTracker() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTracker(tracker) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
}

export function getNextPuzzle() {
  const tracker = loadTracker();

  let minAppearances = Infinity;
  for (const p of puzzles) {
    const stats = tracker[p.id];
    const appearances = stats ? stats.a : 0;
    if (appearances < minAppearances) minAppearances = appearances;
  }

  const candidates = puzzles.filter(p => {
    const stats = tracker[p.id];
    return (stats ? stats.a : 0) === minAppearances;
  });

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Record appearance
  if (!tracker[chosen.id]) {
    tracker[chosen.id] = { a: 0, t: 0, s: 0 };
  }
  tracker[chosen.id].a++;
  saveTracker(tracker);

  return chosen;
}

export function recordAttempt(puzzleId) {
  const tracker = loadTracker();
  if (!tracker[puzzleId]) {
    tracker[puzzleId] = { a: 0, t: 0, s: 0 };
  }
  tracker[puzzleId].t++;
  saveTracker(tracker);
}

export function recordSolve(puzzleId) {
  const tracker = loadTracker();
  if (!tracker[puzzleId]) {
    tracker[puzzleId] = { a: 0, t: 0, s: 0 };
  }
  tracker[puzzleId].s++;
  saveTracker(tracker);
}

export function getGlobalStats() {
  const tracker = loadTracker();
  let totalAppearances = 0;
  let totalAttempts = 0;
  let totalSolves = 0;
  let puzzlesSeen = 0;

  for (const id of Object.keys(tracker)) {
    const s = tracker[id];
    totalAppearances += s.a;
    totalAttempts += s.t;
    totalSolves += s.s;
    if (s.a > 0) puzzlesSeen++;
  }

  return {
    totalPuzzles: puzzles.length,
    puzzlesSeen,
    totalAppearances,
    totalAttempts,
    totalSolves,
    solveRate: totalAttempts > 0 ? Math.round((totalSolves / totalAttempts) * 100) : 0,
  };
}

export function getPuzzleById(id) {
  return puzzles.find(p => p.id === id) || null;
}

export function getPuzzleTrack(puzzleId) {
  const tracker = loadTracker();
  const s = tracker[puzzleId];
  return s ? { appearances: s.a, attempts: s.t, solves: s.s } : { appearances: 0, attempts: 0, solves: 0 };
}
