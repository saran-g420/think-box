/**
 * Main Game State Engine & UI Coordinator
 * THINK OUTSIDE THE BOX — Progressive Brain Puzzle Game
 */

import { LEVELS } from './levels.js';
import { storage } from './storage.js';
import { sound } from './sound.js';
import { confetti } from './confetti.js';

// Import Puzzle Engines
import { NineDotPuzzle } from './puzzles/nineDot.js';
import { ThreeLinesPuzzle } from './puzzles/threeLines.js';
import { MinimalStarPuzzle } from './puzzles/minimalStar.js';
import { MatchstickPuzzle } from './puzzles/matchstick.js';
import { LimitedTurnsPuzzle } from './puzzles/limitedTurns.js';
import { SpatialShiftPuzzle } from './puzzles/spatialShift.js';
import { LateralSwitchesPuzzle } from './puzzles/lateralSwitches.js';
import { DotMatrixPuzzle } from './puzzles/dotMatrix.js';
import { LaserOpticsPuzzle } from './puzzles/laserOptics.js';
import { MasterVaultPuzzle } from './puzzles/masterVault.js';

export class GameManager {
  constructor() {
    this.currentLevelId = 1;
    this.currentPuzzleInstance = null;

    // Timer & Score
    this.timeLeft = 120;
    this.timerInterval = null;
    this.levelStartTime = 0;
    this.hintsRevealed = 0;

    this.init();
  }

  init() {
    // Sound preference
    sound.setMuted(storage.getMuted());
    this.updateSoundIcons();

    this.bindDomEvents();
    this.renderWelcomeStats();
    this.renderLevelsGrid();

    // Show Welcome Screen initially
    this.switchScreen('screen-welcome');
  }

  switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    if (screenId === 'screen-levels') {
      this.renderLevelsGrid();
    } else if (screenId === 'screen-welcome') {
      this.renderWelcomeStats();
    }
  }

  updateSoundIcons() {
    const isMuted = sound.isMuted();
    document.querySelectorAll('.sound-btn-icon').forEach(el => {
      el.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  toggleSound() {
    const muted = sound.toggleMute();
    storage.setMuted(muted);
    this.updateSoundIcons();
    if (!muted) sound.click();
  }

  bindDomEvents() {
    // Welcome Actions
    const playBtn = document.getElementById('btn-play-welcome');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        sound.click();
        const unlocked = storage.getUnlockedLevel();
        this.startLevel(unlocked);
      });
    }

    const levelsBtn = document.getElementById('btn-levels-welcome');
    if (levelsBtn) {
      levelsBtn.addEventListener('click', () => {
        sound.click();
        this.switchScreen('screen-levels');
      });
    }

    const howToPlayBtn = document.getElementById('btn-how-to-play');
    if (howToPlayBtn) {
      howToPlayBtn.addEventListener('click', () => {
        sound.click();
        document.getElementById('modal-how-to-play').classList.add('active');
      });
    }

    const closeHowToPlayBtn = document.getElementById('btn-close-how');
    if (closeHowToPlayBtn) {
      closeHowToPlayBtn.addEventListener('click', () => {
        sound.click();
        document.getElementById('modal-how-to-play').classList.remove('active');
      });
    }

    // Global sound toggles
    document.querySelectorAll('.btn-toggle-sound').forEach(btn => {
      btn.addEventListener('click', () => this.toggleSound());
    });

    // Back to Levels from Header & Sidebar
    const backBtn = document.getElementById('btn-back-levels');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        sound.click();
        this.stopTimer();
        this.switchScreen('screen-levels');
      });
    }

    // Header Toolbar Buttons
    const undoBtn = document.getElementById('btn-action-undo');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (this.currentPuzzleInstance && this.currentPuzzleInstance.undo) {
          this.currentPuzzleInstance.undo();
        }
      });
    }

    const clearBtn = document.getElementById('btn-action-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (this.currentPuzzleInstance && this.currentPuzzleInstance.clear) {
          this.currentPuzzleInstance.clear();
        }
      });
    }

    const submitBtn = document.getElementById('btn-action-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (this.currentPuzzleInstance && this.currentPuzzleInstance.validate) {
          this.currentPuzzleInstance.validate();
        }
      });
    }

    // Hint Button
    const hintBtn = document.getElementById('btn-request-hint');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.revealNextHint());
    }

    // Show Solution Button
    const solutionBtn = document.getElementById('btn-show-solution');
    if (solutionBtn) {
      solutionBtn.addEventListener('click', () => {
        if (confirm('Revealing the solution forfeits the bonus points for this attempt. Proceed?')) {
          sound.hint();
          if (this.currentPuzzleInstance && this.currentPuzzleInstance.showSolution) {
            this.currentPuzzleInstance.showSolution();
          }
        }
      });
    }

    // Success Modal Buttons
    const nextLevelBtn = document.getElementById('btn-success-next');
    if (nextLevelBtn) {
      nextLevelBtn.addEventListener('click', () => {
        sound.click();
        this.closeSuccessModal();
        if (this.currentLevelId < 10) {
          this.startLevel(this.currentLevelId + 1);
        } else {
          this.showBrainMasterScreen();
        }
      });
    }

    const retryLevelBtn = document.getElementById('btn-success-retry');
    if (retryLevelBtn) {
      retryLevelBtn.addEventListener('click', () => {
        sound.click();
        this.closeSuccessModal();
        this.startLevel(this.currentLevelId);
      });
    }

    const modalLevelsBtn = document.getElementById('btn-success-levels');
    if (modalLevelsBtn) {
      modalLevelsBtn.addEventListener('click', () => {
        sound.click();
        this.closeSuccessModal();
        this.switchScreen('screen-levels');
      });
    }

    // Brain Master Modal Play Again
    const replayAllBtn = document.getElementById('btn-brain-master-replay');
    if (replayAllBtn) {
      replayAllBtn.addEventListener('click', () => {
        sound.click();
        document.getElementById('modal-brain-master').classList.remove('active');
        this.startLevel(1);
      });
    }
  }

  renderWelcomeStats() {
    const totalScore = storage.getTotalScore();
    const completedCount = storage.getCompletedCount();
    const unlockedLevel = storage.getUnlockedLevel();

    const scoreEl = document.getElementById('welcome-stat-score');
    if (scoreEl) scoreEl.textContent = totalScore;

    const completedEl = document.getElementById('welcome-stat-completed');
    if (completedEl) completedEl.textContent = `${completedCount} / 10`;

    const rankEl = document.getElementById('welcome-stat-rank');
    if (rankEl) {
      if (completedCount >= 10) rankEl.textContent = 'Grandmaster';
      else if (completedCount >= 7) rankEl.textContent = 'Brain Master';
      else if (completedCount >= 4) rankEl.textContent = 'Lateral Thinker';
      else rankEl.textContent = 'Novice';
    }
  }

  renderLevelsGrid() {
    const unlocked = storage.getUnlockedLevel();
    const completedList = storage.memoryState.completedLevels || [];
    const container = document.getElementById('levels-grid-container');
    if (!container) return;

    // Calculate overall progress bar
    const totalDone = completedList.length;
    const pct = Math.round((totalDone / 10) * 100);
    const progressFill = document.getElementById('overall-progress-fill');
    if (progressFill) progressFill.style.width = `${pct}%`;
    const progressText = document.getElementById('overall-progress-text');
    if (progressText) progressText.textContent = `${totalDone} of 10 Solved (${pct}%)`;

    // Group by stages
    const stages = [
      { id: 1, name: 'Stage 1 — Warm-up', badge: 'Levels 1 - 3' },
      { id: 2, name: 'Stage 2 — Think Differently', badge: 'Levels 4 - 7' },
      { id: 3, name: 'Stage 3 — Brain Master', badge: 'Levels 8 - 10' }
    ];

    container.innerHTML = stages.map(stage => {
      const stageLevels = LEVELS.filter(l => l.stage === stage.id);
      return `
        <div class="stage-section">
          <div class="stage-title">
            <span>${stage.name}</span>
            <span class="stage-badge">${stage.badge}</span>
          </div>
          <div class="level-grid">
            ${stageLevels.map(lvl => {
              const isLocked = lvl.id > unlocked;
              const isCompleted = completedList.includes(lvl.id);
              const isCurrent = lvl.id === unlocked;
              const bestScore = storage.getLevelScore(lvl.id);
              const bestTime = storage.getLevelTime(lvl.id);

              let statusClass = 'locked';
              let statusText = 'Locked';
              if (isCompleted) {
                statusClass = 'completed';
                statusText = 'Completed';
              } else if (!isLocked) {
                statusClass = 'unlocked';
                statusText = 'Available';
              }

              return `
                <div class="level-card ${statusClass} ${isCurrent ? 'current' : ''}" data-level-id="${lvl.id}">
                  <div class="card-top">
                    <span class="card-number">Level ${lvl.id}</span>
                    <span class="card-status-badge status-${statusClass}">${statusText}</span>
                  </div>
                  <div class="card-title">${lvl.title}</div>
                  <div class="card-desc">${lvl.subtitle}</div>
                  <div class="card-footer">
                    <span>${lvl.difficulty}</span>
                    <span class="card-score">${isCompleted ? `★ ${bestScore} pts` : `${lvl.timeLimit}s`}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Card click event delegation
    container.querySelectorAll('.level-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-level-id'));
        if (storage.isLevelUnlocked(id)) {
          sound.click();
          this.startLevel(id);
        } else {
          sound.error();
          alert(`Level ${id} is locked! Complete Level ${id - 1} first.`);
        }
      });
    });
  }

  renderSidebarNav() {
    const list = document.getElementById('sidebar-levels-list');
    if (!list) return;

    const unlocked = storage.getUnlockedLevel();
    const completedList = storage.memoryState.completedLevels || [];

    list.innerHTML = LEVELS.map(lvl => {
      const isLocked = lvl.id > unlocked;
      const isCompleted = completedList.includes(lvl.id);
      const isActive = lvl.id === this.currentLevelId;

      let icon = '🔒';
      if (isCompleted) icon = '✅';
      else if (!isLocked) icon = '▶';

      return `
        <li class="nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}" data-nav-id="${lvl.id}">
          <div class="nav-item-left">
            <span class="nav-num">${lvl.id < 10 ? '0' + lvl.id : lvl.id}</span>
            <span>${lvl.title}</span>
          </div>
          <span>${icon}</span>
        </li>
      `;
    }).join('');

    list.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-nav-id'));
        if (storage.isLevelUnlocked(id) && id !== this.currentLevelId) {
          sound.click();
          this.startLevel(id);
        }
      });
    });
  }

  startLevel(levelId) {
    this.currentLevelId = levelId;
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) return;

    // Reset runtime stats
    this.hintsRevealed = 0;
    this.timeLeft = level.timeLimit || 120;
    this.levelStartTime = Date.now();

    this.switchScreen('screen-play');
    this.updateHeaderInfo(level);
    this.updateInstructionsPanel(level);
    this.renderSidebarNav();
    this.mountPuzzle(level);
    this.startTimer();
  }

  updateHeaderInfo(level) {
    const badge = document.getElementById('header-level-badge');
    if (badge) badge.textContent = `Level ${level.id} • ${level.stageName}`;

    const scoreBox = document.getElementById('header-live-score');
    if (scoreBox) scoreBox.textContent = `${storage.getTotalScore()} pts`;

    this.updateTimerDisplay();
  }

  updateInstructionsPanel(level) {
    const tag = document.getElementById('inst-level-tag');
    if (tag) tag.textContent = `${level.stageName} • Level ${level.id}`;

    const title = document.getElementById('inst-title');
    if (title) title.textContent = level.title;

    const obj = document.getElementById('inst-objective');
    if (obj) obj.textContent = level.objective;

    const rulesList = document.getElementById('inst-rules-list');
    if (rulesList) {
      rulesList.innerHTML = level.rules.map(r => `<li>${r}</li>`).join('');
    }

    const tip = document.getElementById('inst-tip-text');
    if (tip) tip.textContent = level.authorTip;

    // Reset hints container
    const hintsContainer = document.getElementById('hints-container');
    if (hintsContainer) hintsContainer.innerHTML = '';

    const hintBtn = document.getElementById('btn-request-hint');
    if (hintBtn) {
      hintBtn.style.display = 'inline-flex';
      hintBtn.innerHTML = `💡 Reveal Hint (1/${level.hints.length})`;
    }

    // Level 10 outside socket terminal
    const outsideSocket = document.getElementById('outside-terminal-slot');
    if (outsideSocket) {
      outsideSocket.style.display = level.id === 10 ? 'flex' : 'none';
    }
  }

  revealNextHint() {
    const level = LEVELS.find(l => l.id === this.currentLevelId);
    if (!level || !level.hints) return;

    if (this.hintsRevealed < level.hints.length) {
      const hintText = level.hints[this.hintsRevealed];
      this.hintsRevealed++;
      sound.hint();

      const hintsContainer = document.getElementById('hints-container');
      if (hintsContainer) {
        const bubble = document.createElement('div');
        bubble.className = 'hint-bubble';
        bubble.innerHTML = `
          <div class="hint-num">Hint ${this.hintsRevealed}</div>
          <div>${hintText}</div>
        `;
        hintsContainer.appendChild(bubble);
      }

      const hintBtn = document.getElementById('btn-request-hint');
      if (hintBtn) {
        if (this.hintsRevealed >= level.hints.length) {
          hintBtn.style.display = 'none';
        } else {
          hintBtn.innerHTML = `💡 Reveal Hint (${this.hintsRevealed + 1}/${level.hints.length})`;
        }
      }

      this.showStatusFeedback(`Hint ${this.hintsRevealed} revealed (-10 pts)`, 'info');
    }
  }

  mountPuzzle(level) {
    if (this.currentPuzzleInstance && this.currentPuzzleInstance.destroy) {
      this.currentPuzzleInstance.destroy();
    }

    const mount = document.getElementById('puzzle-mount');
    if (!mount) return;
    mount.innerHTML = '';

    const callbacks = {
      onSuccess: (meta) => this.handleLevelComplete(meta),
      onError: (msg) => this.showStatusFeedback(msg, 'error'),
      onFeedback: (msg, type) => this.showStatusFeedback(msg, type),
      onStateChange: (state) => this.handlePuzzleState(state)
    };

    switch (level.type) {
      case 'nine-dot':
        this.currentPuzzleInstance = new NineDotPuzzle(mount, callbacks);
        break;
      case 'three-lines':
        this.currentPuzzleInstance = new ThreeLinesPuzzle(mount, callbacks);
        break;
      case 'minimal-star':
        this.currentPuzzleInstance = new MinimalStarPuzzle(mount, callbacks);
        break;
      case 'matchstick':
        this.currentPuzzleInstance = new MatchstickPuzzle(mount, callbacks);
        break;
      case 'limited-turns':
        this.currentPuzzleInstance = new LimitedTurnsPuzzle(mount, callbacks);
        break;
      case 'spatial-shift':
        this.currentPuzzleInstance = new SpatialShiftPuzzle(mount, callbacks);
        break;
      case 'lateral-switches':
        this.currentPuzzleInstance = new LateralSwitchesPuzzle(mount, callbacks);
        break;
      case 'dot-matrix':
        this.currentPuzzleInstance = new DotMatrixPuzzle(mount, callbacks);
        break;
      case 'laser-optics':
        this.currentPuzzleInstance = new LaserOpticsPuzzle(mount, callbacks);
        break;
      case 'master-vault':
        this.currentPuzzleInstance = new MasterVaultPuzzle(mount, callbacks);
        break;
      default:
        mount.innerHTML = `<div>Puzzle type ${level.type} not found</div>`;
    }
  }

  handlePuzzleState(state) {
    // Optional live metrics update in toolbar
  }

  showStatusFeedback(message, type = 'info') {
    const bar = document.getElementById('status-feedback-bar');
    if (!bar) return;

    bar.textContent = message;
    bar.className = `status-feedback-bar show ${type}`;

    if (this._feedbackTimeout) clearTimeout(this._feedbackTimeout);
    this._feedbackTimeout = setTimeout(() => {
      bar.classList.remove('show');
    }, 4500);
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        this.stopTimer();
        sound.error();
        this.showStatusFeedback('Time is up! Click Retry to try again for maximum score.', 'error');
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerBox = document.getElementById('timer-display');
    if (!timerBox) return;

    const mins = Math.floor(Math.max(0, this.timeLeft) / 60);
    const secs = Math.max(0, this.timeLeft) % 60;
    timerBox.textContent = `⏱ ${mins}:${secs < 10 ? '0' : ''}${secs}`;

    if (this.timeLeft <= 20) {
      timerBox.classList.add('timer-warning');
    } else {
      timerBox.classList.remove('timer-warning');
    }
  }

  handleLevelComplete(meta = {}) {
    this.stopTimer();
    const timeTaken = Math.round((Date.now() - this.levelStartTime) / 1000);

    // Scoring Rules:
    // Base: 100
    // No hints used: +25
    // Completed within target time (with >= 30s remaining): +20
    // Deduct 10 points per hint used
    const basePoints = 100;
    const noHintsBonus = this.hintsRevealed === 0 ? 25 : 0;
    const timeBonus = this.timeLeft >= 30 ? 20 : 0;
    const hintsPenalty = this.hintsRevealed * 10;

    const levelScore = Math.max(0, basePoints + noHintsBonus + timeBonus - hintsPenalty);

    // Save
    storage.saveLevelCompletion(this.currentLevelId, levelScore, timeTaken);

    // Celebration
    confetti.fire(120);

    // Render Success Modal
    this.showSuccessModal({
      levelId: this.currentLevelId,
      levelTitle: LEVELS.find(l => l.id === this.currentLevelId)?.title || '',
      score: levelScore,
      basePoints,
      noHintsBonus,
      timeBonus,
      hintsPenalty,
      timeTaken,
      hintsUsed: this.hintsRevealed,
      totalScore: storage.getTotalScore(),
      isGrandmaster: meta.grandmaster || this.currentLevelId === 10
    });
  }

  showSuccessModal(data) {
    const modal = document.getElementById('modal-success');
    if (!modal) return;

    document.getElementById('modal-level-title').textContent = `Level ${data.levelId}: ${data.levelTitle}`;
    document.getElementById('score-row-base').textContent = `+${data.basePoints}`;
    document.getElementById('score-row-hints-bonus').textContent = `+${data.noHintsBonus}`;
    document.getElementById('score-row-time-bonus').textContent = `+${data.timeBonus}`;
    document.getElementById('score-row-penalty').textContent = `-${data.hintsPenalty}`;
    document.getElementById('score-row-total').textContent = `${data.score} pts`;
    document.getElementById('modal-stat-time').textContent = `${data.timeTaken}s`;
    document.getElementById('modal-stat-hints').textContent = `${data.hintsUsed}`;
    document.getElementById('modal-stat-total').textContent = `${data.totalScore} pts`;

    // Next button label
    const nextBtn = document.getElementById('btn-success-next');
    if (nextBtn) {
      if (data.levelId >= 10) {
        nextBtn.innerHTML = '🏆 Claim Grandmaster Title';
      } else {
        nextBtn.innerHTML = `Next: Level ${data.levelId + 1} ➔`;
      }
    }

    modal.classList.add('active');
  }

  closeSuccessModal() {
    const modal = document.getElementById('modal-success');
    if (modal) modal.classList.remove('active');
  }

  showBrainMasterScreen() {
    this.closeSuccessModal();
    const modal = document.getElementById('modal-brain-master');
    if (!modal) return;

    sound.victory();
    confetti.fire(200);

    const totalScore = storage.getTotalScore();
    document.getElementById('master-final-score').textContent = `${totalScore} Points`;
    modal.classList.add('active');
  }
}

// Bootstrap on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameManager();
});
