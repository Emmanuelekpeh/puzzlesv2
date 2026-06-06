import lichessPuzzleData from '../data/lichess_puzzles.json';
import { addPuzzles, updateUserProgress, updateGlobalStats, initDB } from './indexedDBService';

const LEGACY_STORAGE_KEY = 'chess_puzzle_tracker';

/**
 * Migrate data from localStorage to IndexedDB
 * This should run once on app initialization
 */
export async function migrateToIndexedDB() {
  try {
    // Initialize DB first
    await initDB();
    
    // Check if migration already done
    const migrationFlag = localStorage.getItem('indexeddb_migrated');
    if (migrationFlag === 'true') {
      console.log('Migration already completed');
      return { success: true, alreadyMigrated: true };
    }
    
    // Step 1: Load all puzzles into IndexedDB
    console.log('Migrating puzzles to IndexedDB...');
    const puzzles = lichessPuzzleData.puzzles
      .filter(p => p.moves && p.moves.length >= 2)
      .map(p => ({
        id: p.id,
        fen: p.fen,
        moves: p.moves,
        rating: p.rating,
        themes: p.themes || [],
        orientation: p.fen.includes(' w ') ? 'black' : 'white',
        popularity: p.popularity || 0,
        qualityScore: 100, // Default quality score
      }));
    
    await addPuzzles(puzzles);
    console.log(`Migrated ${puzzles.length} puzzles`);
    
    // Step 2: Migrate user progress from localStorage
    console.log('Migrating user progress...');
    const rawTracker = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawTracker) {
      const tracker = JSON.parse(rawTracker);
      
      for (const [puzzleId, stats] of Object.entries(tracker)) {
        await updateUserProgress(puzzleId, {
          puzzleId,
          appearances: stats.a || 0,
          attempts: stats.t || 0,
          solves: stats.s || 0,
          firstTrySuccesses: 0, // Can't determine from old data
          avgSolveTime: 0,
          lastAttemptDate: null,
          nextReviewDate: null,
          difficultyMultiplier: 1.0,
          errorPatterns: [],
          bookmarked: false,
          collections: [],
          userRating: null,
          userReport: null,
        });
      }
      
      console.log(`Migrated progress for ${Object.keys(tracker).length} puzzles`);
    }
    
    // Step 3: Calculate and store global stats
    console.log('Calculating global stats...');
    const globalStats = calculateGlobalStats(rawTracker ? JSON.parse(rawTracker) : {});
    await updateGlobalStats(globalStats);
    console.log('Global stats migrated');
    
    // Step 4: Mark migration as complete
    localStorage.setItem('indexeddb_migrated', 'true');
    
    console.log('✅ Migration completed successfully');
    return { success: true, puzzlesCount: puzzles.length };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
}

function calculateGlobalStats(tracker) {
  let totalAppearances = 0;
  let totalAttempts = 0;
  let totalSolves = 0;
  let puzzlesSeen = 0;
  
  for (const id of Object.keys(tracker)) {
    const s = tracker[id];
    totalAppearances += s.a || 0;
    totalAttempts += s.t || 0;
    totalSolves += s.s || 0;
    if (s.a > 0) puzzlesSeen++;
  }
  
  return {
    id: 'current',
    totalPuzzlesSeen: puzzlesSeen,
    totalAttempts,
    totalSolves,
    totalTimeSpent: 0, // Can't determine from old data
    currentStreak: 0,
    longestStreak: 0,
    lastPlayDate: Date.now(),
    estimatedRating: 1500, // Default starting rating
    themePerformance: {},
    ratingPerformance: {},
    achievements: [],
    dailyGoals: {
      date: new Date().toISOString().split('T')[0],
      target: 10,
      completed: 0,
    },
    sessionHistory: [],
  };
}

/**
 * Check if migration is needed
 */
export function needsMigration() {
  const migrationFlag = localStorage.getItem('indexeddb_migrated');
  return migrationFlag !== 'true';
}

/**
 * Reset migration flag (for testing)
 */
export function resetMigrationFlag() {
  localStorage.removeItem('indexeddb_migrated');
}
