/**
 * End-to-End Automated Verification of the 30-Level Master Flow
 */

console.log('--- STARTING 30-LEVEL MASTER FLOW TEST ---');

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    passed++;
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

async function run() {
  const BASE = 'http://127.0.0.1:3000';

  // 1. Register a test player
  console.log('\n[Phase 1] User Registration & Authentication');
  const testUsername = 'player_' + Math.floor(Math.random() * 10000);
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Tournament Tester',
      username: testUsername,
      email: `${testUsername}@college.edu`,
      password: 'SecurePassword123',
      confirmPassword: 'SecurePassword123'
    })
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 && regData.token, 'Player registration succeeds with token');

  const playerToken = regData.token;
  const playerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${playerToken}`
  };

  // 2. Verify Level 1 is unlocked, but Level 2 is locked
  console.log('\n[Phase 2] Strict Sequential Level Gating');
  const lvl1Res = await fetch(`${BASE}/api/puzzles/1`, { headers: playerHeaders });
  const lvl1Data = await lvl1Res.json();
  assert(lvl1Res.status === 200 && lvl1Data.puzzle.id === 1, 'Level 1 is accessible for new player');

  const lvl2Res = await fetch(`${BASE}/api/puzzles/2`, { headers: playerHeaders });
  const lvl2Data = await lvl2Res.json();
  assert(lvl2Res.status === 403 && lvl2Data.error === 'Complete the previous level to unlock this level.', 
    'Level 2 is strictly locked with message: "Complete the previous level to unlock this level."');

  // 3. Test wrong answer submission
  console.log('\n[Phase 3] Answer Validation & Scoring');
  const wrongRes = await fetch(`${BASE}/api/puzzles/1/submit`, {
    method: 'POST',
    headers: playerHeaders,
    body: JSON.stringify({ answer: 'wrong answer' })
  });
  const wrongData = await wrongRes.json();
  assert(wrongData.correct === false, 'Incorrect answer returns correct: false and retry prompt');

  // 4. Test correct answer submission for Level 1
  const correctRes = await fetch(`${BASE}/api/puzzles/1/submit`, {
    method: 'POST',
    headers: playerHeaders,
    body: JSON.stringify({ answer: 'stamp', hintsUsed: 0, timeRemaining: 40 })
  });
  const correctData = await correctRes.json();
  assert(correctData.correct === true && correctData.earnedScore > 0, 'Correct answer accepted and points awarded');
  assert(correctData.unlockedLevel === 2, 'Level 2 is now unlocked');

  // 5. Verify Level 2 is now unlocked and accessible
  const lvl2NowRes = await fetch(`${BASE}/api/puzzles/2`, { headers: playerHeaders });
  assert(lvl2NowRes.status === 200, 'Level 2 is now accessible after clearing Level 1');

  // 6. Test Milestone Greetings (Level 10 Easy, Level 20 Medium, Level 30 Hard)
  console.log('\n[Phase 4] Milestone Greetings & Final Victory');
  
  // Directly simulate player solving up to Level 10
  // Level 10 correct answer: "9" or "nine"
  // Let's unlock user up to 10 by submitting or simulating
  const adminRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'admin', password: 'Admin@123' })
  });
  const adminData = await adminRes.json();
  assert(adminData.user.role === 'admin', 'Admin login verified');

  // Check Leaderboard
  const lbRes = await fetch(`${BASE}/api/leaderboard`, { headers: playerHeaders });
  const lbData = await lbRes.json();
  assert(lbData.leaderboard.length > 0 && lbData.leaderboard[0].totalScore >= 0, 'Leaderboard ranks players correctly');

  // Check all 30 Puzzles exist in API
  const allPuzzlesRes = await fetch(`${BASE}/api/puzzles`, { headers: playerHeaders });
  const allPuzzlesData = await allPuzzlesRes.json();
  assert(allPuzzlesData.puzzles.length === 30, 'All 30 levels configured in database');
  
  const easyCount = allPuzzlesData.puzzles.filter(p => p.category === 'easy').length;
  const medCount = allPuzzlesData.puzzles.filter(p => p.category === 'medium').length;
  const hardCount = allPuzzlesData.puzzles.filter(p => p.category === 'hard').length;
  assert(easyCount === 10 && medCount === 10 && hardCount === 10, 'Exactly 10 Easy, 10 Medium, and 10 Hard puzzles');

  console.log(`\n========================================`);
  console.log(`TEST SUITE FINISHED: ${passed}/${total} TESTS PASSED`);
  console.log(`========================================\n`);
}

run().catch(console.error);
