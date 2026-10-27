import assert from 'node:assert/strict';
import { db } from './server/db.js';
import { isValidMatchstickMove } from './server/routes.js';

const BASE = process.env.TEST_BASE || 'http://127.0.0.1:3000';
let cleanupPlayerId;
const request = async (endpoint, { token, ...options } = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
  const response = await fetch(`${BASE}${endpoint}`, { ...options, headers });
  return { status: response.status, body: await response.json() };
};
const post = (endpoint, token, body) => request(endpoint, { token, method: 'POST', body: JSON.stringify(body) });

async function run() {
  const playerId = `feature_${Date.now()}`;
  cleanupPlayerId = playerId;
  const registration = await post('/api/auth/register', null, {
    fullName: 'Feature Test Player',
    playerId,
    collegeName: 'Test College',
    password: 'SecurePassword123',
    confirmPassword: 'SecurePassword123'
  });
  assert.equal(registration.status, 201);
  assert.match(registration.body.user.gameCode, /^TECH-\d{5}$/);
  assert.equal(registration.body.user.playerId, playerId);
  const token = registration.body.token;
  assert.ok(token);

  const wrongCodeLogin = await post('/api/auth/login', null, {
    usernameOrEmail: playerId, gameCode: 'TECH-00000', password: 'SecurePassword123'
  });
  assert.equal(wrongCodeLogin.status, 401);
  const login = await post('/api/auth/login', null, {
    usernameOrEmail: playerId, gameCode: registration.body.user.gameCode, password: 'SecurePassword123'
  });
  assert.equal(login.status, 200);

  const deniedAdmin = await request('/api/admin/users', { token });
  assert.equal(deniedAdmin.status, 403);
  const puzzles = await request('/api/puzzles', { token });
  assert.equal(puzzles.body.puzzles.length, 30);
  assert.ok(puzzles.body.puzzles.every(puzzle => puzzle.isUnlocked));
  assert.equal((await request('/api/puzzles/20', { token })).status, 200);

  const started = await post('/api/game/start', token, {});
  assert.equal(started.status, 200);
  assert.equal(started.body.session.status, 'active');
  const sessionId = started.body.session.id;

  assert.equal(isValidMatchstickMove('6+4=4', '8-4=4'), true);
  assert.equal(isValidMatchstickMove('1+1=3', '1+1=2'), true);
  assert.equal(isValidMatchstickMove('1+1=6', '7-1=6'), true);
  assert.equal(isValidMatchstickMove('6+4=4', '9999'), false);
  const badEquation = await post('/api/puzzles/19/submit', token, {
    answer: '9999', difficulty: 'medium'
  });
  assert.equal(badEquation.body.correct, false);

  const firstHint = await post('/api/puzzles/19/hint', token, {});
  assert.equal(firstHint.status, 200);
  assert.equal(firstHint.body.hintsUsed, 1);
  const solved = await post('/api/puzzles/19/submit', token, {
    answer: '8-4=4', difficulty: 'medium', hintsUsed: 0, timeRemaining: 999999
  });
  assert.equal(solved.body.correct, true);
  assert.equal(solved.body.earnedScore, 135);

  const skipped = await post('/api/puzzles/20/skip', token, {});
  assert.equal(skipped.status, 200);
  assert.equal(skipped.body.penalty, 0);
  assert.equal((await post('/api/puzzles/20/submit', token, { answer: 'map' })).status, 409);

  const player = db.getUsers().find(user => user.playerId === playerId);
  const activeSession = db.getActiveGameSession(player.id);
  assert.equal(activeSession.id, sessionId);
  db.updateGameSession(activeSession.id, { expiresAt: Date.now() - 1 });
  const expired = await request('/api/game/status', { token });
  assert.equal(expired.body.gameOver, true);
  assert.equal(expired.body.session.status, 'expired');
  assert.equal(db.getUserById(player.id).gameHistory.length, 1);

  const adminLogin = await post('/api/auth/login', null, {
    usernameOrEmail: 'admin',
    password: 'Admin@123'
  });
  assert.equal(adminLogin.body.user.role, 'admin');
  const adminToken = adminLogin.body.token;
  const playerLookup = await request(`/api/admin/users?q=${encodeURIComponent(registration.body.user.gameCode)}`, { token: adminToken });
  assert.equal(playerLookup.body.users.length, 1);
  assert.equal(playerLookup.body.users[0].gameCode, registration.body.user.gameCode);
  assert.ok(!Object.hasOwn(playerLookup.body.users[0], 'passwordHash'));
  const reset = await post(`/api/admin/users/${player.id}/reset-password`, adminToken, {});
  assert.equal(reset.status, 200);
  assert.match(reset.body.resetCode, /^[a-f\d]{64}$/i);
  assert.ok(!Object.hasOwn(reset.body, 'tempPassword'));
  assert.equal((await post('/api/auth/login', null, {
    usernameOrEmail: playerId, gameCode: registration.body.user.gameCode, password: 'SecurePassword123'
  })).status, 403);
  const passwordReset = await post('/api/auth/reset-password', null, {
    resetCode: reset.body.resetCode,
    newPassword: 'UpdatedSecurePassword123',
    confirmPassword: 'UpdatedSecurePassword123'
  });
  assert.equal(passwordReset.status, 200);
  assert.equal((await post('/api/auth/reset-password', null, {
    resetCode: reset.body.resetCode,
    newPassword: 'UpdatedSecurePassword123',
    confirmPassword: 'UpdatedSecurePassword123'
  })).status, 400);
  assert.equal((await request('/api/auth/me', { token })).status, 401);
  assert.equal((await post('/api/auth/login', null, {
    usernameOrEmail: playerId,
    gameCode: registration.body.user.gameCode,
    password: 'UpdatedSecurePassword123'
  })).status, 200);

  const leaderboard = await request('/api/leaderboard', { token });
  const rankedPlayer = leaderboard.body.leaderboard.find(entry => entry.playerId === playerId);
  assert.ok(rankedPlayer);
  assert.equal(rankedPlayer.correctAnswers, 1);
  assert.equal(rankedPlayer.totalScore, 135);
  assert.equal(rankedPlayer.gameCode, registration.body.user.gameCode);

  console.log('Platform features passed: registration, game codes, login, secure password reset, open levels, global timer, skip, matchsticks, admin authorization, and leaderboard.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  if (!cleanupPlayerId) return;
  const player = db.getUsers().find(user => user.playerId === cleanupPlayerId);
  if (!player) return;
  db.data.users = db.data.users.filter(user => user.id !== player.id);
  db.data.sessions = db.data.sessions.filter(session => session.userId !== player.id);
  db.data.gameSessions = db.data.gameSessions.filter(session => session.userId !== player.id);
  db.data.passwordResets = db.data.passwordResets.filter(reset => reset.userId !== player.id);
  db.save();
});
