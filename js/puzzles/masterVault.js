/**
 * Level 10: The Symposium Vault (Outside the Box Grand Finale)
 * Align the 3 concentric cipher rings, then drag the glowing fuse OUTSIDE the puzzle frame into the external terminal.
 */

import { sound } from '../sound.js';
import { confetti } from '../confetti.js';

export class MasterVaultPuzzle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // Rings angles in degrees (0 = aligned)
    this.rings = [90, 180, 270]; // Outer, Middle, Inner
    this.ringsAligned = false;
    this.fuseHolding = false;
    this.fusePluggedOutside = false;

    this.init();
  }

  init() {
    this.render();
    this.bindExternalTerminal();
  }

  rotateRing(idx) {
    if (this.ringsAligned) return;
    this.rings[idx] = (this.rings[idx] + 90) % 360;
    sound.click();
    this.checkAlignment();
    this.notifyState();
    this.render();
  }

  checkAlignment() {
    const aligned = this.rings.every(r => r === 0);
    if (aligned && !this.ringsAligned) {
      this.ringsAligned = true;
      sound.success();
      this.onFeedback('Rings aligned! The Master Fuse has unlocked. Notice the prompt: The answer is OUTSIDE the box!', 'success');
      this.render();
    }
  }

  pickFuse() {
    if (!this.ringsAligned) {
      this.onFeedback('First align all three vault rings to unlock the Master Fuse!', 'error');
      sound.error();
      return;
    }
    this.fuseHolding = true;
    sound.click();
    this.onFeedback('Master Fuse active! Drag or click the External Power Socket on the right panel to complete the circuit!', 'info');
    this.render();
  }

  bindExternalTerminal() {
    // Look for external terminal socket in sidebar
    const term = document.getElementById('outside-terminal-slot');
    if (term) {
      term.style.display = 'flex';
      term.onclick = () => {
        if (this.fuseHolding) {
          this.plugFuseOutside();
        } else if (!this.ringsAligned) {
          this.onFeedback('Align the vault rings first to release the fuse!', 'error');
          sound.error();
        } else {
          this.onFeedback('Click the glowing fuse in the center first, then plug it into this terminal!', 'info');
        }
      };
    }
  }

  plugFuseOutside() {
    this.fuseHolding = false;
    this.fusePluggedOutside = true;
    sound.victory();
    confetti.fire(150);
    this.onFeedback('INCREDIBLE! You literally thought outside the box to plug the fuse into the external terminal!', 'success');
    this.render();

    setTimeout(() => {
      this.onSuccess({ perfect: true, grandmaster: true });
    }, 1200);
  }

  notifyState() {
    const alignedCount = this.rings.filter(r => r === 0).length;
    this.onStateChange({
      ringsAligned: alignedCount,
      totalRings: 3,
      fuseReady: this.ringsAligned,
      fusePlugged: this.fusePluggedOutside
    });
  }

  undo() {
    this.clear();
  }

  clear() {
    this.rings = [90, 180, 270];
    this.ringsAligned = false;
    this.fuseHolding = false;
    this.fusePluggedOutside = false;
    sound.click();
    this.notifyState();
    this.render();
    this.onFeedback('Vault reset.', 'info');
  }

  validate() {
    if (this.fusePluggedOutside) {
      this.onSuccess({ perfect: true, grandmaster: true });
    } else if (this.ringsAligned) {
      this.onFeedback('The fuse is unlocked! Look beyond the center box: find the External Terminal on the right panel!', 'info');
      sound.hint();
    } else {
      this.onFeedback('Rotate the rings until all circuits align at the top!', 'error');
      sound.error();
    }
  }

  showSolution() {
    this.rings = [0, 0, 0];
    this.ringsAligned = true;
    this.fuseHolding = true;
    sound.success();
    this.notifyState();
    this.render();
    this.onFeedback('Rings aligned! Now click the Outside Power Terminal in the instructions sidebar!', 'info');
    setTimeout(() => {
      this.plugFuseOutside();
    }, 1500);
  }

  render() {
    const r = this.rings;

    this.container.innerHTML = `
      <div class="line-puzzle-wrapper" style="flex-direction: column; gap: 16px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: ${this.ringsAligned ? 'var(--accent-cyan)' : 'var(--text-secondary)'};">
          ${this.ringsAligned ? '⚡ Master Fuse Ejected! The final socket is OUTSIDE this box!' : 'Click each ring to align the radial circuit rays at the top.'}
        </div>

        <div class="canvas-overlay-container" style="width: 380px; height: 380px; display: flex; align-items: center; justify-content: center; position: relative;">
          
          <!-- Outer Ring (idx 0) -->
          <div class="vault-ring" data-ring="0" style="
            position: absolute; width: 300px; height: 300px; border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.15);
            transform: rotate(${r[0]}deg); transition: transform 0.3s ease;
            cursor: ${this.ringsAligned ? 'default' : 'pointer'};
            display: flex; align-items: flex-start; justify-content: center;
          ">
            <div style="width: 14px; height: 36px; background: ${r[0] === 0 ? 'var(--accent-cyan)' : 'var(--accent-violet)'}; border-radius: 4px; box-shadow: 0 0 10px ${r[0] === 0 ? 'var(--accent-cyan)' : 'transparent'};"></div>
          </div>

          <!-- Middle Ring (idx 1) -->
          <div class="vault-ring" data-ring="1" style="
            position: absolute; width: 210px; height: 210px; border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.15);
            transform: rotate(${r[1]}deg); transition: transform 0.3s ease;
            cursor: ${this.ringsAligned ? 'default' : 'pointer'};
            display: flex; align-items: flex-start; justify-content: center;
          ">
            <div style="width: 14px; height: 32px; background: ${r[1] === 0 ? 'var(--accent-cyan)' : 'var(--accent-violet)'}; border-radius: 4px; box-shadow: 0 0 10px ${r[1] === 0 ? 'var(--accent-cyan)' : 'transparent'};"></div>
          </div>

          <!-- Inner Ring (idx 2) -->
          <div class="vault-ring" data-ring="2" style="
            position: absolute; width: 130px; height: 130px; border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.15);
            transform: rotate(${r[2]}deg); transition: transform 0.3s ease;
            cursor: ${this.ringsAligned ? 'default' : 'pointer'};
            display: flex; align-items: flex-start; justify-content: center;
          ">
            <div style="width: 14px; height: 28px; background: ${r[2] === 0 ? 'var(--accent-cyan)' : 'var(--accent-violet)'}; border-radius: 4px; box-shadow: 0 0 10px ${r[2] === 0 ? 'var(--accent-cyan)' : 'transparent'};"></div>
          </div>

          <!-- Center Fuse -->
          <div id="vault-fuse" style="
            position: absolute; width: 60px; height: 60px; border-radius: 50%;
            background: ${this.ringsAligned ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)' : '#1e293b'};
            box-shadow: ${this.ringsAligned ? '0 0 24px var(--accent-cyan)' : 'none'};
            border: 2px solid ${this.ringsAligned ? '#ffffff' : 'rgba(255,255,255,0.2)'};
            display: flex; align-items: center; justify-content: center;
            cursor: ${this.ringsAligned ? 'pointer' : 'default'};
            z-index: 5;
            transform: scale(${this.fuseHolding ? 1.25 : 1});
            transition: all 0.25s ease;
          ">
            <span style="font-size: 24px;">${this.ringsAligned ? (this.fusePluggedOutside ? '✅' : '⚡') : '🔒'}</span>
          </div>

        </div>
      </div>
    `;

    this.container.querySelectorAll('.vault-ring').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-ring'));
        this.rotateRing(idx);
      });
    });

    const fuseEl = this.container.querySelector('#vault-fuse');
    if (fuseEl) {
      fuseEl.addEventListener('click', () => this.pickFuse());
    }

    this.bindExternalTerminal();
  }

  destroy() {
    const term = document.getElementById('outside-terminal-slot');
    if (term) term.style.display = 'none';
  }
}
