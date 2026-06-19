import { openDB } from 'idb';

const DB_NAME = 'ChessPuzzlesDB';
const DB_VERSION = 2; // Incremented for opening training tables

let dbInstance = null;

export async function initDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Store 1: puzzles (base puzzle data)
      if (!db.objectStoreNames.contains('puzzles')) {
        const puzzleStore = db.createObjectStore('puzzles', { keyPath: 'id' });
        puzzleStore.createIndex('rating', 'rating');
        puzzleStore.createIndex('qualityScore', 'qualityScore');
      }

      // Store 2: userProgress (per-puzzle tracking)
      if (!db.objectStoreNames.contains('userProgress')) {
        const progressStore = db.createObjectStore('userProgress', { keyPath: 'puzzleId' });
        progressStore.createIndex('nextReviewDate', 'nextReviewDate');
        progressStore.createIndex('bookmarked', 'bookmarked');
        progressStore.createIndex('lastAttemptDate', 'lastAttemptDate');
      }

      // Store 3: globalStats (aggregated performance)
      if (!db.objectStoreNames.contains('globalStats')) {
        db.createObjectStore('globalStats', { keyPath: 'id' });
      }

      // Store 4: collections (user-created puzzle sets)
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'id' });
      }

      // Store 5: achievements (definitions + unlocked status)
      if (!db.objectStoreNames.contains('achievements')) {
        db.createObjectStore('achievements', { keyPath: 'id' });
      }

      // Store 6: sessions (active training session)
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }

      // Store 7: openingProgress (per-opening-line tracking)
      if (!db.objectStoreNames.contains('openingProgress')) {
        const openingProgressStore = db.createObjectStore('openingProgress', { keyPath: 'lineId' });
        openingProgressStore.createIndex('eco', 'eco');
        openingProgressStore.createIndex('color', 'color');
        openingProgressStore.createIndex('masteryLevel', 'masteryLevel');
        openingProgressStore.createIndex('lastPracticedDate', 'lastPracticedDate');
      }

      // Store 8: openingRepertoire (user's saved repertoire)
      if (!db.objectStoreNames.contains('openingRepertoire')) {
        const repertoireStore = db.createObjectStore('openingRepertoire', { keyPath: 'id' });
        repertoireStore.createIndex('color', 'color');
        repertoireStore.createIndex('name', 'name');
      }

      // Store 9: openingCache (cached Lichess API responses)
      if (!db.objectStoreNames.contains('openingCache')) {
        const cacheStore = db.createObjectStore('openingCache', { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

export async function getPuzzle(id) {
  const db = await initDB();
  return db.get('puzzles', id);
}

export async function getAllPuzzles() {
  const db = await initDB();
  return db.getAll('puzzles');
}

export async function addPuzzle(puzzle) {
  const db = await initDB();
  return db.put('puzzles', puzzle);
}

export async function addPuzzles(puzzles) {
  const db = await initDB();
  const tx = db.transaction('puzzles', 'readwrite');
  await Promise.all([
    ...puzzles.map(p => tx.store.put(p)),
    tx.done,
  ]);
}

export async function getUserProgress(puzzleId) {
  const db = await initDB();
  const progress = await db.get('userProgress', puzzleId);
  
  if (!progress) {
    return {
      puzzleId,
      appearances: 0,
      attempts: 0,
      solves: 0,
      firstTrySuccesses: 0,
      avgSolveTime: 0,
      lastAttemptDate: null,
      nextReviewDate: null,
      difficultyMultiplier: 1.0,
      errorPatterns: [],
      bookmarked: false,
      collections: [],
      userRating: null,
      userReport: null,
    };
  }
  
  return progress;
}

export async function updateUserProgress(puzzleId, updates) {
  const db = await initDB();
  const existing = await getUserProgress(puzzleId);
  const updated = { ...existing, ...updates };
  return db.put('userProgress', updated);
}

export async function getGlobalStats() {
  const db = await initDB();
  const stats = await db.get('globalStats', 'current');
  
  if (!stats) {
    return {
      id: 'current',
      totalPuzzlesSeen: 0,
      totalAttempts: 0,
      totalSolves: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayDate: null,
      estimatedRating: 1500,
      themePerformance: {},
      ratingPerformance: {},
      achievements: [],
      dailyGoals: {
        date: null,
        target: 10,
        completed: 0,
      },
      sessionHistory: [],
    };
  }
  
  return stats;
}

export async function updateGlobalStats(updates) {
  const db = await initDB();
  const existing = await getGlobalStats();
  const updated = { ...existing, ...updates };
  return db.put('globalStats', updated);
}

export async function getCollection(id) {
  const db = await initDB();
  return db.get('collections', id);
}

export async function getAllCollections() {
  const db = await initDB();
  return db.getAll('collections');
}

export async function addCollection(collection) {
  const db = await initDB();
  return db.put('collections', collection);
}

export async function deleteCollection(id) {
  const db = await initDB();
  return db.delete('collections', id);
}

export async function getAchievement(id) {
  const db = await initDB();
  return db.get('achievements', id);
}

export async function getAllAchievements() {
  const db = await initDB();
  return db.getAll('achievements');
}

export async function updateAchievement(id, updates) {
  const db = await initDB();
  const existing = await db.get('achievements', id);
  const updated = { ...existing, ...updates };
  return db.put('achievements', updated);
}

export async function getActiveSession() {
  const db = await initDB();
  const session = await db.get('sessions', 'active');
  
  if (!session) {
    return null;
  }
  
  return session;
}

export async function updateSession(session) {
  const db = await initDB();
  return db.put('sessions', { id: 'active', ...session });
}

export async function clearSession() {
  const db = await initDB();
  return db.delete('sessions', 'active');
}

// Utility: Get puzzles due for review (spaced repetition)
export async function getPuzzlesDueForReview() {
  const db = await initDB();
  const now = Date.now();
  const index = db.transaction('userProgress').store.index('nextReviewDate');
  const allProgress = await index.getAll();
  
  return allProgress.filter(p => p.nextReviewDate && p.nextReviewDate <= now);
}

// Utility: Get failed puzzles (attempts > solves)
export async function getFailedPuzzles() {
  const db = await initDB();
  const allProgress = await db.getAll('userProgress');
  
  return allProgress.filter(p => p.attempts > 0 && p.attempts > p.solves);
}

// Utility: Export all data (backup)
export async function exportAllData() {
  const db = await initDB();
  
  const data = {
    version: DB_VERSION,
    exportDate: new Date().toISOString(),
    puzzles: await db.getAll('puzzles'),
    userProgress: await db.getAll('userProgress'),
    globalStats: await getGlobalStats(),
    collections: await db.getAll('collections'),
    achievements: await db.getAll('achievements'),
  };
  
  return data;
}

// Utility: Import data (restore from backup)
export async function importAllData(data) {
  const db = await initDB();
  
  if (data.puzzles) {
    await addPuzzles(data.puzzles);
  }
  
  if (data.userProgress) {
    const tx = db.transaction('userProgress', 'readwrite');
    await Promise.all([
      ...data.userProgress.map(p => tx.store.put(p)),
      tx.done,
    ]);
  }
  
  if (data.globalStats) {
    await db.put('globalStats', data.globalStats);
  }
  
  if (data.collections) {
    const tx = db.transaction('collections', 'readwrite');
    await Promise.all([
      ...data.collections.map(c => tx.store.put(c)),
      tx.done,
    ]);
  }
  
  if (data.achievements) {
    const tx = db.transaction('achievements', 'readwrite');
    await Promise.all([
      ...data.achievements.map(a => tx.store.put(a)),
      tx.done,
    ]);
  }
}

// Utility: Clear all data
export async function clearAllData() {
  const db = await initDB();
  
  await db.clear('puzzles');
  await db.clear('userProgress');
  await db.clear('globalStats');
  await db.clear('collections');
  await db.clear('achievements');
  await db.clear('sessions');
  await db.clear('openingProgress');
  await db.clear('openingRepertoire');
  await db.clear('openingCache');
}

// ============ OPENING TRAINING FUNCTIONS ============

/**
 * Get opening line progress
 */
export async function getOpeningProgress(lineId) {
  const db = await initDB();
  const progress = await db.get('openingProgress', lineId);
  
  if (!progress) {
    return {
      lineId,
      eco: '',
      name: '',
      color: 'white',
      attempts: 0,
      correctMoves: 0,
      incorrectMoves: 0,
      accuracy: 0,
      masteryLevel: 0, // 0-100
      lastPracticedDate: null,
      moveAccuracy: {}, // { moveIndex: accuracy }
      weakMoves: [] // Array of move indices with < 70% accuracy
    };
  }
  
  return progress;
}

/**
 * Update opening line progress
 */
export async function updateOpeningProgress(lineId, updates) {
  const db = await initDB();
  const current = await getOpeningProgress(lineId);
  
  const updated = {
    ...current,
    ...updates,
    lastPracticedDate: Date.now()
  };
  
  // Recalculate accuracy
  if (updated.attempts > 0) {
    updated.accuracy = ((updated.correctMoves / updated.attempts) * 100).toFixed(1);
  }
  
  // Calculate mastery level (0-100)
  // Based on accuracy and number of successful attempts
  const accuracyScore = parseFloat(updated.accuracy) || 0;
  const volumeScore = Math.min(updated.correctMoves * 2, 40); // Max 40 points for volume
  updated.masteryLevel = Math.min(Math.round((accuracyScore * 0.6) + volumeScore), 100);
  
  await db.put('openingProgress', updated);
  return updated;
}

/**
 * Get all opening progress, optionally filtered by color
 */
export async function getAllOpeningProgress(color = null) {
  const db = await initDB();
  const allProgress = await db.getAll('openingProgress');
  
  if (color) {
    return allProgress.filter(p => p.color === color);
  }
  
  return allProgress;
}

/**
 * Add opening to repertoire
 */
export async function addToRepertoire(opening) {
  const db = await initDB();
  const id = opening.id || `${opening.eco}_${opening.color}_${Date.now()}`;
  
  const repertoireItem = {
    id,
    name: opening.name,
    eco: opening.eco,
    color: opening.color,
    moves: opening.moves || [],
    variations: opening.variations || [],
    addedDate: Date.now(),
    notes: opening.notes || '',
    priority: opening.priority || 'medium' // low, medium, high
  };
  
  await db.put('openingRepertoire', repertoireItem);
  return repertoireItem;
}

/**
 * Get user's repertoire
 */
export async function getRepertoire(color = null) {
  const db = await initDB();
  const repertoire = await db.getAll('openingRepertoire');
  
  if (color) {
    return repertoire.filter(item => item.color === color);
  }
  
  return repertoire;
}

/**
 * Remove from repertoire
 */
export async function removeFromRepertoire(id) {
  const db = await initDB();
  await db.delete('openingRepertoire', id);
}

/**
 * Cache opening data from API
 */
export async function cacheOpeningData(key, data, ttl = 86400000) { // 24 hours default
  const db = await initDB();
  
  await db.put('openingCache', {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl
  });
}

/**
 * Get cached opening data
 */
export async function getCachedOpeningData(key) {
  const db = await initDB();
  const cached = await db.get('openingCache', key);
  
  if (!cached) return null;
  
  // Check if expired
  if (cached.expiresAt < Date.now()) {
    await db.delete('openingCache', key);
    return null;
  }
  
  return cached.data;
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache() {
  const db = await initDB();
  const allCached = await db.getAll('openingCache');
  const now = Date.now();
  
  const expired = allCached.filter(item => item.expiresAt < now);
  
  const tx = db.transaction('openingCache', 'readwrite');
  await Promise.all([
    ...expired.map(item => tx.store.delete(item.key)),
    tx.done
  ]);
  
  return expired.length;
}
