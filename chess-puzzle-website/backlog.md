# Chess Puzzles - Backlog

## Done
- [x] Strip app to single-page minimal puzzle trainer
- [x] Fix puzzle flow: auto-play opponent setup move, user solves from move 1
- [x] Fix board orientation (solver sees from their perspective)
- [x] localStorage tracking: appearances, attempts, solves per puzzle
- [x] Least-appearance rotation algorithm (all 4000 puzzles cycle before repeating)
- [x] Minimal dark UI, no fluff pages
- [x] Per-puzzle stats display (seen/attempted/solved)
- [x] Global stats in header (seen/total, solves/attempts, solve rate)
- [x] Keyboard shortcuts (R retry, N next, H hint)
- [x] Review mode with arrow keys
- [x] Board theme selector
- [x] Move history display
- [x] Timer per puzzle
- [x] Click-to-move and drag-to-move

---

## 🚀 SPRINT 1: Foundation & Critical UX Fixes (Week 1) ✅ COMPLETE
**Goal:** Set up IndexedDB, hide theme spoilers, basic adaptive difficulty

### P1 - Data Layer Migration
- [x] Install dependencies (idb, date-fns, react-swipeable, recharts)
- [x] Create indexedDBService.js with schema setup
- [x] Create migration utility to convert localStorage → IndexedDB
- [x] Test migration with existing user data
- [x] Add data export/import functionality (backup safety)

### P1 - Hide Themes Until Solved
- [x] Modify PuzzleSolver.js: hide themes array until solved
- [x] Show "🎯 Find the best move" instead of theme names
- [x] Reveal themes in success feedback
- [x] Add "Theme" button (optional super hint to reveal themes early)

### P1 - Basic Adaptive Difficulty
- [x] Create difficultyService.js logic in puzzleService.js (inline implementation)
- [x] Implement rating adjustment logic (+10/-8 based on performance)
- [x] Modify puzzleService.js getNextPuzzle() to filter by user rating ±200
- [x] Store user rating in IndexedDB globalStats
- [x] Display estimated rating in header stats (⭐ rating)

### P2 - Session Tracking Foundation
- [x] Create SessionTracker component (sticky header)
- [x] Track puzzles attempted/solved per session in IndexedDB
- [x] Display session stats: time, accuracy, count
- [x] Add "End Session" button with summary modal
- [x] Store session history infrastructure in IndexedDB

---

## 🎯 SPRINT 2: Post-Solve Analysis & Better Feedback (Week 2) ✅ COMPLETE
**Goal:** Transform grinding into learning with analysis and smart feedback
**Note:** Changed to compact popup design instead of full-screen modal (user preference)

### P1 - Post-Solve Analysis Screen
- [x] Create PostSolveAnalysis component (redesigned as compact popup)
- [x] Design popup UI (bottom-right corner, easy to dismiss)
- [x] Show result badge (Solved/Skipped with icon)
- [x] Display puzzle info (rating, time, themes)
- [x] Show tactical theme explanation (template-based)
- [x] Add "Retry" and "Next" buttons
- [x] Integrate into PuzzleSolver flow after solve/skip
- [x] Add solution playback on board (auto-plays moves when skipped)
- [x] Dismiss with X or any keypress

### P1 - Enhanced Wrong Move Feedback
- [x] Create errorDetectionService.js
- [x] Implement hung piece detection
- [x] Implement missed mate detection
- [x] Implement missed check detection
- [x] Generate contextual error messages
- [x] Update PuzzleSolver onDrop to use enhanced feedback
- [x] Track error types in userProgress.errorPatterns (infrastructure ready)

### P2 - Theme Explanations Library
- [x] Create theme explanation templates (15+ themes)
- [x] Show theme explanation in PostSolveAnalysis popup
- [x] Link to "Practice This Theme" from analysis screen (Sprint 3)

### P2 - Puzzle Quality Feedback
- [x] Add star rating component (1-5 stars) in PostSolveAnalysis
- [x] Store ratings in userProgress.userRating
- [ ] Add "Report Puzzle" button with categories (optional, can add later)
- [x] Calculate qualityScore per puzzle (infrastructure ready)
- [ ] Filter low-quality puzzles in selection (optional toggle for later)

---

## 🏋️ SPRINT 3: Training Modes & Spaced Repetition (Week 3) ⏳ IN PROGRESS
**Goal:** Enable focused practice with intelligent puzzle scheduling

### P1 - Spaced Repetition System
- [x] Create spacedRepetitionService.js logic (in puzzleService.js)
- [x] Calculate nextReviewDate on puzzle solve/fail
- [x] Store interval data in userProgress
- [x] Modify getNextPuzzle to prioritize due reviews
- [ ] Add visual indicator for "due for review" puzzles
- [x] Test spaced rep with mock data

### P1 - Training Mode Selector
- [x] Create TrainingModeSelector component
- [x] Implement mode switching UI (dropdown)
- [x] Store active mode in app state
- [x] Pass mode config to puzzle selection logic

### P2 - Standard Mode (Enhanced)
- [x] Combine adaptive difficulty + spaced repetition
- [x] Weighted selection (60% in-range, 30% challenge, 10% review)
- [x] Test puzzle distribution

### P2 - Failed Puzzles Mode
- [x] Filter puzzles where attempts > solves
- [x] Sort by last attempt date (recent first)
- [x] Show count in mode selector
- [x] Implement in puzzleService

### P2 - Master This Theme Mode
- [x] Add theme selector to mode config
- [x] Filter puzzles by selected theme
- [ ] Track accuracy within session
- [ ] Show progress toward 80% goal
- [ ] Auto-congratulate on theme mastery

### P2 - Rating Zone Mode
- [x] Add rating range slider (min/max)
- [x] Filter puzzles by rating bounds
- [ ] Show puzzle count in range
- [x] Implement in puzzleService

### P3 - Daily Gauntlet Mode
- [ ] Implement 10-puzzle fixed set selection
- [ ] Lock puzzle order (no skip without penalty)
- [ ] Show gauntlet progress (X/10)
- [ ] End-of-gauntlet summary screen
- [ ] Store best gauntlet scores

---

## 📊 SPRINT 4: Performance Insights & Polish (Week 4) ✅ COMPLETE
**Goal:** Make stats drive improvement decisions + Perfect core experience

### P1 - Performance Insights Dashboard
- [x] Create PerformanceInsights component
- [x] Calculate themePerformance stats on each completion
- [x] Store in globalStats.themePerformance
- [x] Theme performance list with accuracy bars
- [x] Add to main app (toggle with 'i' button in header)
- [x] Weak theme identification (auto-highlight)

### P1 - Rating Insights
- [x] Track ratingPerformance in globalStats
- [x] Display current rating and progress
- [x] Highlight rating zones to focus on

### P2 - Session History View
- [x] Display recent sessions (last 5) in insights
- [x] Show: date, puzzles solved, accuracy, time
- [x] Session performance tracking

### P2 - Actionable Insights
- [x] Auto-generate insights (focus areas, progress, streaks)
- [x] Highlight weakest themes with accuracy
- [x] Show rating progress from baseline
- [x] Display session accuracy trends

### Polish & Optimization
- [x] Enhanced keyboard shortcuts (Space=next, ?=hint, T=theme)
- [x] Smoother button animations (subtle hover/press)
- [x] Larger mobile touch targets (56px min-height)
- [x] Fade-in animations for feedback messages
- [x] Improved button shadows (softer depth)
- [x] Better mobile responsiveness
- [x] Touch-action optimization for mobile board
- [x] Performance tuning for smooth interactions

---

## 📊 SPRINT 4 (Performance Insights) tracking
- [ ] Theme performance chart (basic list done, could add radar chart)
- [ ] Rating distribution graph (basic done, could add visual chart)
- [ ] Error pattern analysis (infrastructure ready, need UI)
- [ ] Session history timeline (basic list done, could add timeline viz)

---

## 📊 SPRINT 4: Actionable Stats & Insights (Week 4)
**Goal:** Make stats drive improvement decisions

### P1 - Theme Performance Tracking
- [ ] Calculate themePerformance stats on each puzzle completion
- [ ] Store in globalStats.themePerformance
- [ ] Create ThemePerformanceChart component (radar chart)
- [ ] Add to Dashboard page
- [ ] Link weak themes to "Train This Theme" mode

### P1 - Performance Insights Widget
- [ ] Create PerformanceInsights component
- [ ] Implement insight generation logic (weakest theme, trend, etc.)
- [ ] Show top 3 actionable insights on Dashboard
- [ ] Add quick action buttons (Practice X, Review Y)
- [ ] Update insights after each session

### P2 - Rating Distribution Chart
- [ ] Track ratingPerformance in globalStats
- [ ] Create bar chart showing accuracy by rating bucket
- [ ] Highlight user's current rating zone
- [ ] Add to Dashboard

### P2 - Error Pattern Dashboard
- [ ] Create ErrorPatternAnalysis component
- [ ] Aggregate error types from userProgress data
- [ ] Show top 5 error patterns with counts
- [ ] Link to filtered puzzle view (puzzles where this error occurred)
- [ ] Add to Dashboard

### P2 - Session History View
- [ ] Display recent sessions (last 10) on Dashboard
- [ ] Show: date, puzzles solved, accuracy, time
- [ ] Click session → detailed breakdown
- [ ] Trend graph (accuracy over time)

### P3 - Enhanced Dashboard Redesign
- [ ] Reorganize Dashboard with new components
- [ ] Prioritize actionable insights at top
- [ ] Add quick training mode launchers
- [ ] Improve visual hierarchy

---

## 🎮 SPRINT 5: Gamification & Engagement (Week 5) ✅ COMPLETE
**Goal:** Build habit loops with achievements and streaks

### P1 - Daily Streak System
- [x] Track lastPlayDate in globalStats
- [x] Calculate currentStreak and longestStreak
- [x] Increment streak on daily goal completion
- [x] Break streak on missed days
- [x] Create StreakCalendar component (30-day visual)
- [x] Add to PerformanceInsights dashboard

### P1 - Daily Goals
- [x] Set daily goal (default: 10 puzzles) - already implemented in SessionTracker
- [x] Allow user to customize goal - already implemented in SessionTracker
- [x] Track progress in SessionTracker
- [x] Show progress in SessionTracker
- [x] Celebrate goal completion with animation

### P2 - Achievement System
- [x] Create achievementService.js
- [x] Define achievement list (milestone, theme, streak, speed, accuracy)
- [x] Store in IndexedDB achievements table
- [x] Check for unlocks after each puzzle
- [x] Create AchievementNotification component (toast)
- [x] Add achievements display to PerformanceInsights dashboard

### P2 - Quick Filters on Main Screen
- [ ] Create QuickFilters component
- [ ] Add filter bar below header (theme, rating, status)
- [ ] Apply filters to puzzle selection in real-time
- [ ] Persist filter state across sessions
- [ ] Integrate with TrainingModeSelector

### P3 - Time Stats Integration
- [ ] Calculate average solve time per puzzle
- [ ] Show user's time vs puzzle average in PostSolveAnalysis
- [ ] Track avgSolveTime in userProgress
- [ ] Add "time saved" achievement (faster than average)

---

## 📱 SPRINT 6: Mobile Optimization (Week 6)
**Goal:** Make mobile grinding experience smooth

### P1 - Swipe Gestures
- [ ] Install and configure react-swipeable
- [ ] Implement swipe left (skip) on PuzzleSolver
- [ ] Implement swipe right (hint)
- [ ] Implement swipe up (analysis after solve)
- [ ] Add visual swipe indicators
- [ ] Test on mobile devices

### P2 - Touch-Friendly UI
- [ ] Increase button heights to 52px minimum
- [ ] Optimize board size for mobile (full width)
- [ ] Move actions to bottom bar (thumb zone)
- [ ] Simplify mobile layout (hide secondary stats)
- [ ] Test tap targets with accessibility tools

### P2 - Double-Tap Hint
- [ ] Detect double-tap on piece
- [ ] Show hint for that specific piece
- [ ] Visual feedback on double-tap

### P3 - Portrait Layout Optimization
- [ ] Stack components vertically on narrow screens
- [ ] Adjust typography for readability
- [ ] Test on various screen sizes (phone, tablet)

---

## 📚 SPRINT 7: Collections & Bookmarks (Week 7)
**Goal:** Enable custom practice sets

### P2 - Bookmark System
- [ ] Add bookmark toggle button to PuzzleSolver
- [ ] Store bookmarked status in userProgress
- [ ] Create "Bookmarks" virtual collection
- [ ] Add bookmark filter to puzzle browser
- [ ] Show bookmark count in Dashboard

### P2 - Collections Feature
- [ ] Create CollectionManager component
- [ ] Allow creating custom collections
- [ ] Add puzzles to collections from PostSolveAnalysis
- [ ] Collections browser page
- [ ] Train from specific collection mode

### P3 - Share Collection
- [ ] Export collection as JSON
- [ ] Copy shareable link (with puzzle IDs)
- [ ] Import collection from JSON

---

## 🔧 SPRINT 8: Polish & Quality of Life (Week 8)
**Goal:** Refinement and edge case handling

### P2 - Settings Page
- [ ] Daily goal customization
- [ ] Auto-advance to next puzzle (on/off)
- [ ] Sound effects toggle
- [ ] Vibration toggle
- [ ] Theme preferences
- [ ] Data management (export, clear, import)

### P2 - Stockfish Integration (Optional)
- [ ] Research: stockfish.js vs pre-computed evals
- [ ] If feasible: Integrate Stockfish for analysis
- [ ] Generate deeper move explanations
- [ ] Show evaluation bars

### P3 - Improved Puzzle Browser
- [ ] Add more filter options (bookmarked, due for review, failed)
- [ ] Sort options (rating, last attempted, quality score)
- [ ] Search by puzzle ID
- [ ] Preview puzzle on hover

### P3 - Keyboard Shortcuts Enhancement
- [ ] Add shortcuts list modal (press ?)
- [ ] Add more shortcuts (B for bookmark, T for theme reveal)
- [ ] Visual keyboard shortcut hints

### P3 - Accessibility Improvements
- [ ] ARIA labels for all interactive elements
- [ ] Keyboard navigation throughout app
- [ ] Screen reader announcements for puzzle feedback
- [ ] High contrast mode option

---

## 🚀 FUTURE / NICE TO HAVE
- [ ] Blitz Mode (30 seconds per puzzle)
- [ ] Leaderboards (local, privacy-friendly)
- [ ] Battle mode (vs friend on same puzzle)
- [ ] Puzzle of the day
- [ ] Import more puzzle databases
- [ ] User-generated puzzles
- [ ] Social features (with backend)
- [ ] Multi-device sync (requires backend)
- [ ] Progressive Web App (offline support)
- [ ] Puzzle difficulty prediction improvements

---

## 🐛 BUG FIXES / TECH DEBT
- [ ] Verify promotion handling for underpromotions
- [ ] Test edge cases in spaced repetition
- [ ] Performance testing with 4000+ puzzles in IndexedDB
- [ ] Bundle size optimization
- [ ] Code splitting for better initial load

---

## SPRINT SUMMARY

**Week 1:** Foundation (IndexedDB, hide themes, basic adaptive)
**Week 2:** Learning (post-solve analysis, better feedback)
**Week 3:** Training modes (spaced rep, failed puzzles, theme practice)
**Week 4:** Stats (actionable insights, charts, error analysis)
**Week 5:** Gamification (streaks, achievements, goals)
**Week 6:** Mobile (swipes, touch targets)
**Week 7:** Collections (bookmarks, custom sets)
**Week 8:** Polish (settings, accessibility, improvements)

**Estimated Total:** 8 weeks of focused development for core features
