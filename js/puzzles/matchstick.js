/**
 * Level 4: Matchstick Lateral Math
 * Fix the broken equation: 6 + 4 = 4 by moving exactly 1 matchstick.
 */

import { sound } from '../sound.js';

export class MatchstickPuzzle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // State of matchsticks: true = present, false = empty
    // Initial: 6 + 4 = 4
    this.initialState = {
      // Digit 1: '6' (a, f, g, e, c, d present; b empty)
      d1_a: true, d1_b: false, d1_c: true, d1_d: true, d1_e: true, d1_f: true, d1_g: true,
      // Op '+': h=horizontal, v=vertical
      op_h: true, op_v: true,
      // Digit 2: '4' (f, b, g, c present)
      d2_a: false, d2_b: true, d2_c: true, d2_d: false, d2_e: false, d2_f: true, d2_g: true,
      // Digit 3: '4' (f, b, g, c present)
      d3_a: false, d3_b: true, d3_c: true, d3_d: false, d3_e: false, d3_f: true, d3_g: true
    };

    this.state = { ...this.initialState };
    this.pickedStick = null; // key of picked stick
    this.moveCount = 0;
    this.history = [];

    this.init();
  }

  init() {
    this.render();
  }

  handleSlotClick(key) {
    if (this.pickedStick === null) {
      // Trying to pick up a stick
      if (!this.state[key]) {
        this.onFeedback('Click a glowing matchstick to pick it up!', 'info');
        return;
      }
      this.pickedStick = key;
      this.state[key] = false;
      sound.click();
      this.onFeedback(`Picked up matchstick. Now click an empty slot to place it.`, 'info');
      this.notifyState();
      this.render();
    } else {
      // Holding a stick: place it down
      if (this.state[key]) {
        this.onFeedback('That slot already has a matchstick! Click an empty slot.', 'error');
        sound.error();
        return;
      }
      this.state[key] = true;
      const from = this.pickedStick;
      const to = key;
      this.pickedStick = null;

      if (from !== to) {
        this.moveCount++;
        this.history.push({ from, to });
      }

      sound.click();
      this.notifyState();
      this.render();

      this.checkSolution();
    }
  }

  notifyState() {
    this.onStateChange({
      movesUsed: this.moveCount,
      holdingStick: !!this.pickedStick
    });
  }

  checkSolution() {
    const s = this.state;

    // Check if 8 - 4 = 4:
    // d1 must be '8' (a, b, c, d, e, f, g all true)
    const d1Is8 = s.d1_a && s.d1_b && s.d1_c && s.d1_d && s.d1_e && s.d1_f && s.d1_g;
    const opIsMinus = s.op_h && !s.op_v;
    const d2Is4 = !s.d2_a && s.d2_b && s.d2_c && !s.d2_d && !s.d2_e && s.d2_f && s.d2_g;
    const d3Is4 = !s.d3_a && s.d3_b && s.d3_c && !s.d3_d && !s.d3_e && s.d3_f && s.d3_g;

    // Check if 0 + 4 = 4:
    // d1 must be '0' (a, b, c, d, e, f true, g false)
    const d1Is0 = s.d1_a && s.d1_b && s.d1_c && s.d1_d && s.d1_e && s.d1_f && !s.d1_g;
    const opIsPlus = s.op_h && s.op_v;

    if (d1Is8 && opIsMinus && d2Is4 && d3Is4) {
      this.onFeedback('Brilliant! 8 - 4 = 4 is completely correct!', 'success');
      sound.success();
      this.onSuccess({ moves: this.moveCount, perfect: this.moveCount === 1 });
      return;
    }

    if (d1Is0 && opIsPlus && d2Is4 && d3Is4) {
      this.onFeedback('Genius! 0 + 4 = 4 is a completely valid lateral solution!', 'success');
      sound.success();
      this.onSuccess({ moves: this.moveCount, perfect: this.moveCount === 1 });
      return;
    }

    if (this.moveCount >= 1 && !this.pickedStick) {
      this.onFeedback('The current equation is not mathematically balanced. Try undoing or resetting!', 'error');
    }
  }

  undo() {
    if (this.pickedStick) {
      this.state[this.pickedStick] = true;
      this.pickedStick = null;
      sound.click();
      this.notifyState();
      this.render();
      return;
    }

    if (this.history.length > 0) {
      const last = this.history.pop();
      this.state[last.to] = false;
      this.state[last.from] = true;
      this.moveCount = Math.max(0, this.moveCount - 1);
      sound.click();
      this.notifyState();
      this.render();
      this.onFeedback('Move undone.', 'info');
    }
  }

  clear() {
    this.state = { ...this.initialState };
    this.pickedStick = null;
    this.moveCount = 0;
    this.history = [];
    sound.click();
    this.notifyState();
    this.render();
    this.onFeedback('Equation reset to 6 + 4 = 4.', 'info');
  }

  validate() {
    this.checkSolution();
  }

  showSolution() {
    this.clear();
    this.onFeedback('Demonstrating solution: Move vertical stick from + to the 6 to make 8 - 4 = 4...', 'info');
    setTimeout(() => {
      this.handleSlotClick('op_v'); // pick from plus
      setTimeout(() => {
        this.handleSlotClick('d1_b'); // place on 6 to make 8
      }, 500);
    }, 400);
  }

  renderDigit(prefix) {
    const s = this.state;
    const isPicked = (k) => this.pickedStick === k;

    return `
      <div class="matchstick-digit">
        <!-- a: Top -->
        <div class="match-slot horizontal ${s[prefix + '_a'] ? 'active' : ''} ${isPicked(prefix + '_a') ? 'selected' : ''}" 
             style="top: 0;" data-slot="${prefix}_a"></div>
        <!-- f: Top-Left -->
        <div class="match-slot vertical ${s[prefix + '_f'] ? 'active' : ''} ${isPicked(prefix + '_f') ? 'selected' : ''}" 
             style="top: 10px; left: 0;" data-slot="${prefix}_f"></div>
        <!-- b: Top-Right -->
        <div class="match-slot vertical ${s[prefix + '_b'] ? 'active' : ''} ${isPicked(prefix + '_b') ? 'selected' : ''}" 
             style="top: 10px; right: 0;" data-slot="${prefix}_b"></div>
        <!-- g: Middle -->
        <div class="match-slot horizontal ${s[prefix + '_g'] ? 'active' : ''} ${isPicked(prefix + '_g') ? 'selected' : ''}" 
             style="top: 68px;" data-slot="${prefix}_g"></div>
        <!-- e: Bottom-Left -->
        <div class="match-slot vertical ${s[prefix + '_e'] ? 'active' : ''} ${isPicked(prefix + '_e') ? 'selected' : ''}" 
             style="top: 78px; left: 0;" data-slot="${prefix}_e"></div>
        <!-- c: Bottom-Right -->
        <div class="match-slot vertical ${s[prefix + '_c'] ? 'active' : ''} ${isPicked(prefix + '_c') ? 'selected' : ''}" 
             style="top: 78px; right: 0;" data-slot="${prefix}_c"></div>
        <!-- d: Bottom -->
        <div class="match-slot horizontal ${s[prefix + '_d'] ? 'active' : ''} ${isPicked(prefix + '_d') ? 'selected' : ''}" 
             style="bottom: 0;" data-slot="${prefix}_d"></div>
      </div>
    `;
  }

  renderOperator() {
    const s = this.state;
    return `
      <div class="matchstick-digit" style="width: 60px;">
        <!-- Horizontal -->
        <div class="match-slot horizontal ${s['op_h'] ? 'active' : ''}" 
             style="top: 68px; left: 5px; width: 50px;" data-slot="op_h"></div>
        <!-- Vertical -->
        <div class="match-slot vertical ${s['op_v'] ? 'active' : ''}" 
             style="top: 45px; left: 24px; height: 60px;" data-slot="op_v"></div>
      </div>
    `;
  }

  renderEquals() {
    return `
      <div class="matchstick-digit" style="width: 50px; cursor: default;">
        <div class="match-slot horizontal active" style="top: 55px; left: 5px; width: 40px; pointer-events: none;"></div>
        <div class="match-slot horizontal active" style="top: 80px; left: 5px; width: 40px; pointer-events: none;"></div>
      </div>
    `;
  }

  render() {
    this.container.innerHTML = `
      <div class="line-puzzle-wrapper" style="flex-direction: column; gap: 20px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: ${this.pickedStick ? 'var(--accent-cyan)' : 'var(--text-secondary)'};">
          ${this.pickedStick ? 'Holding Matchstick — Select empty slot to place' : 'Move exactly 1 matchstick to balance equation'}
        </div>
        <div class="canvas-overlay-container" style="padding: 24px;">
          <div class="matchstick-board">
            ${this.renderDigit('d1')}
            ${this.renderOperator()}
            ${this.renderDigit('d2')}
            ${this.renderEquals()}
            ${this.renderDigit('d3')}
          </div>
        </div>
      </div>
    `;

    // Bind slot clicks
    this.container.querySelectorAll('[data-slot]').forEach(el => {
      el.addEventListener('click', (e) => {
        const slotKey = e.currentTarget.getAttribute('data-slot');
        this.handleSlotClick(slotKey);
      });
    });
  }

  destroy() {}
}
