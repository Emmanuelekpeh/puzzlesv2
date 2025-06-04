# Project Backlog

## Priority 1: Critical Puzzle Issues

- [ ] **Fix incorrect solution moves**
  - Investigate and correct the logic that determines the solution for each puzzle. Ensure the first move and subsequent moves match the intended solution from the source (e.g., Lichess).
- [ ] **Ensure correct side to move**
  - Audit puzzle import and display logic to guarantee the correct side is to move, as indicated by the FEN and move sequence.
- [ ] **Automated tests for puzzle correctness**
  - Add tests to verify that the solution and side to move are correct for all imported puzzles.

## Priority 2: User Experience

- [ ] **Hide tags/themes until puzzle is solved**
  - Update the UI so that puzzle tags (themes) are only shown after the user solves the puzzle, to avoid spoilers.
- [ ] **Automated tests for tag visibility**
  - Add tests to ensure tags are not visible before solving and are revealed after.

## Priority 3: Quality and Trust

- [ ] **Expand automated test coverage**
  - Increase test coverage for puzzle logic, import, and UI/UX flows.
- [ ] **Add FAQ/About section**
  - Explain the project's unique value and how it differs from Lichess, addressing user questions and skepticism.

---

_Last updated: [date]_ 