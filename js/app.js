/**
 * Think Outside The Box - Master Client Application
 * Handles Auth, Dashboard, 30-Level Progression, Gameplay, Scoreboard, and Admin Portal
 */

import { sound } from './sound.js';
import { confetti } from './confetti.js';

class App {
  constructor() {
    this.token = localStorage.getItem('totb_token') || null;
    this.user = null;
    this.puzzles = [];
    this.settings = {};

    // Active Arena State
    this.activePuzzle = null;
    this.timerInterval = null;
    this.timeRemaining = 0;
    this.hintsUsed = 0;

    this.init();
  }

  async init() {
    this.bindEvents();
    if (this.token) {
      await this.loadUserProfile();
    } else {
      this.showView('landing');
    }
  }

  // --- API Helper ---
  async api(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      this.toast(err.message, 'error');
      throw err;
    }
  }

  // --- Toast Notification ---
  toast(message, type = 'info') {
    const toastEl = document.getElementById('app-toast');
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = `show ${type}`;

    if (this._toastTimeout) clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toastEl.className = '';
    }, 4000);
  }

  // --- View Routing ---
  showView(viewName) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    const navBtn = document.getElementById(`nav-btn-${viewName}`);
    if (navBtn) navBtn.classList.add('active');

    if (viewName === 'dashboard') this.loadDashboard();
    if (viewName === 'scoreboard') this.loadScoreboard();
    if (viewName === 'admin') this.loadAdminPortal();
  }

  // --- User Profile & Session ---
  async loadUserProfile() {
    try {
      const data = await this.api('/api/auth/me');
      this.user = data.user;
      this.updateNavUser();

      if (this.user.mustChangePassword) {
        document.getElementById('modal-force-change-pw').classList.add('active');
        return;
      }

      this.showView('dashboard');
    } catch (e) {
      this.logout(false);
    }
  }

  updateNavUser() {
    const guestActions = document.getElementById('nav-guest-actions');
    const userActions = document.getElementById('nav-user-actions');
    const dashBtn = document.getElementById('nav-btn-dashboard');
    const adminBtn = document.getElementById('nav-btn-admin');

    if (this.user) {
      guestActions.style.display = 'none';
      userActions.style.display = 'flex';
      dashBtn.style.display = 'inline-flex';

      document.getElementById('nav-username-label').textContent = this.user.username;
      document.getElementById('nav-score-label').textContent = this.user.totalScore || 0;

      if (this.user.role === 'admin') {
        adminBtn.style.display = 'inline-flex';
      } else {
        adminBtn.style.display = 'none';
      }
    } else {
      guestActions.style.display = 'flex';
      userActions.style.display = 'none';
      dashBtn.style.display = 'none';
      adminBtn.style.display = 'none';
    }
  }

  logout(showToast = true) {
    if (this.token) {
      this.api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
    this.token = null;
    this.user = null;
    localStorage.removeItem('totb_token');
    this.updateNavUser();
    this.showView('landing');
    if (showToast) this.toast('Signed out successfully.', 'info');
  }

  // --- Event Bindings ---
  bindEvents() {
    // Nav Navigation
    document.getElementById('nav-brand-home').onclick = () => {
      sound.click();
      this.showView(this.user ? 'dashboard' : 'landing');
    };
    document.getElementById('nav-btn-dashboard').onclick = () => {
      sound.click();
      this.showView('dashboard');
    };
    document.getElementById('nav-btn-scoreboard').onclick = () => {
      sound.click();
      this.showView('scoreboard');
    };
    document.getElementById('nav-btn-admin').onclick = () => {
      sound.click();
      this.showView('admin');
    };
    document.getElementById('btn-nav-logout').onclick = () => {
      sound.click();
      this.logout();
    };

    // Sound Toggle
    const soundBtn = document.getElementById('nav-btn-sound');
    soundBtn.onclick = () => {
      const isMuted = sound.toggleMute();
      document.getElementById('sound-icon').textContent = isMuted ? '🔇' : '🔊';
      if (!isMuted) sound.click();
    };

    // Hero buttons
    document.getElementById('btn-hero-play').onclick = () => {
      sound.click();
      if (this.user) this.showView('dashboard');
      else document.getElementById('modal-auth').classList.add('active');
    };
    document.getElementById('btn-hero-scoreboard').onclick = () => {
      sound.click();
      this.showView('scoreboard');
    };

    // Auth Modal Triggers & Form Toggles
    document.getElementById('btn-open-login').onclick = () => {
      sound.click();
      document.getElementById('modal-auth').classList.add('active');
      this.toggleAuthForm('login');
    };
    document.getElementById('btn-close-auth').onclick = () => {
      sound.click();
      document.getElementById('modal-auth').classList.remove('active');
    };
    document.getElementById('link-to-register').onclick = (e) => {
      e.preventDefault();
      this.toggleAuthForm('register');
    };
    document.getElementById('link-to-login').onclick = (e) => {
      e.preventDefault();
      this.toggleAuthForm('login');
    };

    // Login Form Submit
    document.getElementById('form-login').onsubmit = async (e) => {
      e.preventDefault();
      sound.click();
      const usernameOrEmail = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await this.api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ usernameOrEmail, password })
        });
        this.token = res.token;
        this.user = res.user;
        localStorage.setItem('totb_token', this.token);
        document.getElementById('modal-auth').classList.remove('active');
        this.toast(`Welcome back, ${this.user.username}!`, 'success');
        this.updateNavUser();

        if (this.user.mustChangePassword) {
          document.getElementById('modal-force-change-pw').classList.add('active');
        } else {
          this.showView('dashboard');
        }
      } catch (err) {}
    };

    // Register Form Submit
    document.getElementById('form-register').onsubmit = async (e) => {
      e.preventDefault();
      sound.click();
      const fullName = document.getElementById('reg-fullname').value;
      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;

      try {
        const res = await this.api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ fullName, username, email, password, confirmPassword })
        });
        this.token = res.token;
        this.user = res.user;
        localStorage.setItem('totb_token', this.token);
        document.getElementById('modal-auth').classList.remove('active');
        this.toast('Account registered! Starting Level 1.', 'success');
        this.updateNavUser();
        this.showView('dashboard');
      } catch (err) {}
    };

    // Forgot Password Flow
    document.getElementById('link-forgot-pw').onclick = (e) => {
      e.preventDefault();
      document.getElementById('modal-auth').classList.remove('active');
      document.getElementById('modal-forgot-password').classList.add('active');
    };
    document.getElementById('btn-cancel-forgot').onclick = () => {
      document.getElementById('modal-forgot-password').classList.remove('active');
    };
    document.getElementById('btn-submit-forgot').onclick = async () => {
      sound.click();
      const val = document.getElementById('forgot-username-input').value;
      if (!val) return this.toast('Please enter your username or email', 'error');
      await this.api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail: val })
      });
      document.getElementById('modal-forgot-password').classList.remove('active');
      this.toast('Reset request submitted to the administrator.', 'info');
    };

    // Force Change Password Submit
    document.getElementById('btn-submit-force-pw').onclick = async () => {
      sound.click();
      const newPassword = document.getElementById('force-new-pw').value;
      const confirmPassword = document.getElementById('force-confirm-pw').value;
      try {
        await this.api('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ newPassword, confirmPassword })
        });
        document.getElementById('modal-force-change-pw').classList.remove('active');
        this.toast('Password updated successfully! Welcome to your dashboard.', 'success');
        this.showView('dashboard');
      } catch (e) {}
    };

    // Dashboard Continue Button
    document.getElementById('btn-dash-continue').onclick = () => {
      sound.click();
      const currentLevel = this.user ? this.user.unlockedLevel : 1;
      this.openPuzzle(currentLevel);
    };

    // Category Filter Tabs
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.onclick = (e) => {
        sound.click();
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const cat = e.currentTarget.getAttribute('data-cat');
        this.renderDashboardGrid(cat);
      };
    });

    // Arena Controls
    document.getElementById('btn-arena-back').onclick = () => {
      sound.click();
      this.stopTimer();
      this.showView('dashboard');
    };
    document.getElementById('btn-arena-submit').onclick = () => this.submitAnswer();
    document.getElementById('arena-answer-input').onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submitAnswer();
      }
    };
    document.getElementById('btn-arena-hint').onclick = () => this.revealHint();

    // Milestone Modal Action Buttons
    document.getElementById('btn-continue-to-medium').onclick = () => {
      sound.click();
      document.getElementById('modal-milestone-easy').classList.remove('active');
      this.openPuzzle(11);
    };
    document.getElementById('btn-continue-to-hard').onclick = () => {
      sound.click();
      document.getElementById('modal-milestone-medium').classList.remove('active');
      this.openPuzzle(21);
    };
    document.getElementById('btn-victory-replay').onclick = () => {
      sound.click();
      document.getElementById('modal-milestone-hard').classList.remove('active');
      this.openPuzzle(1);
    };
    document.getElementById('btn-victory-scoreboard').onclick = () => {
      sound.click();
      document.getElementById('modal-milestone-hard').classList.remove('active');
      this.showView('scoreboard');
    };

    // Admin Tabs & Controls
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        sound.click();
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-subpanel').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const panelId = e.currentTarget.getAttribute('data-panel');
        document.getElementById(`admin-panel-${panelId}`)?.classList.add('active');
      };
    });
    document.getElementById('btn-admin-exit').onclick = () => this.showView('dashboard');
    this.bindAdminControls();
  }

  toggleAuthForm(formType) {
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-register');
    const title = document.getElementById('auth-modal-title');

    if (formType === 'register') {
      loginForm.style.display = 'none';
      regForm.style.display = 'flex';
      title.textContent = 'Create Player Account';
    } else {
      loginForm.style.display = 'flex';
      regForm.style.display = 'none';
      title.textContent = 'Sign In';
    }
  }

  // =========================================================================
  // DASHBOARD LOGIC
  // =========================================================================

  async loadDashboard() {
    if (!this.user) return this.showView('landing');

    // Refresh user state
    await this.loadUserProfileSummary();

    const data = await this.api('/api/puzzles');
    this.puzzles = data.puzzles;
    this.settings = data.settings;

    // Render Stats
    document.getElementById('dash-greeting').textContent = `Welcome back, ${this.user.fullName}!`;
    document.getElementById('stat-total-score').textContent = `${this.user.totalScore || 0} pts`;
    document.getElementById('stat-completed-count').textContent = `${(this.user.completedLevels || []).length} / 30`;
    document.getElementById('stat-unlocked-level').textContent = `Level ${this.user.unlockedLevel}`;
    const pct = Math.round(((this.user.completedLevels || []).length / 30) * 100);
    document.getElementById('stat-progress-pct').textContent = `${pct}%`;

    const nextLvl = this.user.unlockedLevel;
    document.getElementById('btn-dash-continue').innerHTML = `<span>▶</span> Continue Level ${nextLvl}`;

    this.renderDashboardGrid('all');
  }

  async loadUserProfileSummary() {
    try {
      const data = await this.api('/api/auth/me');
      this.user = data.user;
      this.updateNavUser();
    } catch (e) {}
  }

  renderDashboardGrid(categoryFilter = 'all') {
    const grid = document.getElementById('dashboard-levels-grid');
    if (!grid) return;

    let filtered = this.puzzles;
    if (categoryFilter !== 'all') {
      filtered = this.puzzles.filter(p => p.category === categoryFilter);
    }

    grid.innerHTML = filtered.map(p => {
      const isLocked = !p.isUnlocked;
      const isCompleted = p.isCompleted;
      const isCurrent = p.id === this.user.unlockedLevel;

      let statusBadge = '<span class="tile-badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted);">🔒 Locked</span>';
      if (isCompleted) {
        statusBadge = '<span class="tile-badge" style="background: rgba(16,185,129,0.2); color: #6ee7b7;">✓ Done</span>';
      } else if (!isLocked) {
        statusBadge = '<span class="tile-badge" style="background: rgba(139,92,246,0.2); color: #c4b5fd;">Play</span>';
      }

      let diffColor = 'var(--accent-cyan)';
      if (p.category === 'medium') diffColor = 'var(--accent-amber)';
      if (p.category === 'hard') diffColor = 'var(--accent-rose)';

      return `
        <div class="level-tile ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current-active' : ''}" data-lvl="${p.id}">
          <div class="tile-top">
            <span class="tile-number">Level ${p.id}</span>
            ${statusBadge}
          </div>
          <div class="tile-title">${p.title}</div>
          <div class="tile-footer">
            <span style="color: ${diffColor}; font-weight: 700; text-transform: uppercase;">${p.category}</span>
            <span style="font-weight: 700; color: var(--accent-amber);">${isCompleted ? `★ ${p.score} pts` : `★ ${p.points} pts`}</span>
          </div>
        </div>
      `;
    }).join('');

    // Click handler for 30 level tiles
    grid.querySelectorAll('.level-tile').forEach(tile => {
      tile.onclick = (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-lvl'));
        if (id > this.user.unlockedLevel) {
          sound.error();
          // Exact required prompt requirement
          this.toast('Complete the previous level to unlock this level.', 'error');
        } else {
          sound.click();
          this.openPuzzle(id);
        }
      };
    });
  }

  // =========================================================================
  // PUZZLE ARENA LOGIC
  // =========================================================================

  async openPuzzle(levelId) {
    try {
      const data = await this.api(`/api/puzzles/${levelId}`);
      this.activePuzzle = data.puzzle;
      this.hintsUsed = 0;
      this.timeRemaining = this.activePuzzle.timeLimit || 90;

      this.showView('arena');
      this.renderArena();
      this.startTimer();
    } catch (err) {
      // Forbidden error handled by toast in this.api()
    }
  }

  renderArena() {
    const p = this.activePuzzle;
    const catUpper = p.category.toUpperCase();

    document.getElementById('arena-category-badge').textContent = `${catUpper} MODE • LEVEL ${p.id}`;
    document.getElementById('arena-puzzle-title').textContent = p.title;
    document.getElementById('arena-points-chip').textContent = `★ ${p.points} pts`;
    document.getElementById('arena-question-text').textContent = p.question;

    const input = document.getElementById('arena-answer-input');
    input.value = '';
    input.focus();

    // Hints Reset
    const hintsCont = document.getElementById('arena-hints-container');
    hintsCont.innerHTML = '';
    const hintBtn = document.getElementById('btn-arena-hint');
    if (p.hints && p.hints.length > 0) {
      hintBtn.style.display = 'inline-flex';
      hintBtn.textContent = `💡 Reveal Hint (1/${p.hints.length})`;
    } else {
      hintBtn.style.display = 'none';
    }
  }

  revealHint() {
    const p = this.activePuzzle;
    if (!p || !p.hints || this.hintsUsed >= p.hints.length) return;

    sound.hint();
    const hintText = p.hints[this.hintsUsed];
    this.hintsUsed++;

    const hintsCont = document.getElementById('arena-hints-container');
    const hintEl = document.createElement('div');
    hintEl.className = 'hint-pill';
    hintEl.innerHTML = `<strong>Hint ${this.hintsUsed}:</strong> ${hintText}`;
    hintsCont.appendChild(hintEl);

    const hintBtn = document.getElementById('btn-arena-hint');
    if (this.hintsUsed >= p.hints.length) {
      hintBtn.style.display = 'none';
    } else {
      hintBtn.textContent = `💡 Reveal Hint (${this.hintsUsed + 1}/${p.hints.length})`;
    }

    this.toast(`Hint ${this.hintsUsed} revealed (-15 pts penalty).`, 'info');
  }

  startTimer() {
    this.stopTimer();
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        sound.error();
        this.toast('Time is up for this round! You can still submit or retry.', 'error');
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
    const timerEl = document.getElementById('arena-timer');
    const mins = Math.floor(Math.max(0, this.timeRemaining) / 60);
    const secs = Math.max(0, this.timeRemaining) % 60;
    timerEl.textContent = `⏱ ${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

    if (this.timeRemaining <= 20) {
      timerEl.classList.add('warning');
    } else {
      timerEl.classList.remove('warning');
    }
  }

  async submitAnswer() {
    const answer = document.getElementById('arena-answer-input').value.trim();
    if (!answer) return this.toast('Please type an answer first!', 'error');

    this.stopTimer();

    try {
      const res = await this.api(`/api/puzzles/${this.activePuzzle.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answer,
          hintsUsed: this.hintsUsed,
          timeRemaining: this.timeRemaining
        })
      });

      if (!res.correct) {
        sound.error();
        this.toast(res.message, 'error');
        this.startTimer();
        return;
      }

      // SUCCESS!
      sound.success();
      confetti.fire(110);
      this.toast(`Solved! +${res.earnedScore} points added to your score!`, 'success');

      // Update local state
      this.user.unlockedLevel = res.unlockedLevel;
      this.user.totalScore = res.totalScore;
      this.user.completedLevels = res.completedLevels;
      this.updateNavUser();

      // Check Category Milestones exactly per prompt requirements:
      if (res.milestone === 'easy') {
        document.getElementById('modal-milestone-easy').classList.add('active');
        return;
      }
      if (res.milestone === 'medium') {
        document.getElementById('modal-milestone-medium').classList.add('active');
        return;
      }
      if (res.milestone === 'hard') {
        document.getElementById('final-victory-score').textContent = `${res.totalScore} Points`;
        document.getElementById('modal-milestone-hard').classList.add('active');
        confetti.fire(250);
        sound.victory();
        return;
      }

      // Proceed to next level or return to dashboard
      if (res.nextLevel) {
        setTimeout(() => this.openPuzzle(res.nextLevel), 1200);
      } else {
        setTimeout(() => this.showView('dashboard'), 1200);
      }
    } catch (e) {
      this.startTimer();
    }
  }

  // =========================================================================
  // SCOREBOARD LOGIC
  // =========================================================================

  async loadScoreboard() {
    try {
      const data = await this.api('/api/leaderboard');
      const ranked = data.leaderboard || [];

      // Render Top 3 Podium
      const podium = document.getElementById('leaderboard-podium');
      const medals = ['🥇', '🥈', '🥉'];
      const top3 = ranked.slice(0, 3);

      podium.innerHTML = top3.map((player, i) => `
        <div class="podium-card rank-${i + 1}">
          <div class="podium-badge">${medals[i]}</div>
          <div class="podium-name">${player.fullName}</div>
          <div style="font-size: 0.82rem; color: var(--text-muted);">@${player.username}</div>
          <div class="podium-score">${player.totalScore} pts</div>
          <div style="font-size: 0.78rem; color: #6ee7b7; font-weight: 700; margin-top: 4px;">
            ${player.completedCount} / 30 Levels
          </div>
        </div>
      `).join('');

      // Render Table
      const tbody = document.getElementById('leaderboard-table-body');
      tbody.innerHTML = ranked.map(p => `
        <tr class="${p.isCurrentPlayer ? 'current-user-row' : ''}">
          <td style="font-weight: 800;">${p.rank <= 3 ? medals[p.rank - 1] : `#${p.rank}`}</td>
          <td>
            <div style="font-weight: 700;">${p.fullName}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">@${p.username}</div>
          </td>
          <td style="font-weight: 800; color: var(--accent-amber);">${p.totalScore}</td>
          <td>${p.completedCount} / 30</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; width: 80px;">
                <div style="width: ${p.completionPct}%; height: 100%; background: var(--accent-cyan); border-radius: 999px;"></div>
              </div>
              <span style="font-size: 0.78rem;">${p.completionPct}%</span>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {}
  }

  // =========================================================================
  // ADMIN PORTAL LOGIC
  // =========================================================================

  async loadAdminPortal() {
    if (!this.user || this.user.role !== 'admin') {
      this.toast('Access denied. Administrator privileges required.', 'error');
      return this.showView('dashboard');
    }

    try {
      // 1. Overview stats
      const stats = await this.api('/api/admin/overview');
      document.getElementById('admin-stat-users').textContent = stats.totalUsers;
      document.getElementById('admin-stat-completed').textContent = stats.totalCompletedLevels;
      document.getElementById('admin-stat-highscore').textContent = `${stats.highestScore} pts`;
      document.getElementById('admin-stat-active').textContent = stats.activeUsersCount;

      // 2. Load users
      this.loadAdminUsers();

      // 3. Load puzzles
      this.loadAdminPuzzles();

      // 4. Load settings
      const settingsData = await this.api('/api/admin/settings');
      const s = settingsData.settings;
      document.getElementById('setting-easy-timer').value = s.easyTimer || 90;
      document.getElementById('setting-medium-timer').value = s.mediumTimer || 120;
      document.getElementById('setting-hard-timer').value = s.hardTimer || 150;
      document.getElementById('setting-hint-penalty').value = s.hintPenalty || 15;
      document.getElementById('setting-announcement').value = s.rulesAnnouncement || '';

      // 5. Admin Scoreboard
      this.loadAdminScoreboard();
    } catch (e) {}
  }

  async loadAdminUsers(query = '') {
    const data = await this.api(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    const tbody = document.getElementById('admin-users-table-body');
    tbody.innerHTML = (data.users || []).map(u => `
      <tr>
        <td>
          <strong>${u.fullName}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">@${u.username}</div>
        </td>
        <td>${u.email}</td>
        <td>
          <span class="tile-badge" style="background: ${u.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}; color: ${u.status === 'active' ? '#6ee7b7' : '#fda4af'};">
            ${u.status}
          </span>
        </td>
        <td>Level ${u.unlockedLevel} (${u.completedCount}/30)</td>
        <td style="color: var(--accent-amber); font-weight: 700;">${u.totalScore}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-secondary btn-action-reset-pw" data-id="${u.id}" style="padding: 4px 8px; font-size: 0.75rem;" title="Assign temporary password">Reset PW</button>
            <button class="btn-danger btn-action-reset-prog" data-id="${u.id}" style="padding: 4px 8px; font-size: 0.75rem;" title="Reset progress to level 1">Reset</button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-action-reset-pw').forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const res = await this.api(`/api/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({}) });
        alert(res.message);
      };
    });

    tbody.querySelectorAll('.btn-action-reset-prog').forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Reset this player\'s progress and score to zero?')) {
          await this.api(`/api/admin/users/${id}/reset-progress`, { method: 'POST', body: JSON.stringify({}) });
          this.toast('Player progress reset.', 'info');
          this.loadAdminUsers();
        }
      };
    });
  }

  async loadAdminPuzzles() {
    const data = await this.api('/api/admin/puzzles');
    const tbody = document.getElementById('admin-puzzles-table-body');
    tbody.innerHTML = (data.puzzles || []).map(p => `
      <tr>
        <td style="font-weight: 800;">#${p.id}</td>
        <td style="text-transform: uppercase; font-size: 0.75rem; font-weight: 700;">${p.category}</td>
        <td><strong>${p.title}</strong></td>
        <td>${p.points} pts</td>
        <td>
          <span class="tile-badge" style="background: ${p.enabled ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}; color: ${p.enabled ? '#6ee7b7' : '#fda4af'};">
            ${p.enabled ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td>
          <button class="btn-secondary btn-edit-puzzle" data-id="${p.id}" style="padding: 4px 10px; font-size: 0.75rem;">Edit</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-edit-puzzle').forEach(btn => {
      btn.onclick = (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const p = data.puzzles.find(x => x.id === id);
        const newTitle = prompt('Edit Puzzle Title:', p.title);
        if (newTitle) {
          const newQ = prompt('Edit Puzzle Question:', p.question);
          if (newQ) {
            this.api(`/api/admin/puzzles/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ title: newTitle, question: newQ })
            }).then(() => {
              this.toast('Puzzle updated!', 'success');
              this.loadAdminPuzzles();
            });
          }
        }
      };
    });
  }

  async loadAdminScoreboard() {
    const data = await this.api('/api/leaderboard');
    const tbody = document.getElementById('admin-scoreboard-body');
    tbody.innerHTML = (data.leaderboard || []).map(p => `
      <tr>
        <td style="font-weight: 800;">#${p.rank}</td>
        <td>${p.fullName} (@${p.username})</td>
        <td style="color: var(--accent-amber); font-weight: 700;">${p.totalScore} pts</td>
        <td>${p.completedCount} / 30</td>
        <td>
          <button class="btn-danger btn-admin-reset-single" data-id="${p.id}" style="padding: 4px 8px; font-size: 0.75rem;">Reset</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-admin-reset-single').forEach(b => {
      b.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Reset this player\'s tournament score?')) {
          await this.api(`/api/admin/users/${id}/reset-progress`, { method: 'POST', body: JSON.stringify({}) });
          this.loadAdminScoreboard();
        }
      };
    });
  }

  bindAdminControls() {
    // Search Users
    document.getElementById('btn-search-users').onclick = () => {
      const q = document.getElementById('admin-user-search').value.trim();
      this.loadAdminUsers(q);
    };

    // Shuffling
    document.getElementById('btn-shuffle-easy').onclick = async () => {
      sound.click();
      const res = await this.api('/api/admin/puzzles/shuffle', { method: 'POST', body: JSON.stringify({ category: 'easy' }) });
      this.toast(res.message, 'success');
      this.loadAdminPuzzles();
    };
    document.getElementById('btn-shuffle-medium').onclick = async () => {
      sound.click();
      const res = await this.api('/api/admin/puzzles/shuffle', { method: 'POST', body: JSON.stringify({ category: 'medium' }) });
      this.toast(res.message, 'success');
      this.loadAdminPuzzles();
    };
    document.getElementById('btn-shuffle-hard').onclick = async () => {
      sound.click();
      const res = await this.api('/api/admin/puzzles/shuffle', { method: 'POST', body: JSON.stringify({ category: 'hard' }) });
      this.toast(res.message, 'success');
      this.loadAdminPuzzles();
    };

    // Save Game Settings
    document.getElementById('btn-save-settings').onclick = async () => {
      sound.click();
      const easyTimer = parseInt(document.getElementById('setting-easy-timer').value) || 90;
      const mediumTimer = parseInt(document.getElementById('setting-medium-timer').value) || 120;
      const hardTimer = parseInt(document.getElementById('setting-hard-timer').value) || 150;
      const hintPenalty = parseInt(document.getElementById('setting-hint-penalty').value) || 15;
      const rulesAnnouncement = document.getElementById('setting-announcement').value;

      await this.api('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ easyTimer, mediumTimer, hardTimer, hintPenalty, rulesAnnouncement })
      });
      this.toast('Settings saved and applied to all gameplay sessions.', 'success');
    };

    // Global Reset All
    document.getElementById('btn-admin-reset-all').onclick = async () => {
      sound.error();
      const conf = prompt('WARNING: Type "RESET_ALL_CONFIRMED" to wipe all player progress and scores:');
      if (conf === 'RESET_ALL_CONFIRMED') {
        await this.api('/api/admin/reset-all', {
          method: 'POST',
          body: JSON.stringify({ confirmation: 'RESET_ALL_CONFIRMED' })
        });
        this.toast('All game progress reset successfully.', 'info');
        this.loadAdminPortal();
      }
    };
  }
}

// Bootstrap Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
