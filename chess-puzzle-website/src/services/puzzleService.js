import {
  getAllPuzzles,
  getUserProgress,
  updateUserProgress,
  getGlobalStats,
  updateGlobalStats,
  getPuzzlesDueForReview,
  getFailedPuzzles,
} from './indexedDBService';

let puzzlesCache = null;

async function loadPuzzles() {
  if (puzzlesCache) return puzzlesCache;
  puzzlesCache = await getAllPuzzles();
  return puzzlesCache;
}

export async function getNextPuzzle(mode = 'standard', modeConfig = {}) {
  const puzzles = await loadPuzzles();
  const globalStats = await getGlobalStats();
  const userRating = globalStats.estimatedRating || 1500;
  
  let candidates = [];
  
  switch (mode) {
    case 'failed':
      // Get puzzles where attempts > solves
      const failedProgress = await getFailedPuzzles();
      const failedIds = failedProgress.map(p => p.puzzleId);
      candidates = puzzles.filter(p => failedIds.includes(p.id));
      break;
      
    case 'theme':
      // Filter by specific theme
      const theme = modeConfig.theme;
      candidates = puzzles.filter(p => 
        p.themes && p.themes.some(t => t.toLowerCase() === theme.toLowerCase())
      );
      break;
      
    case 'rating':
      // Filter by rating range
      const { min, max } = modeConfig;
      candidates = puzzles.filter(p => p.rating >= min && p.rating <= max);
      break;
      
    case 'standard':
    default:
      // Adaptive difficulty + spaced repetition
      const dueForReview = await getPuzzlesDueForReview();
      const dueIds = dueForReview.map(p => p.puzzleId);
      
      // Define rating windows
      const inRangePuzzles = puzzles.filter(p => 
        p.rating >= userRating - 200 && p.rating <= userRating + 100
      );
      const challengePuzzles = puzzles.filter(p => 
        p.rating > userRating + 100 && p.rating <= userRating + 300
      );
      const reviewPuzzles = puzzles.filter(p => 
        p.rating >= userRating - 400 && p.rating < userRating - 200
      );
      
      // Prioritize due reviews, then weighted selection
      if (dueIds.length > 0 && Math.random() < 0.4) {
        // 40% chance to show due review
        candidates = puzzles.filter(p => dueIds.includes(p.id));
      } else {
        // Weighted selection: 60% in-range, 30% challenge, 10% review
        const rand = Math.random();
        if (rand < 0.6) {
          candidates = inRangePuzzles.length > 0 ? inRangePuzzles : puzzles;
        } else if (rand < 0.9) {
          candidates = challengePuzzles.length > 0 ? challengePuzzles : inRangePuzzles;
        } else {
          candidates = reviewPuzzles.length > 0 ? reviewPuzzles : inRangePuzzles;
        }
      }
      break;
  }
  
  if (candidates.length === 0) {
    candidates = puzzles; // Fallback to all puzzles
  }
  
  // Among candidates, prefer least-seen puzzles
  let minAppearances = Infinity;
  for (const p of candidates) {
    const progress = await getUserProgress(p.id);
    if (progress.appearances < minAppearances) {
      minAppearances = progress.appearances;
    }
  }
  
  const leastSeenCandidates = [];
  for (const p of candidates) {
    const progress = await getUserProgress(p.id);
    if (progress.appearances === minAppearances) {
      leastSeenCandidates.push(p);
    }
  }
  
  // Random selection from least-seen candidates
  const chosen = leastSeenCandidates[Math.floor(Math.random() * leastSeenCandidates.length)];
  
  // Record appearance
  const progress = await getUserProgress(chosen.id);
  await updateUserProgress(chosen.id, {
    ...progress,
    appearances: progress.appearances + 1,
    lastAttemptDate: Date.now(),
  });
  
  return chosen;
}

export async function recordAttempt(puzzleId) {
  const progress = await getUserProgress(puzzleId);
  await updateUserProgress(puzzleId, {
    ...progress,
    attempts: progress.attempts + 1,
  });
}

export async function recordSolve(puzzleId, timeSpent, firstTry = false) {
  const progress = await getUserProgress(puzzleId);
  const globalStats = await getGlobalStats();
  
  // Update puzzle progress
  const newSolveCount = progress.solves + 1;
  const newFirstTryCount = firstTry ? progress.firstTrySuccesses + 1 : progress.firstTrySuccesses;
  
  // Calculate average solve time
  const totalTime = (progress.avgSolveTime * progress.solves) + timeSpent;
  const newAvgTime = totalTime / newSolveCount;
  
  // Calculate next review date (spaced repetition)
  const intervals = [1, 3, 7, 14, 30]; // days
  const intervalIndex = Math.min(newSolveCount - 1, intervals.length - 1);
  const nextReviewDate = Date.now() + (intervals[intervalIndex] * 24 * 60 * 60 * 1000);
  
  await updateUserProgress(puzzleId, {
    ...progress,
    solves: newSolveCount,
    firstTrySuccesses: newFirstTryCount,
    avgSolveTime: newAvgTime,
    nextReviewDate,
  });
  
  // Update global stats
  const newTotalSolves = globalStats.totalSolves + 1;
  const newTimeSpent = globalStats.totalTimeSpent + timeSpent;
  
  // Adjust user rating
  const puzzle = await getPuzzleById(puzzleId);
  let ratingAdjustment = 0;
  if (firstTry) {
    // Solved on first try
    if (puzzle.rating > globalStats.estimatedRating) {
      ratingAdjustment = 10; // Solved harder puzzle
    } else {
      ratingAdjustment = 5; // Solved easier puzzle
    }
  } else {
    // Solved with retries
    ratingAdjustment = 3;
  }
  
  const newRating = Math.max(800, Math.min(3000, globalStats.estimatedRating + ratingAdjustment));
  
  // Update theme performance
  const themePerformance = { ...globalStats.themePerformance };
  if (puzzle.themes && puzzle.themes.length > 0) {
    puzzle.themes.forEach(theme => {
      if (!themePerformance[theme]) {
        themePerformance[theme] = { attempted: 0, solved: 0, firstTrySolved: 0, avgTime: 0 };
      }
      themePerformance[theme].solved += 1;
      if (firstTry) {
        themePerformance[theme].firstTrySolved += 1;
      }
      const totalThemeTime = (themePerformance[theme].avgTime * (themePerformance[theme].solved - 1)) + timeSpent;
      themePerformance[theme].avgTime = totalThemeTime / themePerformance[theme].solved;
    });
  }
  
  await updateGlobalStats({
    ...globalStats,
    totalSolves: newTotalSolves,
    totalTimeSpent: newTimeSpent,
    estimatedRating: newRating,
    themePerformance,
    lastPlayDate: Date.now(),
  });
}

export async function recordFailure(puzzleId) {
  const globalStats = await getGlobalStats();
  const puzzle = await getPuzzleById(puzzleId);
  
  // Decrease rating on failure
  let ratingAdjustment = -8;
  if (puzzle.rating < globalStats.estimatedRating - 200) {
    ratingAdjustment = -5; // Failed easier puzzle
  }
  
  const newRating = Math.max(800, Math.min(3000, globalStats.estimatedRating + ratingAdjustment));
  
  await updateGlobalStats({
    ...globalStats,
    estimatedRating: newRating,
  });
}

export async function recordSkip(puzzleId) {
  const globalStats = await getGlobalStats();
  
  // Small rating penalty for skipping
  const newRating = Math.max(800, globalStats.estimatedRating - 5);
  
  await updateGlobalStats({
    ...globalStats,
    estimatedRating: newRating,
  });
}

export async function getGlobalStatsFormatted() {
  const stats = await getGlobalStats();
  const puzzles = await loadPuzzles();
  
  return {
    totalPuzzles: puzzles.length,
    puzzlesSeen: stats.totalPuzzlesSeen,
    totalAppearances: 0, // Deprecated, kept for compatibility
    totalAttempts: stats.totalAttempts,
    totalSolves: stats.totalSolves,
    solveRate: stats.totalAttempts > 0 ? Math.round((stats.totalSolves / stats.totalAttempts) * 100) : 0,
    estimatedRating: stats.estimatedRating,
  };
}

export async function getPuzzleById(id) {
  const puzzles = await loadPuzzles();
  return puzzles.find(p => p.id === id) || null;
}

export async function getPuzzleTrack(puzzleId) {
  const progress = await getUserProgress(puzzleId);
  return {
    appearances: progress.appearances,
    attempts: progress.attempts,
    solves: progress.solves,
  };
}

// Legacy compatibility wrapper
export async function fetchPuzzleById(id) {
  return getPuzzleById(id);
}

export async function markPuzzleSolved(puzzleId) {
  await recordSolve(puzzleId, 0, false);
  return getPuzzleById(puzzleId);
}

// Sample puzzles for browser (with pagination)
export async function fetchPuzzles(filters = {}, page = 1, pageSize = 24) {
  const puzzles = await loadPuzzles();
  
  let filtered = puzzles;
  
  if (filters.difficulty && filters.difficulty !== 'all') {
    // Define rating ranges for difficulty
    const difficultyRanges = {
      beginner: [0, 1400],
      easy: [1400, 1800],
      medium: [1800, 2200],
      hard: [2200, 2600],
      expert: [2600, 3500],
    };
    const [min, max] = difficultyRanges[filters.difficulty.toLowerCase()] || [0, 3500];
    filtered = filtered.filter(p => p.rating >= min && p.rating <= max);
  }
  
  if (filters.theme && filters.theme !== 'all') {
    filtered = filtered.filter(p => 
      p.themes && p.themes.some(t => t.toLowerCase() === filters.theme.toLowerCase())
    );
  }
  
  // Pagination
  const totalResults = filtered.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPuzzles = filtered.slice(startIndex, endIndex);
  
  return {
    puzzles: paginatedPuzzles,
    pagination: {
      currentPage: page,
      totalPages,
      totalResults,
      pageSize,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getPuzzleCount(filters = {}) {
  const puzzles = await loadPuzzles();
  
  let filtered = puzzles;
  
  if (filters.difficulty && filters.difficulty !== 'all') {
    const difficultyRanges = {
      beginner: [0, 1400],
      easy: [1400, 1800],
      medium: [1800, 2200],
      hard: [2200, 2600],
      expert: [2600, 3500],
    };
    const [min, max] = difficultyRanges[filters.difficulty.toLowerCase()] || [0, 3500];
    filtered = filtered.filter(p => p.rating >= min && p.rating <= max);
  }
  
  if (filters.theme && filters.theme !== 'all') {
    filtered = filtered.filter(p => 
      p.themes && p.themes.some(t => t.toLowerCase() === filters.theme.toLowerCase())
    );
  }
  
  return {
    total: filtered.length,
    solved: 0, // TODO: Calculate from userProgress
  };
}

// Mock data for compatibility
export const themes = [
  'fork', 'pin', 'skewer', 'discoveredAttack', 'doubleCheck',
  'mate', 'mateIn2', 'backRankMate', 'hangingPiece', 'trappedPiece',
  'defensiveMove', 'sacrifice', 'endgame', 'middlegame', 'opening'
];

export const difficulties = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];

export const samplePuzzles = []; // Deprecated, will be replaced by fetchPuzzles

export async function getUserStats() {
  const globalStats = await getGlobalStats();
  
  // Calculate accuracy
  const accuracy = globalStats.totalAttempts > 0 
    ? Math.round((globalStats.totalSolves / globalStats.totalAttempts) * 100) 
    : 0;
  
  // Calculate first-try accuracy (will need to track this better)
  const accuracyFirstTry = 0; // TODO: Calculate properly
  
  return {
    solved: globalStats.totalSolves,
    estimatedRating: globalStats.estimatedRating,
    currentStreak: globalStats.currentStreak,
    totalTime: globalStats.totalTimeSpent,
    accuracy,
    accuracyFirstTry,
    hintsUsed: 0, // TODO: Track hints
    solutionsRevealed: 0, // TODO: Track solution reveals
    accuracyByTheme: globalStats.themePerformance,
  };
}
