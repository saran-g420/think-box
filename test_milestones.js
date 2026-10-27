/**
 * Direct Milestone Greeting Trigger Test
 */

const BASE = process.env.TEST_BASE || 'http://127.0.0.1:3000';

async function testMilestones() {
  console.log('Testing milestone greetings for Level 10, 20, and 30...');

  // 1. Create a dedicated milestone tester user
  const username = 'milestone_' + Date.now();
  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Milestone Champion',
      username,
      email: `${username}@test.com`,
      password: 'Password123',
      confirmPassword: 'Password123'
    })
  });
  const { token, user } = await reg.json();

  // Load db module directly to set unlocked levels for fast test
  const { db } = await import('./server/db.js');

  // Test Level 10
  db.updateUser(user.id, { unlockedLevel: 10, completedLevels: [1,2,3,4,5,6,7,8,9] });
  const res10 = await fetch(`${BASE}/api/puzzles/10/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ answer: '9' })
  });
  const data10 = await res10.json();
  console.log('Level 10 greeting:', data10.greeting);
  if (data10.greeting !== 'Congratulations! You have successfully completed all Easy Levels!') {
    throw new Error('Level 10 greeting mismatch!');
  }

  // Test Level 20
  db.updateUser(user.id, { unlockedLevel: 20, completedLevels: Array.from({length: 19}, (_, i) => i + 1) });
  const res20 = await fetch(`${BASE}/api/puzzles/20/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ answer: 'map' })
  });
  const data20 = await res20.json();
  console.log('Level 20 greeting:', data20.greeting);
  if (data20.greeting !== 'Amazing! You have successfully completed all Medium Levels!') {
    throw new Error('Level 20 greeting mismatch!');
  }

  // Test Level 30
  db.updateUser(user.id, { unlockedLevel: 30, completedLevels: Array.from({length: 29}, (_, i) => i + 1) });
  const res30 = await fetch(`${BASE}/api/puzzles/30/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ answer: 'echo' })
  });
  const data30 = await res30.json();
  console.log('Level 30 greeting:', data30.greeting);
  if (data30.greeting !== 'LEGENDARY ACHIEVEMENT! You have completed all 30 levels of Think Outside the Box!') {
    throw new Error('Level 30 victory greeting mismatch!');
  }

  console.log('All 3 milestone greetings verified with 100% precision!');
  db.getUsers();
  db.data.users = db.data.users.filter(existingUser => existingUser.id !== user.id);
  db.data.sessions = db.data.sessions.filter(session => session.userId !== user.id);
  db.data.gameSessions = db.data.gameSessions.filter(session => session.userId !== user.id);
  db.data.passwordResets = db.data.passwordResets.filter(reset => reset.userId !== user.id);
  db.save();
}

testMilestones().catch(console.error);
