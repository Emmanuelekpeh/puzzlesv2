import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { samplePuzzles } from '../services/puzzleService';

const PuzzleContext = createContext();

const PUZZLE_IDS_KEY = 'shuffledPuzzles';
const PUZZLE_INDEX_KEY = 'puzzleIndex';

function shuffle(array) {
  let m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

export function PuzzleProvider({ children }) {
  const [puzzleIds, setPuzzleIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initialize puzzles from localStorage or fresh
  useEffect(() => {
    let ids = JSON.parse(localStorage.getItem(PUZZLE_IDS_KEY));
    let idx = parseInt(localStorage.getItem(PUZZLE_INDEX_KEY), 10) || 0;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      // Get all puzzle IDs from samplePuzzles
      ids = shuffle(samplePuzzles.map(p => p.id));
      idx = 0;
      localStorage.setItem(PUZZLE_IDS_KEY, JSON.stringify(ids));
      localStorage.setItem(PUZZLE_INDEX_KEY, idx);
    }
    setPuzzleIds(ids);
    setCurrentIndex(idx);
    setLoading(false);
  }, []);

  // Move to next puzzle
  const nextPuzzle = useCallback(async () => {
    let idx = currentIndex + 1;
    if (idx >= puzzleIds.length) {
      // All puzzles played, refresh (simulate backend refresh here)
      // In real app, call backend to refresh and get new IDs
      const ids = shuffle(samplePuzzles.map(p => p.id));
      idx = 0;
      localStorage.setItem(PUZZLE_IDS_KEY, JSON.stringify(ids));
      localStorage.setItem(PUZZLE_INDEX_KEY, idx);
      setPuzzleIds(ids);
      setCurrentIndex(idx);
    } else {
      setCurrentIndex(idx);
      localStorage.setItem(PUZZLE_INDEX_KEY, idx);
    }
  }, [currentIndex, puzzleIds]);

  // Optionally, expose a manual refresh method
  const refreshPuzzles = useCallback(() => {
    const ids = shuffle(samplePuzzles.map(p => p.id));
    localStorage.setItem(PUZZLE_IDS_KEY, JSON.stringify(ids));
    localStorage.setItem(PUZZLE_INDEX_KEY, 0);
    setPuzzleIds(ids);
    setCurrentIndex(0);
  }, []);

  const currentPuzzleId = puzzleIds[currentIndex];

  return (
    <PuzzleContext.Provider value={{
      currentPuzzleId,
      currentIndex,
      total: puzzleIds.length,
      nextPuzzle,
      refreshPuzzles,
      loading
    }}>
      {children}
    </PuzzleContext.Provider>
  );
}

export function usePuzzle() {
  return useContext(PuzzleContext);
} 