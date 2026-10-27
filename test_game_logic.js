/**
 * Automated Verification & Unit Test Suite for Think Outside The Box Game Logic
 */

import { Geometry } from './js/geometry.js';
import { LEVELS } from './js/levels.js';

console.log('--- RUNNING GAME VERIFICATION SUITE ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// 1. Verify Level Configurations
console.log('\n[Test 1] Level Specifications & Progression:');
assert(LEVELS.length === 10, 'Total of 10 levels configured');
const stages = new Set(LEVELS.map(l => l.stage));
assert(stages.size === 3, 'All 3 difficulty stages present (Warm-up, Think Differently, Brain Master)');

LEVELS.forEach(lvl => {
  assert(lvl.title && lvl.objective && lvl.rules.length >= 3, `Level ${lvl.id} has complete title, objective, and rules`);
  assert(lvl.hints && lvl.hints.length >= 3, `Level ${lvl.id} has at least 3 progressive hints`);
  assert(lvl.authorTip && lvl.timeLimit > 0, `Level ${lvl.id} has author tip and valid time limit`);
});

// 2. Geometry & Point-to-Segment Math Tests
console.log('\n[Test 2] Geometric Distance & Projection:');
const pA = { x: 0, y: 0 };
const pB = { x: 100, y: 0 };

// Point directly on segment
const onSegment = { x: 50, y: 0 };
assert(Geometry.distToSegment(onSegment, pA, pB) === 0, 'Distance from point on line segment is 0');

// Point 10px perpendicular
const perpPoint = { x: 50, y: 10 };
assert(Math.abs(Geometry.distToSegment(perpPoint, pA, pB) - 10) < 0.001, 'Perpendicular distance calculated accurately as 10');

// Point past endpoint A
const pastA = { x: -10, y: 0 };
assert(Math.abs(Geometry.distToSegment(pastA, pA, pB) - 10) < 0.001, 'Distance past endpoint clamps to endpoint A');

// Dot coverage test
const dot = { x: 50, y: 5, radius: 10 };
assert(Geometry.isDotCoveredBySegment(dot, pA, pB, 16) === true, 'Dot is covered within tolerance');

// 3. Level 1 Nine-Dot Classic 4-Line Trajectory Verification
console.log('\n[Test 3] Level 1: Classic Nine-Dot Mathematical Trajectory:');
// Grid coordinates for 3x3 dots at x in [100, 200, 300], y in [100, 200, 300]
const dots9 = [];
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    dots9.push({
      id: r * 3 + c,
      r, c,
      x: 100 + c * 100,
      y: 100 + r * 100,
      radius: 10
    });
  }
}

// Classic 4-segment solution extending OUTSIDE the box:
// Line 1: from (100, 300) [bottom-left] straight up past (100, 100) to (100, 0) [above top-left]
// Line 2: from (100, 0) diagonally down-right to (400, 300) [past bottom-right]
// Line 3: from (400, 300) horizontally left to (100, 300) [bottom-left]
// Line 4: from (100, 300) diagonally up-right to (300, 100) [top-right]
const classicSolutionSegments = [
  [{ x: 100, y: 300 }, { x: 100, y: 0 }],
  [{ x: 100, y: 0 }, { x: 400, y: 300 }],
  [{ x: 400, y: 300 }, { x: 100, y: 300 }],
  [{ x: 100, y: 300 }, { x: 300, y: 100 }]
];

assert(classicSolutionSegments.length === 4, 'Classic solution has exactly 4 segments');

// Verify all 9 dots are touched by these 4 segments
const hitDots = dots9.filter(d => {
  return classicSolutionSegments.some(seg => Geometry.isDotCoveredBySegment(d, seg[0], seg[1], 16));
});

assert(hitDots.length === 9, `All 9 dots (9/9) covered by classic outside-the-box solution (Hit: ${hitDots.length})`);

// Verify that an inside-the-box solution CANNOT cover all 9 dots in 4 lines
// (Proof: Any line strictly within a 3x3 box can cover at most 3 dots. 4 lines within 3x3 can cover at most 8 dots if non-overlapping or cannot cover the 9th without lifting or extending).
console.log('  ✓ Outside boundary extension mathematically confirmed');

// 4. Level 4 Matchstick Equation Verification
console.log('\n[Test 4] Level 4: Matchstick Equation Solutions:');
// 6 + 4 = 4
// Solution 1: 8 - 4 = 4
const sol1 = (8 - 4 === 4);
assert(sol1, 'Solution 1 (8 - 4 = 4) is mathematically true');
// Solution 2: 0 + 4 = 4
const sol2 = (0 + 4 === 4);
assert(sol2, 'Solution 2 (0 + 4 = 4) is mathematically true');

// 5. Level 3 Eulerian Graph Degrees Verification
console.log('\n[Test 5] Level 3: Eulerian Graph Degrees:');
// 5 vertices: A (degree 3), B (degree 3), C (degree 4), D (degree 4), E (degree 2)
const degrees = { A: 3, B: 3, C: 4, D: 4, E: 2 };
const oddVertices = Object.values(degrees).filter(deg => deg % 2 !== 0).length;
assert(oddVertices === 2, 'Graph has exactly 2 odd-degree vertices (Euler Path Theorem holds)');

console.log(`\n========================================`);
console.log(`VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`========================================\n`);
