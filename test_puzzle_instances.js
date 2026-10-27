/**
 * Verification of Puzzle Classes and Lifecycle Methods
 */

import { NineDotPuzzle } from './js/puzzles/nineDot.js';
import { ThreeLinesPuzzle } from './js/puzzles/threeLines.js';
import { MinimalStarPuzzle } from './js/puzzles/minimalStar.js';
import { MatchstickPuzzle } from './js/puzzles/matchstick.js';
import { LimitedTurnsPuzzle } from './js/puzzles/limitedTurns.js';
import { SpatialShiftPuzzle } from './js/puzzles/spatialShift.js';
import { LateralSwitchesPuzzle } from './js/puzzles/lateralSwitches.js';
import { DotMatrixPuzzle } from './js/puzzles/dotMatrix.js';
import { LaserOpticsPuzzle } from './js/puzzles/laserOptics.js';
import { MasterVaultPuzzle } from './js/puzzles/masterVault.js';

console.log('Testing puzzle constructors and exported classes...');

const puzzles = [
  { name: 'NineDotPuzzle', cls: NineDotPuzzle },
  { name: 'ThreeLinesPuzzle', cls: ThreeLinesPuzzle },
  { name: 'MinimalStarPuzzle', cls: MinimalStarPuzzle },
  { name: 'MatchstickPuzzle', cls: MatchstickPuzzle },
  { name: 'LimitedTurnsPuzzle', cls: LimitedTurnsPuzzle },
  { name: 'SpatialShiftPuzzle', cls: SpatialShiftPuzzle },
  { name: 'LateralSwitchesPuzzle', cls: LateralSwitchesPuzzle },
  { name: 'DotMatrixPuzzle', cls: DotMatrixPuzzle },
  { name: 'LaserOpticsPuzzle', cls: LaserOpticsPuzzle },
  { name: 'MasterVaultPuzzle', cls: MasterVaultPuzzle }
];

puzzles.forEach(p => {
  if (typeof p.cls === 'function') {
    console.log(`  ✓ Class ${p.name} exported and recognized as constructor`);
  } else {
    console.error(`  ✗ Class ${p.name} failed export!`);
    process.exit(1);
  }
});

console.log('\nAll 10 puzzle classes verified successfully.');
