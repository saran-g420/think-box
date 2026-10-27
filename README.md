# THINK OUTSIDE THE BOX — Brain Puzzle Game (30 Levels)

> *"The answer is beyond what you see."*  
> *A full-stack, modern, interactive web-based brain puzzle game with 30 progressive levels, strict sequential level unlocking, user authentication, a live tournament scoreboard, and a comprehensive administrator control panel.*

---

## 🎮 Game Levels & Difficulty

The game features exactly **30 levels divided into 3 difficulty categories** (10 levels in each category):

### 🟢 Easy Mode — Levels 1–10
- **Focus**: Logical reasoning, observation riddles, basic number patterns, and lateral thinking warm-ups.
- **Milestone Greeting**: Completing Level 10 triggers:
  > **“Congratulations! You have successfully completed all Easy Levels!”**
- Provides a direct button to continue to Medium Mode.

### 🟡 Medium Mode — Levels 11–20
- **Focus**: Logical deductions, mathematical sequences, word puzzles, binary thinking, and lateral challenges.
- **Milestone Greeting**: Completing Level 20 triggers:
  > **“Amazing! You have successfully completed all Medium Levels!”**
- Provides a direct button to continue to Hard Mode.

### 🔴 Hard Mode — Levels 21–30
- **Focus**: Multi-step logic puzzles, probability paradoxes (Monty Hall, non-uniform burning ropes), knights & knaves, modular clock ciphers, and lateral mysteries.
- **Final Grandmaster Victory**: Completing Level 30 triggers:
  > **“LEGENDARY ACHIEVEMENT! You have completed all 30 levels of Think Outside the Box!”**
- Displays final tournament score, 30/30 completion badge, and a **Play Again** option.

---

## 🔒 Sequential Level Unlocking & Backend Security

- **Strict Gating**: A new player begins at Level 1. Level 2 unlocks only after Level 1 is solved, continuing sequentially through Level 30.
- **Locked State**: Locked levels cannot be played. Attempting to click or fetch a locked level displays:  
  `“Complete the previous level to unlock this level.”`
- **Server-Side Validation**: Level unlocking, answers, and score increments are strictly validated on the backend. Frontend variables or URL tampering cannot bypass locked stages or award illicit points.
- **Per-User Progress**: Each user has an isolated account, level progression, and score stored securely in the database.

---

## 👤 Registration & Authentication

- **Registration Page**:
  - Full Name, Username, Email, Password, Confirm Password.
  - Validation: input requirements, duplicate username/email prevention.
  - Passwords hashed using Node.js `scrypt` with cryptographic salt.
- **Sign-In Page**:
  - Username or Email + Password login.
  - Forgot Password request workflow.
  - Seamless redirection to the Game Dashboard upon authentication.
- **Force Password Change**:
  - If an administrator resets a user's password with a temporary password, the user is required to update it on their next login.

---

## 📊 User Dashboard & Gameplay

- **Dashboard**:
  - Personalized welcome banner with player username.
  - Real-time stats: Total Score, Completed Levels (X/30), Current Unlocked Level, Overall Progress %.
  - 30-level interactive grid with visual indicators: Locked (🔒), Unlocked (▶), and Completed (✓).
  - Category filters: All 30 Levels, Easy (1–10), Medium (11–20), Hard (21–30).
  - Direct "Continue Game" button launching the current highest unlocked level.
- **Gameplay Arena**:
  - Puzzle title, category badge, timer countdown, and potential points.
  - Question/challenge card with dedicated answer input field and submit button.
  - Progressive hints system with point deductions (-15 pts per hint).
  - Instant server-validated feedback: congratulations on correct answers or encouragement to rethink on retries.

---

## 🏆 Scoreboard & Tournament Leaderboard

- Dedicated scoreboard page showing global player rankings.
- Primary sorting by **Total Score** (descending), secondary sorting by **Completed Levels** (descending).
- Podium cards with gold, silver, and bronze badges for the top 3 players.
- Highlights the currently logged-in player's rank and completion percentage.

---

## ⚙️ Administrator Portal

Accessible by users with the `admin` role:

1. **Overview Dashboard**:
   - Total registered players, total completed levels, highest tournament score, active player count, and puzzle distribution.
2. **User Management**:
   - Real-time search by username, name, or email.
   - View registration date, current level, completed levels, and score.
   - Activate / deactivate accounts.
   - Reset forgotten passwords by assigning a temporary password with required change at next login.
   - Reset individual player progress.
3. **Puzzle Management**:
   - Inspect all 30 puzzles, categories, questions, hints, points, and status.
   - Toggle puzzle enable/disable status.
4. **Independent Category Shuffling**:
   - Shuffle Easy (1–10), Medium (11–20), or Hard (21–30) puzzles independently.
   - Preserves sequential level progression without breaking answer associations.
5. **Game Rules & Protocols**:
   - Configure Easy, Medium, and Hard timer durations.
   - Configure hint penalties and scoring rules.
   - Update player-facing announcements.
6. **Admin Scoreboard & Game Reset**:
   - Complete tournament table.
   - Global game reset requiring explicit confirmation (`RESET_ALL_CONFIRMED`).

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18 or higher)

### Setup & Launch
1. Open terminal in the project directory:
   ```bash
   cd "pattern game"
   ```
2. Start the HTTP application and API server:
   ```bash
   node server.js
   ```
3. Open your browser and navigate to:
   **[http://127.0.0.1:3000/](http://127.0.0.1:3000/)**

### Default Administrator Credentials
- **Username**: `admin`
- **Password**: `Admin@123`

---

## 🧪 Automated Test Verification

Run the end-to-end master verification suites:
```bash
# 1. Test 30-Level Master Flow & Sequential Unlocking
node test_master_flow.js

# 2. Test Milestone Greetings (Levels 10, 20, and 30)
node test_milestones.js
```
Both test suites pass 100% of test cases.
