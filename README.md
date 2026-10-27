# THINK OUTSIDE THE BOX — Brain Puzzle Game (30 Levels)

> *"The answer is beyond what you see."*  
> *A full-stack, interactive brain puzzle game with 30 open-access levels, player registration and game codes, a server-timed session, a live leaderboard, and an administrator portal.*

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

## 🔓 Open Levels & Difficulty Progress

- All 30 enabled puzzles, including Easy, Medium, and Hard, are playable from the start.
- Point thresholds mark the Medium and Hard progression milestones; thresholds are configurable in Admin → Game Settings. They do not lock puzzles.
- Correct answers, hint usage, skips, matchstick equations, and score awards are validated on the server. A puzzle can award points only once per player.
- A single server-timed countdown runs across the game session and does not reset between puzzles.

---

## 👤 Registration & Authentication

- **Registration Page**:
  - Full Name, unique Player ID, optional college/email, password, and confirmation.
  - Registration generates a unique `TECH-12345` game code. Players need their Player ID, password, and game code to sign in.
  - Validation: input requirements, duplicate username/email prevention.
  - Passwords hashed using Node.js `scrypt` with cryptographic salt.
- **Sign-In Page**:
  - Player ID + Password + assigned TECH game code login (admin accounts use their username and password).
  - Forgot Password request workflow.
  - Seamless redirection to the Game Dashboard upon authentication.
- **Force Password Change**:
  - Admin password resets issue a single-use, one-hour reset code. Only password hashes are stored; passwords are never returned by account-management APIs.

---

## 📊 User Dashboard & Gameplay

- **Dashboard**:
  - Personalized welcome banner with player username.
  - Total points, completed puzzles, difficulty milestone progress, TECH game code, and overall progress.
  - 30-level interactive grid with available and completed states.
  - Category filters: All 30 Levels, Easy (1–10), Medium (11–20), Hard (21–30).
  - Direct "Continue Game" button opening the next unfinished puzzle.
- **Gameplay Arena**:
  - Puzzle title, category badge, global countdown, potential points, and skip action.
  - Question/challenge card with dedicated answer input field and submit button.
  - Server-recorded progressive hints and configurable penalties.
  - Easy, Medium, and Hard interactive matchstick equation variants, validated as a one-match mathematical move.
  - A Game Over results view when the global timer expires.
  - Instant server-validated feedback: congratulations on correct answers or encouragement to rethink on retries.

---

## 🏆 Scoreboard & Tournament Leaderboard

- Dedicated scoreboard page showing global player rankings.
- Primary sorting by total points, then correct answers, then earliest completion time.
- Podium cards with gold, silver, and bronze badges for the top 3 players.
- Highlights the currently logged-in player's rank and completion percentage.

---

## ⚙️ Administrator Portal

Accessible by users with the `admin` role:

1. **Overview Dashboard**:
   - Total registered players, total completed levels, highest tournament score, active player count, and puzzle distribution.
2. **User Management**:
   - Real-time search by username, name, or email.
   - Search by Player ID, game code, name, college, or email; view registration date, scores, completed levels, assigned code, time remaining, and game history.
   - Activate / deactivate accounts.
   - Reset forgotten passwords by issuing a one-time reset code; existing passwords are never viewable.
   - Reset individual player progress.
3. **Puzzle Management**:
   - Inspect all 30 puzzles, categories, questions, hints, points, and status.
   - Toggle puzzle enable/disable status.
4. **Independent Category Shuffling**:
   - Shuffle Easy (1–10), Medium (11–20), or Hard (21–30) puzzles independently.
   - Preserves sequential level progression without breaking answer associations.
5. **Game Rules & Protocols**:
   - Configure the global game duration, Medium/Hard point thresholds, skip penalty/availability, and hint availability/penalty.
   - Update player-facing announcements.
6. **Admin Scoreboard & Game Reset**:
   - Complete tournament table.
   - Global game reset requiring explicit confirmation (`RESET_ALL_CONFIRMED`).

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18 or higher)

### Setup & Launch
1. Open PowerShell in the `think-box` project directory:
   ```bash
   cd "C:\Users\ELCOT\Documents\game project\think-box"
   ```
2. Install dependencies if needed (use `npm.cmd` in PowerShell if script execution is restricted):
   ```bash
   npm.cmd install
   ```
3. Start the HTTP application and API server:
   ```bash
   npm.cmd run dev
   ```
4. Open your browser and navigate to:
   **[http://127.0.0.1:3000/](http://127.0.0.1:3000/)**

### Default Administrator Credentials
- **Username**: `admin`
- **Password**: `Admin@123`

---

## 🧪 Automated Test Verification

Keep the server running in one terminal, then run in another:
```bash
npm.cmd test
```
The test command covers registration/game codes, authentication, open level access, progression scoring, matchstick validation, skip behavior, server-side timer expiry, leaderboard updates, existing milestones, and puzzle modules.
