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

export function isValidMatchstickMove(initial, solution) {
  const segments = {
    '0': 'abcdef',
    '1': 'bc',
    '2': 'abged',
    '3': 'abgcd',
    '4': 'fgbc',
    '5': 'afgcd',
    '6': 'afgecd',
    '7': 'abc',
    '8': 'abcdefg',
    '9': 'abfgcd',
    '+': 'hv',
    '-': 'h',
    '=': 'tu'
  };
  const start = String(initial || '').replace(/\s+/g, '');
  const end = String(solution || '').replace(/\s+/g, '');
  if (start.length !== end.length || !/^\d+[+-]\d+=\d+$/.test(end)) return false;
  let removed = 0;
  let added = 0;
  for (let index = 0; index < start.length; index++) {
    const before = segments[start[index]];
    const after = segments[end[index]];
    if (!before || !after) return false;
    for (const segment of before) if (!after.includes(segment)) removed++;
    for (const segment of after) if (!before.includes(segment)) added++;
  }
  const [, left, operator, right, result] = end.match(/^(\d+)([+-])(\d+)=(\d+)$/);
  const validMath = Number(result) === (operator === '+' ? Number(left) + Number(right) : Number(left) - Number(right));
  return removed === 1 && added === 1 && validMath;
}

function getOrStartGameSession(user) {
  let session = db.getActiveGameSession(user.id);
  if (!session) {
    session = db.createGameSession(user.id, db.getSettings().gameDuration);
  }
  return session;
}

function finishGameSession(session, user, status) {
  if (!session || session.status !== 'active') return session;
  const finishedAt = new Date().toISOString();
  const finalSession = db.updateGameSession(session.id, { status, finishedAt });
  const history = [...(user.gameHistory || []), {
    sessionId: session.id,
    startedAt: session.startedAt,
    finishedAt,
    status,
    score: session.score || 0,
    solvedCount: (session.solvedLevels || []).length,
    skippedCount: (session.skippedPuzzleIds || []).length,
    solvedLevels: session.solvedLevels || [],
    skippedPuzzleIds: session.skippedPuzzleIds || [],
    puzzles: session.history || []
  }];
  db.updateUser(user.id, { gameHistory: history });
  return finalSession;
}

function gameSessionResponse(session, user) {
  const remainingSeconds = session.status === 'active'
    ? Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000))
    : 0;
  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt,
    remainingSeconds,
    score: session.score || 0,
    solvedCount: (session.solvedLevels || []).length,
    skippedCount: (session.skippedPuzzleIds || []).length,
    totalScore: user.totalScore || 0,
    completedLevels: user.completedLevels || []
  };
}

function progressFor(user, settings) {
  const points = user.totalScore || 0;
  return {
    mediumUnlocked: points >= settings.mediumThreshold,
    hardUnlocked: points >= settings.hardThreshold,
    mediumThreshold: settings.mediumThreshold,
    hardThreshold: settings.hardThreshold,
    pointsToMedium: Math.max(0, settings.mediumThreshold - points),
    pointsToHard: Math.max(0, settings.hardThreshold - points)
  };
}

function hashResetCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
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
    const { fullName, password, confirmPassword, collegeName = '' } = body;
    const playerId = String(body.playerId || body.username || '').trim();
    const email = String(body.email || `${playerId.toLowerCase()}@players.local`).trim().toLowerCase();

    if (typeof fullName !== 'string' || !fullName.trim() || !playerId || typeof password !== 'string' || !password) {
      return sendJson(res, 400, { error: 'Full name, player ID, and password are required.' });
    }
    if (playerId.length > 40 || !/^[a-zA-Z0-9._-]+$/.test(playerId)) {
      return sendJson(res, 400, { error: 'Player ID must be 1-40 letters, numbers, dots, underscores, or hyphens.' });
    }
    if (password !== confirmPassword) {
      return sendJson(res, 400, { error: 'Passwords do not match.' });
    }
    if (password.length < 8 || password.length > 128) {
      return sendJson(res, 400, { error: 'Password must be between 8 and 128 characters long.' });
    }
    if (db.getUsers().some(user => user.playerId?.toLowerCase() === playerId.toLowerCase() || user.username.toLowerCase() === playerId.toLowerCase())) {
      return sendJson(res, 400, { error: 'Player ID is already registered.' });
    }
    if (body.email && db.getUserByEmail(email)) {
      return sendJson(res, 400, { error: 'Email address is already registered.' });
    }
    if (typeof collegeName !== 'string' || collegeName.trim().length > 120 || String(fullName).trim().length > 120) {
      return sendJson(res, 400, { error: 'Name and college must be 120 characters or fewer.' });
    }
    const existingCodes = new Set(db.getUsers().map(user => user.gameCode).filter(Boolean));
    let gameCode;
    do {
      gameCode = `TECH-${crypto.randomInt(10000, 100000)}`;
    } while (existingCodes.has(gameCode));

    const newUser = {
      id: crypto.randomUUID(),
      fullName: fullName.trim(),
      playerId,
      username: playerId.toLowerCase(),
      email,
      collegeName: collegeName.trim(),
      gameCode,
      passwordHash: hashPassword(password),
      role: 'user',
      status: 'active',
      unlockedLevel: 30,
      totalScore: 0,
      completedLevels: [],
      skippedLevels: [],
      correctAnswers: 0,
      levelScores: {},
      gameHistory: [],
      passwordResetRequired: false,
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
        playerId: newUser.playerId,
        collegeName: newUser.collegeName,
        gameCode: newUser.gameCode,
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
    const { usernameOrEmail, password, gameCode } = body;

    if (!usernameOrEmail || !password) {
      return sendJson(res, 400, { error: 'Please enter your username/email and password.' });
    }

    const user = db.getUsers().find(candidate =>
      candidate.playerId?.toLowerCase() === String(usernameOrEmail).toLowerCase()
      || candidate.username.toLowerCase() === String(usernameOrEmail).toLowerCase()
      || candidate.email.toLowerCase() === String(usernameOrEmail).toLowerCase()
    );
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return sendJson(res, 401, { error: 'Invalid username/email or password.' });
    }
    if (user.passwordResetRequired) {
      return sendJson(res, 403, { error: 'Your password reset is pending. Use the one-time reset code provided by the administrator.' });
    }
    if (user.role !== 'admin' && user.gameCode !== String(gameCode || '').trim().toUpperCase()) {
      return sendJson(res, 401, { error: 'Please enter the TECH game code assigned to this player ID.' });
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
        playerId: user.playerId,
        collegeName: user.collegeName || '',
        gameCode: user.gameCode || null,
        role: user.role,
        unlockedLevel: user.unlockedLevel,
        totalScore: user.totalScore,
        completedLevels: user.completedLevels,
        progress: progressFor(user, db.getSettings()),
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
        playerId: user.playerId,
        collegeName: user.collegeName || '',
        gameCode: user.gameCode || null,
        role: user.role,
        unlockedLevel: user.unlockedLevel,
        totalScore: user.totalScore,
        completedLevels: user.completedLevels,
        skippedLevels: user.skippedLevels || [],
        correctAnswers: user.correctAnswers || 0,
        gameHistory: user.gameHistory || [],
        progress: progressFor(user, db.getSettings()),
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
  if (method === 'POST' && pathname === '/api/auth/reset-password') {
    const body = await parseBody(req);
    const { resetCode, newPassword, confirmPassword } = body;
    if (typeof resetCode !== 'string' || !/^[a-f\d]{64}$/i.test(resetCode)) {
      return sendJson(res, 400, { error: 'Enter the valid one-time password reset code.' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      return sendJson(res, 400, { error: 'New password must be between 8 and 128 characters.' });
    }
    if (newPassword !== confirmPassword) return sendJson(res, 400, { error: 'Passwords do not match.' });
    const resetHash = hashResetCode(resetCode);
    const reset = db.data.passwordResets.find(item => {
      if (item.status !== 'issued' || item.expiresAt <= Date.now()) return false;
      const expected = Buffer.from(item.resetCodeHash || '', 'hex');
      const actual = Buffer.from(resetHash, 'hex');
      return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    });
    if (!reset) return sendJson(res, 400, { error: 'The reset code is invalid, expired, or already used.' });
    const user = db.getUserById(reset.userId);
    if (!user) return sendJson(res, 404, { error: 'Player account no longer exists.' });
    db.updateUser(user.id, { passwordHash: hashPassword(newPassword), passwordResetRequired: false, mustChangePassword: false });
    reset.status = 'used';
    reset.usedAt = new Date().toISOString();
    db.data.sessions = db.data.sessions.filter(session => session.userId !== user.id);
    db.save();
    return sendJson(res, 200, { message: 'Password reset successfully. Sign in with your new password and TECH game code.' });
  }

  if (method === 'POST' && pathname === '/api/auth/change-password') {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });

    const body = await parseBody(req);
    const { newPassword, confirmPassword } = body;

    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      return sendJson(res, 400, { error: 'New password must be between 8 and 128 characters.' });
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
        isUnlocked: true,
        isCompleted: userCompleted.includes(p.id),
        score: user ? (user.levelScores?.[p.id] || 0) : 0
      }));

    return sendJson(res, 200, {
      puzzles,
      settings,
      progress: user ? progressFor(user, settings) : null,
      totalScore: user?.totalScore || 0
    });
  }

  if (method === 'POST' && pathname === '/api/game/start') {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Please sign in to play.' });
    let session = db.getActiveGameSession(user.id);
    if (session && session.expiresAt <= Date.now()) {
      session = finishGameSession(session, user, 'expired');
      return sendJson(res, 200, { session: gameSessionResponse(session, user), gameOver: true });
    }
    session ||= getOrStartGameSession(user);
    return sendJson(res, 200, { session: gameSessionResponse(session, user) });
  }

  if (method === 'GET' && pathname === '/api/game/status') {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Please sign in to play.' });
    let session = db.getActiveGameSession(user.id);
    if (!session) {
      return sendJson(res, 200, { session: null, totalScore: user.totalScore || 0 });
    }
    if (session.expiresAt <= Date.now()) session = finishGameSession(session, user, 'expired');
    return sendJson(res, 200, { session: gameSessionResponse(session, user), gameOver: session.status === 'expired' });
  }

  if (method === 'POST' && pathname === '/api/game/finish') {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });
    let session = db.getActiveGameSession(user.id);
    if (!session) return sendJson(res, 404, { error: 'No active game session.' });
    session = finishGameSession(session, user, session.expiresAt <= Date.now() ? 'expired' : 'completed');
    return sendJson(res, 200, { session: gameSessionResponse(session, user) });
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

    let session = db.getActiveGameSession(user.id);
    if (!session) session = getOrStartGameSession(user);
    if (session.expiresAt <= Date.now()) {
      session = finishGameSession(session, user, 'expired');
      return sendJson(res, 410, { error: 'The game timer has expired.', gameOver: true, session: gameSessionResponse(session, user) });
    }
    if (session.skippedPuzzleIds.includes(puzzle.id)) {
      return sendJson(res, 409, { error: 'This puzzle was skipped in the current game session.' });
    }

    const settings = db.getSettings();

    // Sanitize response: NEVER return acceptedAnswers to the frontend!
    return sendJson(res, 200, {
      puzzle: {
        id: puzzle.id,
        category: puzzle.category,
        title: puzzle.title,
        question: puzzle.question,
        type: puzzle.type,
        options: puzzle.options || null,
        hints: settings.hintsEnabled ? (puzzle.hints || []) : [],
        points: puzzle.points,
        matchstick: puzzle.matchstick || null,
        remainingSeconds: gameSessionResponse(session, user).remainingSeconds,
        isCompleted: (user.completedLevels || []).includes(puzzle.id),
        userScore: user.levelScores?.[puzzle.id] || 0,
        hintsEnabled: settings.hintsEnabled
      },
      session: gameSessionResponse(session, user)
    });
  }

  const hintMatch = pathname.match(/^\/api\/puzzles\/(\d+)\/hint$/);
  if (method === 'POST' && hintMatch) {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });
    const puzzleId = Number(hintMatch[1]);
    const puzzle = db.getPuzzleById(puzzleId);
    const settings = db.getSettings();
    if (!puzzle || !puzzle.enabled) return sendJson(res, 404, { error: 'Puzzle not found.' });
    if (!settings.hintsEnabled) return sendJson(res, 403, { error: 'Hints are disabled by the administrator.' });
    let session = db.getActiveGameSession(user.id);
    if (!session) session = getOrStartGameSession(user);
    if (session.expiresAt <= Date.now()) {
      session = finishGameSession(session, user, 'expired');
      return sendJson(res, 410, { error: 'The game timer has expired.', gameOver: true });
    }
    if (session.skippedPuzzleIds.includes(puzzleId)) return sendJson(res, 409, { error: 'This puzzle was skipped.' });
    const used = session.hintsUsed[puzzleId] || 0;
    if (used >= (puzzle.hints || []).length) return sendJson(res, 400, { error: 'No more hints are available.' });
    const nextUsed = used + 1;
    session = db.updateGameSession(session.id, { hintsUsed: { ...session.hintsUsed, [puzzleId]: nextUsed } });
    return sendJson(res, 200, {
      hint: puzzle.hints[used],
      hintsUsed: nextUsed,
      remainingHints: puzzle.hints.length - nextUsed,
      hintPenalty: settings.hintPenalty
    });
  }

  const skipMatch = pathname.match(/^\/api\/puzzles\/(\d+)\/skip$/);
  if (method === 'POST' && skipMatch) {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });
    const puzzleId = Number(skipMatch[1]);
    const puzzle = db.getPuzzleById(puzzleId);
    const settings = db.getSettings();
    if (!puzzle || !puzzle.enabled) return sendJson(res, 404, { error: 'Puzzle not found.' });
    if (!settings.skipEnabled) return sendJson(res, 403, { error: 'Skipping is disabled by the administrator.' });
    if ((user.completedLevels || []).includes(puzzleId)) return sendJson(res, 409, { error: 'This puzzle has already been completed.' });
    let session = db.getActiveGameSession(user.id);
    if (!session) session = getOrStartGameSession(user);
    if (session.expiresAt <= Date.now()) {
      session = finishGameSession(session, user, 'expired');
      return sendJson(res, 410, { error: 'The game timer has expired.', gameOver: true });
    }
    if (session.skippedPuzzleIds.includes(puzzleId)) return sendJson(res, 409, { error: 'This puzzle has already been skipped.' });
    const penalty = Math.max(0, Math.min(settings.skipPenalty || 0, user.totalScore || 0));
    const updatedUser = db.updateUser(user.id, {
      totalScore: (user.totalScore || 0) - penalty,
      skippedLevels: [...new Set([...(user.skippedLevels || []), puzzleId])]
    });
    const skipped = [...session.skippedPuzzleIds, puzzleId];
    session = db.updateGameSession(session.id, {
      skippedPuzzleIds: skipped,
      score: Math.max(0, (session.score || 0) - penalty),
      history: [...(session.history || []), { puzzleId, action: 'skipped', at: new Date().toISOString(), penalty }]
    });
    return sendJson(res, 200, {
      skipped: true,
      penalty,
      totalScore: updatedUser.totalScore,
      nextLevel: puzzleId < 30 ? puzzleId + 1 : null,
      session: gameSessionResponse(session, updatedUser)
    });
  }

  // POST /api/puzzles/:id/submit - Submit answer & calculate score
  const submitMatch = pathname.match(/^\/api\/puzzles\/(\d+)\/submit$/);
  if (method === 'POST' && submitMatch) {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });

    const puzzleId = parseInt(submitMatch[1]);
    const puzzle = db.getPuzzleById(puzzleId);
    if (!puzzle || !puzzle.enabled) return sendJson(res, 404, { error: 'Puzzle not found or currently disabled.' });

    const body = await parseBody(req);
    const { answer, difficulty = 'medium' } = body;

    if (answer === undefined || answer === null || String(answer).trim() === '') {
      return sendJson(res, 400, { error: 'Please enter your answer before submitting.' });
    }

    let session = db.getActiveGameSession(user.id);
    if (!session) session = getOrStartGameSession(user);
    if (session.expiresAt <= Date.now()) {
      session = finishGameSession(session, user, 'expired');
      return sendJson(res, 410, { error: 'The game timer has expired.', gameOver: true, session: gameSessionResponse(session, user) });
    }
    if (session.skippedPuzzleIds.includes(puzzle.id)) return sendJson(res, 409, { error: 'This puzzle was skipped in the current game session.' });

    const userAnswerNorm = normalizeAnswer(answer);
    let isCorrect;
    if (puzzle.type === 'matchstick') {
      const submitted = String(answer).replace(/\s+/g, '').toLowerCase();
      const challenge = puzzle.matchstick?.challenges?.[difficulty];
      isCorrect = Boolean(challenge && submitted === challenge.solution && isValidMatchstickMove(challenge.initial, challenge.solution));
    } else {
      isCorrect = puzzle.acceptedAnswers.some(ans => userAnswerNorm === normalizeAnswer(ans));
    }

    if (!isCorrect) {
      db.updateGameSession(session.id, {
        history: [...(session.history || []), { puzzleId: puzzle.id, action: 'incorrect', at: new Date().toISOString() }]
      });
      return sendJson(res, 200, {
        correct: false,
        message: 'Incorrect answer. Read the clues carefully, think outside the box, and try again!'
      });
    }

    // Answer is CORRECT! Compute scoring on backend
    const settings = db.getSettings();
    const basePoints = puzzle.points || 100;
    const hintsUsed = session.hintsUsed[puzzle.id] || 0;
    const noHintsBonus = hintsUsed === 0 ? (settings.noHintsBonus ?? 25) : 0;
    const speedBonus = 0;
    const hintPenalty = hintsUsed * (settings.hintPenalty || 0);
    const alreadyCompleted = (user.completedLevels || []).includes(puzzle.id);
    const earnedScore = alreadyCompleted ? 0 : Math.max(0, basePoints + noHintsBonus - hintPenalty);

    let newUnlockedLevel = user.unlockedLevel;
    let newTotalScore = user.totalScore;
    const updatedCompletedLevels = [...(user.completedLevels || [])];
    const updatedLevelScores = { ...(user.levelScores || {}) };

    if (!alreadyCompleted) {
      updatedCompletedLevels.push(puzzle.id);
      updatedLevelScores[puzzle.id] = earnedScore;
      newTotalScore += earnedScore;
    } else {
      updatedLevelScores[puzzle.id] = user.levelScores?.[puzzle.id] || 0;
    }

    const updatedUser = db.updateUser(user.id, {
      unlockedLevel: newUnlockedLevel,
      totalScore: newTotalScore,
      completedLevels: updatedCompletedLevels,
      levelScores: updatedLevelScores,
      correctAnswers: (user.correctAnswers || 0) + (alreadyCompleted ? 0 : 1)
    });
    const solvedLevels = alreadyCompleted ? session.solvedLevels : [...new Set([...(session.solvedLevels || []), puzzle.id])];
    session = db.updateGameSession(session.id, {
      score: (session.score || 0) + earnedScore,
      solvedLevels,
      history: alreadyCompleted ? (session.history || []) : [...(session.history || []), { puzzleId: puzzle.id, action: 'solved', at: new Date().toISOString(), earnedScore }]
    });
    if (updatedCompletedLevels.length === 30) session = finishGameSession(session, updatedUser, 'completed');

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
      correctAnswers: updatedUser.correctAnswers,
      progress: progressFor(updatedUser, settings),
      session: gameSessionResponse(session, updatedUser),
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
    const allUsers = db.getUsers().filter(u => u.role !== 'admin' && u.status !== 'inactive');

    // Break ties with correct answers, then earliest recorded completion.
    const ranked = allUsers
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if ((b.correctAnswers || 0) !== (a.correctAnswers || 0)) return (b.correctAnswers || 0) - (a.correctAnswers || 0);
        const aFinished = a.gameHistory?.find(game => game.status === 'completed')?.finishedAt;
        const bFinished = b.gameHistory?.find(game => game.status === 'completed')?.finishedAt;
        const aTime = aFinished ? Date.parse(aFinished) : Number.POSITIVE_INFINITY;
        const bTime = bFinished ? Date.parse(bFinished) : Number.POSITIVE_INFINITY;
        if (aTime !== bTime) return aTime < bTime ? -1 : 1;
        return a.id.localeCompare(b.id);
      })
      .map((u, idx) => ({
        rank: idx + 1,
        id: u.id,
        username: u.username,
        playerId: u.playerId || u.username,
        gameCode: u.gameCode || null,
        fullName: u.fullName,
        totalScore: u.totalScore || 0,
        completedCount: (u.completedLevels || []).length,
        correctAnswers: u.correctAnswers || 0,
        highestLevel: Math.max(0, ...(u.completedLevels || [])),
        completionPct: Math.round(((u.completedLevels || []).length / 30) * 100),
        completionTime: u.gameHistory?.find(game => game.status === 'completed')?.finishedAt || null,
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
        activeGamesCount: db.data.gameSessions.filter(session => session.status === 'active' && session.expiresAt > Date.now()).length,
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
        users = users.filter(u => u.username.includes(q) || u.email.includes(q) || u.fullName.toLowerCase().includes(q)
          || u.gameCode?.toLowerCase().includes(q) || u.playerId?.toLowerCase().includes(q) || u.collegeName?.toLowerCase().includes(q));
      }
      const settings = db.getSettings();

      return sendJson(res, 200, {
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          playerId: u.playerId || u.username,
          gameCode: u.gameCode || null,
          fullName: u.fullName,
          email: u.email,
          collegeName: u.collegeName || '',
          status: u.status,
          unlockedLevel: u.unlockedLevel,
          highestLevel: Math.max(0, ...(u.completedLevels || [])),
          completedLevels: u.completedLevels || [],
          totalScore: u.totalScore || 0,
          currentDifficulty: (u.totalScore || 0) >= settings.hardThreshold ? 'Hard'
            : (u.totalScore || 0) >= settings.mediumThreshold ? 'Medium' : 'Easy',
          gameStatus: db.getActiveGameSession(u.id) ? 'Active'
            : (u.gameHistory || []).at(-1)?.status || 'Not started',
          completedCount: (u.completedLevels || []).length,
          correctAnswers: u.correctAnswers || 0,
          skippedLevels: u.skippedLevels || [],
          passwordResetRequested: db.data.passwordResets.some(reset => reset.userId === u.id && reset.status === 'pending'),
          createdAt: u.createdAt,
          gameHistory: u.gameHistory || [],
          activeSession: (() => {
            const session = db.getActiveGameSession(u.id);
            return session ? {
              status: session.status,
              remainingSeconds: Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000)),
              startedAt: session.startedAt
            } : null;
          })()
        }))
      });
    }

    // POST /api/admin/users/:id/status
    const statusMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)\/status$/);
    if (method === 'POST' && statusMatch) {
      const targetUserId = statusMatch[1];
      const body = await parseBody(req);
      const updated = db.updateUser(targetUserId, { status: body.status === 'inactive' ? 'inactive' : 'active' });
      if (updated?.status === 'inactive') {
        db.data.sessions = db.data.sessions.filter(session => session.userId !== targetUserId);
        db.save();
      }
      return sendJson(res, 200, { message: 'User status updated.', user: updated });
    }

    // POST /api/admin/users/:id/reset-password
    const resetPwMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)\/reset-password$/);
    if (method === 'POST' && resetPwMatch) {
      const targetUserId = resetPwMatch[1];
      const target = db.getUserById(targetUserId);
      if (!target || target.role === 'admin') return sendJson(res, 404, { error: 'Player account not found.' });
      const resetCode = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 60 * 60 * 1000;
      db.data.passwordResets = db.data.passwordResets.map(reset =>
        reset.userId === targetUserId && ['issued', 'pending'].includes(reset.status) ? { ...reset, status: 'superseded' } : reset
      );
      db.addPasswordReset({
        id: crypto.randomUUID(),
        userId: targetUserId,
        resetCodeHash: hashResetCode(resetCode),
        requestedAt: new Date().toISOString(),
        expiresAt,
        status: 'issued'
      });
      db.updateUser(targetUserId, { passwordResetRequired: true });
      db.data.sessions = db.data.sessions.filter(session => session.userId !== targetUserId);
      db.save();
      return sendJson(res, 200, {
        message: 'One-time password reset code generated. It expires in one hour and can only be used once.',
        resetCode,
        expiresAt
      });
    }

    // POST /api/admin/users/:id/reset-progress
    const resetProgMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)\/reset-progress$/);
    if (method === 'POST' && resetProgMatch) {
      const targetUserId = resetProgMatch[1];
      db.updateUser(targetUserId, {
        unlockedLevel: 30,
        totalScore: 0,
        completedLevels: [],
        skippedLevels: [],
        correctAnswers: 0,
        levelScores: {}
      });
      db.data.gameSessions = db.data.gameSessions.map(session =>
        session.userId === targetUserId && session.status === 'active'
          ? { ...session, status: 'abandoned', finishedAt: new Date().toISOString() }
          : session
      );
      db.save();
      return sendJson(res, 200, { message: 'Player scores and progress reset. All levels remain accessible.' });
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
      const allowed = ['gameDuration', 'mediumThreshold', 'hardThreshold', 'skipEnabled', 'skipPenalty', 'hintsEnabled',
        'easyTimer', 'mediumTimer', 'hardTimer', 'easyPoints', 'mediumPoints', 'hardPoints', 'hintPenalty',
        'noHintsBonus', 'speedBonus', 'rulesAnnouncement'];
      const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
      for (const key of ['gameDuration', 'mediumThreshold', 'hardThreshold', 'skipPenalty', 'hintPenalty']) {
        const max = key === 'gameDuration' ? 86400 : 1000000;
        if (updates[key] !== undefined && (!Number.isInteger(updates[key]) || updates[key] < 0 || updates[key] > max)) {
          return sendJson(res, 400, { error: `${key} must be a non-negative whole number within the allowed range.` });
        }
      }
      if (updates.gameDuration !== undefined && updates.gameDuration < 60) {
        return sendJson(res, 400, { error: 'Game duration must be at least 60 seconds.' });
      }
      const mediumThreshold = updates.mediumThreshold ?? db.getSettings().mediumThreshold;
      const hardThreshold = updates.hardThreshold ?? db.getSettings().hardThreshold;
      if (hardThreshold < mediumThreshold) {
        return sendJson(res, 400, { error: 'The Hard threshold must be greater than or equal to the Medium threshold.' });
      }
      if (updates.skipEnabled !== undefined && typeof updates.skipEnabled !== 'boolean') {
        return sendJson(res, 400, { error: 'skipEnabled must be a boolean.' });
      }
      if (updates.hintsEnabled !== undefined && typeof updates.hintsEnabled !== 'boolean') {
        return sendJson(res, 400, { error: 'hintsEnabled must be a boolean.' });
      }
      if (updates.rulesAnnouncement !== undefined && (typeof updates.rulesAnnouncement !== 'string' || updates.rulesAnnouncement.length > 1000)) {
        return sendJson(res, 400, { error: 'Announcement must be text no longer than 1000 characters.' });
      }
      const updated = db.updateSettings(updates);
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
