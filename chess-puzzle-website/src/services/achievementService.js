import { getGlobalStats, updateGlobalStats, getAllAchievements, updateAchievement } from './indexedDBService';

const ACHIEVEMENTS = [
  // Milestone Achievements
  { id: 'first_solve', name: 'First Step', description: 'Solve your first puzzle', target: 1, type: 'milestone' },
  { id: 'rookie', name: 'Rookie', description: 'Solve 10 puzzles', target: 10, type: 'milestone' },
  { id: 'apprentice', name: 'Apprentice', description: 'Solve 50 puzzles', target: 50, type: 'milestone' },
  { id: 'tactician', name: 'Tactician', description: 'Solve 100 puzzles', target: 100, type: 'milestone' },
  { id: 'master', name: 'Master', description: 'Solve 500 puzzles', target: 500, type: 'milestone' },
  { id: 'grandmaster', name: 'Grandmaster', description: 'Solve 1000 puzzles', target: 1000, type: 'milestone' },
  
  // Streak Achievements
  { id: 'streak_3', name: 'Consistency', description: '3 day streak', target: 3, type: 'streak' },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day streak', target: 7, type: 'streak' },
  { id: 'streak_30', name: 'Month Master', description: '30 day streak', target: 30, type: 'streak' },
  
  // Accuracy Achievements
  { id: 'perfect_session', name: 'Flawless', description: '10 puzzles without error', target: 10, type: 'accuracy' },
  { id: 'sharpshooter', name: 'Sharpshooter', description: '90% accuracy over 50 puzzles', target: 50, type: 'accuracy' },
  
  // Speed Achievements
  { id: 'quick_solve', name: 'Quick Thinker', description: 'Solve in under 30 seconds', target: 1, type: 'speed' },
  { id: 'speed_demon', name: 'Speed Demon', description: '10 puzzles under 1 minute each', target: 10, type: 'speed' },
  
  // Theme Mastery
  { id: 'fork_master', name: 'Fork Master', description: 'Solve 25 fork puzzles', target: 25, type: 'theme', theme: 'fork' },
  { id: 'pin_specialist', name: 'Pin Specialist', description: 'Solve 25 pin puzzles', target: 25, type: 'theme', theme: 'pin' },
  { id: 'mate_hunter', name: 'Mate Hunter', description: 'Solve 25 checkmate puzzles', target: 25, type: 'theme', theme: 'mate' },
];

export async function initializeAchievements() {
  const existingAchievements = await getAllAchievements();
  
  if (existingAchievements.length === 0) {
    // Initialize all achievements as locked
    const db = await import('./indexedDBService').then(m => m.initDB());
    const tx = db.transaction('achievements', 'readwrite');
    
    await Promise.all([
      ...ACHIEVEMENTS.map(achievement => 
        tx.store.put({
          ...achievement,
          unlocked: false,
          unlockedDate: null,
          progress: 0
        })
      ),
      tx.done
    ]);
  }
}

export async function checkAchievements(stats, puzzleData = null) {
  const achievements = await getAllAchievements();
  const unlockedNow = [];
  
  for (const achievement of achievements) {
    if (achievement.unlocked) continue; // Skip already unlocked
    
    let progress = 0;
    let shouldUnlock = false;
    
    switch (achievement.type) {
      case 'milestone':
        progress = stats.totalSolves;
        shouldUnlock = progress >= achievement.target;
        break;
        
      case 'streak':
        progress = stats.currentStreak;
        shouldUnlock = progress >= achievement.target;
        break;
        
      case 'accuracy':
        if (achievement.id === 'perfect_session') {
          // Check session history for perfect session
          const recentSession = stats.sessionHistory?.[stats.sessionHistory.length - 1];
          if (recentSession && recentSession.puzzlesSolved >= 10 && recentSession.accuracy === 100) {
            shouldUnlock = true;
            progress = achievement.target;
          }
        } else if (achievement.id === 'sharpshooter') {
          const recentPuzzles = Math.min(stats.totalAttempts, 50);
          if (recentPuzzles >= 50) {
            const accuracy = (stats.totalSolves / stats.totalAttempts) * 100;
            if (accuracy >= 90) {
              shouldUnlock = true;
            }
            progress = recentPuzzles;
          }
        }
        break;
        
      case 'speed':
        if (puzzleData && puzzleData.timeSpent) {
          if (achievement.id === 'quick_solve' && puzzleData.timeSpent < 30) {
            shouldUnlock = true;
            progress = achievement.target;
          }
        }
        break;
        
      case 'theme':
        if (stats.themePerformance && stats.themePerformance[achievement.theme]) {
          progress = stats.themePerformance[achievement.theme].solved;
          shouldUnlock = progress >= achievement.target;
        }
        break;
        
      default:
        break;
    }
    
    if (shouldUnlock) {
      await updateAchievement(achievement.id, {
        unlocked: true,
        unlockedDate: Date.now(),
        progress: achievement.target
      });
      unlockedNow.push(achievement);
    } else if (progress > achievement.progress) {
      // Update progress even if not unlocked
      await updateAchievement(achievement.id, {
        progress: Math.min(progress, achievement.target)
      });
    }
  }
  
  return unlockedNow;
}

export async function updateStreak() {
  const stats = await getGlobalStats();
  const today = new Date().toISOString().split('T')[0];
  const lastPlay = stats.lastPlayDate ? new Date(stats.lastPlayDate).toISOString().split('T')[0] : null;
  
  if (!lastPlay) {
    // First time playing
    await updateGlobalStats({
      ...stats,
      currentStreak: 1,
      longestStreak: 1,
      lastPlayDate: Date.now()
    });
    return;
  }
  
  if (lastPlay === today) {
    // Already played today
    return;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastPlay === yesterdayStr) {
    // Consecutive day
    const newStreak = stats.currentStreak + 1;
    await updateGlobalStats({
      ...stats,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, stats.longestStreak),
      lastPlayDate: Date.now()
    });
  } else {
    // Streak broken
    await updateGlobalStats({
      ...stats,
      currentStreak: 1,
      lastPlayDate: Date.now()
    });
  }
}

export { ACHIEVEMENTS };
