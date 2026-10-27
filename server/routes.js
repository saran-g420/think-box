import crypto from 'node:crypto';
import { db, hashPassword, verifyPassword } from './db.js';

// Helper to parse JSON request body
export async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// JSON response helper
export function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Extract authenticated user from request header
export function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const session = db.getSession(token);
  if (!session) return null;
  const user = db.getUserById(session.userId);
  if (!user || user.status === 'inactive') return null;
  return user;
}

// Normalize strings for answer comparison
function normalizeAnswer(str) {
  if (typeof str !== 'string' && typeof str !== 'number') return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Main API Router
export async function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // =========================================================================
  // AUTHENTICATION ROUTES
  // =========================================================================

  // POST /api/auth/register
  if (method === 'POST' && pathname === '/api/auth/register') {
    const body = await parseBody(req);
    const { fullName, username, email, password, confirmPassword } = body;

    if (!fullName || !username || !email || !password) {
      return sendJson(res, 400, { error: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
      return sendJson(res, 400, { error: 'Passwords do not match.' });
    }
    if (password.length < 6) {
      return sendJson(res, 400, { error: 'Password must be at least 6 characters long.' });
    }
    if (db.getUserByUsername(username)) {
      return sendJson(res, 400, { error: 'Username is already taken.' });
    }
    if (db.getUserByEmail(email)) {
      return sendJson(res, 400, { error: 'Email address is already registered.' });
    }

    const newUser = {
      id: crypto.randomUUID(),
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      role: 'user',
      status: 'active',
      unlockedLevel: 1, // Strict sequential unlocking: starts at Level 1
      totalScore: 0,
      completedLevels: [],
      levelScores: {},
      createdAt: new Date().toISOString(),
      mustChangePassword: false
    };

    db.addUser(newUser);
    const token = db.createSession(newUser.id, newUser.role);

    return sendJson(res, 201, {
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        unlockedLevel: newUser.unlockedLevel,
        totalScore: newUser.totalScore,
        completedLevels: newUser.completedLevels
      }
    });
  }

  // POST /api/auth/login
  if (method === 'POST' && pathname === '/api/auth/login') {
    const body = await parseBody(req);
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return sendJson(res, 400, { error: 'Please enter your username/email and password.' });
    }

    const user = db.getUserByUsername(usernameOrEmail) || db.getUserByEmail(usernameOrEmail);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return sendJson(res, 401, { error: 'Invalid username/email or password.' });
    }
    if (user.status === 'inactive') {
      return sendJson(res, 403, { error: 'Your account has been deactivated. Please contact the administrator.' });
    }

    const token = db.createSession(user.id, user.role);

    return sendJson(res, 200, {
      message: 'Signed in successfully!',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        unlockedLevel: user.unlockedLevel,
        totalScore: user.totalScore,
        completedLevels: user.completedLevels,
        mustChangePassword: user.mustChangePassword
      }
    });
  }

  // GET /api/auth/me
  if (method === 'GET' && pathname === '/api/auth/me') {
    const user = getAuthUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized. Please sign in.' });
    }
    return sendJson(res, 200, {
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        unlockedLevel: user.unlockedLevel,
        totalScore: user.totalScore,
        completedLevels: user.completedLevels,
        mustChangePassword: user.mustChangePassword
      }
    });
  }

  // POST /api/auth/logout
  if (method === 'POST' && pathname === '/api/auth/logout') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token) db.removeSession(token);
    return sendJson(res, 200, { message: 'Logged out successfully.' });
  }

  // POST /api/auth/forgot-password
  if (method === 'POST' && pathname === '/api/auth/forgot-password') {
    const body = await parseBody(req);
    const { usernameOrEmail } = body;
    const user = db.getUserByUsername(usernameOrEmail) || db.getUserByEmail(usernameOrEmail);

    if (!user) {
      // Security: Do not reveal if email exists, return generic friendly message
      return sendJson(res, 200, {
        message: 'If an account matches those details, a reset request has been queued for the administrator.'
      });
    }

    db.addPasswordReset({
      id: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      email: user.email,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    });

    return sendJson(res, 200, {
      message: 'Password reset request submitted! An administrator will review your request or assign a temporary password.'
    });
  }

  // POST /api/auth/change-password
  if (method === 'POST' && pathname === '/api/auth/change-password') {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });

    const body = await parseBody(req);
    const { newPassword, confirmPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return sendJson(res, 400, { error: 'New password must be at least 6 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return sendJson(res, 400, { error: 'Passwords do not match.' });
    }

    db.updateUser(user.id, {
      passwordHash: hashPassword(newPassword),
      mustChangePassword: false
    });

    return sendJson(res, 200, { message: 'Password updated successfully!' });
  }

  // =========================================================================
  // GAMEPLAY & PUZZLE ROUTES
  // =========================================================================

  // GET /api/puzzles - List puzzles metadata for dashboard
  if (method === 'GET' && pathname === '/api/puzzles') {
    const user = getAuthUser(req);
    const userUnlocked = user ? user.unlockedLevel : 1;
    const userCompleted = user ? (user.completedLevels || []) : [];
    const settings = db.getSettings();

    const puzzles = db.getPuzzles()
      .filter(p => p.enabled)
      .sort((a, b) => a.order - b.order)
      .map(p => ({
        id: p.id,
        category: p.category,
        title: p.title,
        order: p.order,
        points: p.points,
        isUnlocked: p.id <= userUnlocked,
        isCompleted: userCompleted.includes(p.id),
        score: user ? (user.levelScores?.[p.id] || 0) : 0
      }));

    return sendJson(res, 200, { puzzles, settings });
  }

  // GET /api/puzzles/:id - Get puzzle details for playing (Backend Security Protected)
  const puzzleMatch = pathname.match(/^\/api\/puzzles\/(\d+)$/);
  if (method === 'GET' && puzzleMatch) {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Please sign in to play.' });

    const puzzleId = parseInt(puzzleMatch[1]);
    const puzzle = db.getPuzzleById(puzzleId);
    if (!puzzle || !puzzle.enabled) {
      return sendJson(res, 404, { error: 'Puzzle not found or currently disabled.' });
    }

    // STRICT BACKEND VALIDATION: Player CANNOT open locked levels
    if (puzzle.id > user.unlockedLevel) {
      return sendJson(res, 403, {
        error: 'Complete the previous level to unlock this level.',
        locked: true
      });
    }

    const settings = db.getSettings();
    let timeLimit = settings.easyTimer;
    if (puzzle.category === 'medium') timeLimit = settings.mediumTimer;
    if (puzzle.category === 'hard') timeLimit = settings.hardTimer;

    // Sanitize response: NEVER return acceptedAnswers to the frontend!
    return sendJson(res, 200, {
      puzzle: {
        id: puzzle.id,
        category: puzzle.category,
        title: puzzle.title,
        question: puzzle.question,
        type: puzzle.type,
        options: puzzle.options || null,
        hints: puzzle.hints || [],
        points: puzzle.points,
        timeLimit,
        isCompleted: (user.completedLevels || []).includes(puzzle.id),
        userScore: user.levelScores?.[puzzle.id] || 0
      }
    });
  }

  // POST /api/puzzles/:id/submit - Submit answer & calculate score
  const submitMatch = pathname.match(/^\/api\/puzzles\/(\d+)\/submit$/);
  if (method === 'POST' && submitMatch) {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });

    const puzzleId = parseInt(submitMatch[1]);
    const puzzle = db.getPuzzleById(puzzleId);
    if (!puzzle) return sendJson(res, 404, { error: 'Puzzle not found.' });

    // Validate sequential unlock
    if (puzzle.id > user.unlockedLevel) {
      return sendJson(res, 403, { error: 'Complete the previous level to unlock this level.' });
    }

    const body = await parseBody(req);
    const { answer, hintsUsed = 0, timeRemaining = 0 } = body;

    if (answer === undefined || answer === null || String(answer).trim() === '') {
      return sendJson(res, 400, { error: 'Please enter your answer before submitting.' });
    }

    const userAnswerNorm = normalizeAnswer(answer);
    const isCorrect = puzzle.acceptedAnswers.some(ans => {
      const targetNorm = normalizeAnswer(ans);
      return userAnswerNorm === targetNorm || userAnswerNorm.includes(targetNorm);
    });

    if (!isCorrect) {
      return sendJson(res, 200, {
        correct: false,
        message: 'Incorrect answer. Read the clues carefully, think outside the box, and try again!'
      });
    }

    // Answer is CORRECT! Compute scoring on backend
    const settings = db.getSettings();
    const basePoints = puzzle.points || 100;
    const noHintsBonus = hintsUsed === 0 ? (settings.noHintsBonus || 25) : 0;
    const speedBonus = timeRemaining > 20 ? (settings.speedBonus || 20) : 0;
    const hintPenalty = (hintsUsed || 0) * (settings.hintPenalty || 15);

    const earnedScore = Math.max(10, basePoints + noHintsBonus + speedBonus - hintPenalty);

    const alreadyCompleted = (user.completedLevels || []).includes(puzzle.id);
    let newUnlockedLevel = user.unlockedLevel;
    let newTotalScore = user.totalScore;
    const updatedCompletedLevels = [...(user.completedLevels || [])];
    const updatedLevelScores = { ...(user.levelScores || {}) };

    if (!alreadyCompleted) {
      updatedCompletedLevels.push(puzzle.id);
      updatedLevelScores[puzzle.id] = earnedScore;
      newTotalScore += earnedScore;

      // Unlock next level sequentially up to Level 30
      if (puzzle.id === user.unlockedLevel && puzzle.id < 30) {
        newUnlockedLevel = puzzle.id + 1;
      }
    } else {
      // Replay: only update if new score is higher
      const prevScore = user.levelScores?.[puzzle.id] || 0;
      if (earnedScore > prevScore) {
        const diff = earnedScore - prevScore;
        newTotalScore += diff;
        updatedLevelScores[puzzle.id] = earnedScore;
      }
    }

    db.updateUser(user.id, {
      unlockedLevel: newUnlockedLevel,
      totalScore: newTotalScore,
      completedLevels: updatedCompletedLevels,
      levelScores: updatedLevelScores
    });

    // Determine Milestone Greetings
    let greeting = null;
    let milestone = null;

    if (puzzle.id === 10) {
      milestone = 'easy';
      greeting = 'Congratulations! You have successfully completed all Easy Levels!';
    } else if (puzzle.id === 20) {
      milestone = 'medium';
      greeting = 'Amazing! You have successfully completed all Medium Levels!';
    } else if (puzzle.id === 30) {
      milestone = 'hard';
      greeting = 'LEGENDARY ACHIEVEMENT! You have completed all 30 levels of Think Outside the Box!';
    }

    return sendJson(res, 200, {
      correct: true,
      message: 'Correct! Puzzle solved successfully!',
      earnedScore,
      basePoints,
      noHintsBonus,
      speedBonus,
      hintPenalty,
      totalScore: newTotalScore,
      unlockedLevel: newUnlockedLevel,
      completedLevels: updatedCompletedLevels,
      milestone,
      greeting,
      nextLevel: puzzle.id < 30 ? puzzle.id + 1 : null
    });
  }

  // =========================================================================
  // LEADERBOARD ROUTE
  // =========================================================================

  // GET /api/leaderboard
  if (method === 'GET' && pathname === '/api/leaderboard') {
    const user = getAuthUser(req);
    const allUsers = db.getUsers().filter(u => u.status !== 'inactive');

    // Rank primarily by totalScore descending, then by completedLevels.length descending
    const ranked = allUsers
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        const bCount = (b.completedLevels || []).length;
        const aCount = (a.completedLevels || []).length;
        return bCount - aCount;
      })
      .map((u, idx) => ({
        rank: idx + 1,
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        totalScore: u.totalScore || 0,
        completedCount: (u.completedLevels || []).length,
        completionPct: Math.round(((u.completedLevels || []).length / 30) * 100),
        isCurrentPlayer: user ? user.id === u.id : false
      }));

    const currentPlayerRank = user ? (ranked.find(r => r.id === user.id)?.rank || null) : null;

    return sendJson(res, 200, {
      leaderboard: ranked.slice(0, 50),
      totalPlayers: ranked.length,
      currentPlayerRank
    });
  }

  // =========================================================================
  // ADMIN ROUTES (ROLE-BASED AUTHORIZATION REQUIRED)
  // =========================================================================

  if (pathname.startsWith('/api/admin/')) {
    const adminUser = getAuthUser(req);
    if (!adminUser || adminUser.role !== 'admin') {
      return sendJson(res, 403, { error: 'Forbidden. Administrator authorization required.' });
    }

    // GET /api/admin/overview
    if (method === 'GET' && pathname === '/api/admin/overview') {
      const users = db.getUsers();
      const puzzles = db.getPuzzles();
      const nonAdminUsers = users.filter(u => u.role !== 'admin');

      const totalCompletedLevels = nonAdminUsers.reduce((sum, u) => sum + (u.completedLevels || []).length, 0);
      const highestScore = Math.max(0, ...nonAdminUsers.map(u => u.totalScore || 0));

      return sendJson(res, 200, {
        totalUsers: nonAdminUsers.length,
        totalCompletedLevels,
        highestScore,
        activeUsersCount: nonAdminUsers.filter(u => u.status === 'active').length,
        puzzlesEasyCount: puzzles.filter(p => p.category === 'easy').length,
        puzzlesMediumCount: puzzles.filter(p => p.category === 'medium').length,
        puzzlesHardCount: puzzles.filter(p => p.category === 'hard').length
      });
    }

    // GET /api/admin/users
    if (method === 'GET' && pathname === '/api/admin/users') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      let users = db.getUsers().filter(u => u.role !== 'admin');

      if (q) {
        users = users.filter(u => u.username.includes(q) || u.email.includes(q) || u.fullName.toLowerCase().includes(q));
      }

      return sendJson(res, 200, {
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          status: u.status,
          unlockedLevel: u.unlockedLevel,
          totalScore: u.totalScore,
          completedCount: (u.completedLevels || []).length,
          createdAt: u.createdAt
        }))
      });
    }

    // POST /api/admin/users/:id/status
    const statusMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)\/status$/);
    if (method === 'POST' && statusMatch) {
      const targetUserId = statusMatch[1];
      const body = await parseBody(req);
      const updated = db.updateUser(targetUserId, { status: body.status === 'inactive' ? 'inactive' : 'active' });
      return sendJson(res, 200, { message: 'User status updated.', user: updated });
    }

    // POST /api/admin/users/:id/reset-password
    const resetPwMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)\/reset-password$/);
    if (method === 'POST' && resetPwMatch) {
      const targetUserId = resetPwMatch[1];
      const body = await parseBody(req);
      const tempPassword = body.tempPassword || 'Pass@' + Math.floor(1000 + Math.random() * 9000);

      db.updateUser(targetUserId, {
        passwordHash: hashPassword(tempPassword),
        mustChangePassword: true
      });

      return sendJson(res, 200, {
        message: `Temporary password assigned: ${tempPassword}. The user will be required to change it at their next login.`,
        tempPassword
      });
    }

    // POST /api/admin/users/:id/reset-progress
    const resetProgMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)\/reset-progress$/);
    if (method === 'POST' && resetProgMatch) {
      const targetUserId = resetProgMatch[1];
      db.updateUser(targetUserId, {
        unlockedLevel: 1,
        totalScore: 0,
        completedLevels: [],
        levelScores: {}
      });
      return sendJson(res, 200, { message: 'Player progress reset to Level 1.' });
    }

    // GET /api/admin/puzzles
    if (method === 'GET' && pathname === '/api/admin/puzzles') {
      return sendJson(res, 200, { puzzles: db.getPuzzles() });
    }

    // PUT /api/admin/puzzles/:id
    const editPuzzleMatch = pathname.match(/^\/api\/admin\/puzzles\/(\d+)$/);
    if (method === 'PUT' && editPuzzleMatch) {
      const id = parseInt(editPuzzleMatch[1]);
      const body = await parseBody(req);
      const updated = db.updatePuzzle(id, body);
      return sendJson(res, 200, { message: 'Puzzle updated successfully.', puzzle: updated });
    }

    // POST /api/admin/puzzles/shuffle
    if (method === 'POST' && pathname === '/api/admin/puzzles/shuffle') {
      const body = await parseBody(req);
      const { category } = body; // 'easy', 'medium', or 'hard'

      const all = db.getPuzzles();
      const targetPuzzles = all.filter(p => p.category === category);
      const others = all.filter(p => p.category !== category);

      // Shuffle array
      for (let i = targetPuzzles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetPuzzles[i], targetPuzzles[j]] = [targetPuzzles[j], targetPuzzles[i]];
      }

      // Re-assign IDs and order consistently to preserve sequential level 1-30 integrity
      const baseId = category === 'easy' ? 1 : (category === 'medium' ? 11 : 21);
      targetPuzzles.forEach((p, idx) => {
        p.id = baseId + idx;
        p.order = baseId + idx;
      });

      db.data.puzzles = [...others, ...targetPuzzles].sort((a, b) => a.id - b.id);
      db.save();

      return sendJson(res, 200, {
        message: `${category.toUpperCase()} puzzles successfully shuffled without breaking level progression!`
      });
    }

    // GET & PUT /api/admin/settings
    if (method === 'GET' && pathname === '/api/admin/settings') {
      return sendJson(res, 200, { settings: db.getSettings() });
    }

    if (method === 'PUT' && pathname === '/api/admin/settings') {
      const body = await parseBody(req);
      const updated = db.updateSettings(body);
      return sendJson(res, 200, { message: 'Settings saved and applied to gameplay.', settings: updated });
    }

    // POST /api/admin/reset-all
    if (method === 'POST' && pathname === '/api/admin/reset-all') {
      const body = await parseBody(req);
      if (body.confirmation !== 'RESET_ALL_CONFIRMED') {
        return sendJson(res, 400, { error: 'Explicit confirmation required. Send confirmation: "RESET_ALL_CONFIRMED".' });
      }
      db.resetAllGameProgress();
      return sendJson(res, 200, { message: 'All player game progress and scores have been reset.' });
    }
  }

  // Route not found
  return sendJson(res, 404, { error: `Endpoint ${method} ${pathname} not found.` });
}
