/**
 * Level 6: The Paradox Square
 * Slide 4 interlocking corner blocks outward along guide rails to reveal the hidden central crystal.
 */

import { sound } from '../sound.js';

export class SpatialShiftPuzzle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // 4 tiles: Top-Left (0), Top-Right (1), Bottom-Right (2), Bottom-Left (3)
    // state: 0 = retracted (closed), 1 = extended (opened)
    this.tileStates = [0, 0, 0, 0];
    this.coreRevealed = false;

    this.init();
  }

  init() {
    this.render();
  }

  toggleTile(idx) {
    this.tileStates[idx] = this.tileStates[idx] === 0 ? 1 : 0;
    sound.click();
    this.checkAperture();
    this.notifyState();
    this.render();
  }

  checkAperture() {
    const allOpened = this.tileStates.every(s => s === 1);
    this.coreRevealed = allOpened;
    if (allOpened) {
      sound.success();
      this.onFeedback('The central aperture has opened! Click the exposed Power Crystal!', 'success');
    } else {
      const openedCount = this.tileStates.filter(s => s === 1).length;
      this.onFeedback(`${openedCount} of 4 perimeter tiles shifted outward.`, 'info');
    }
  }

  collectCore() {
    if (!this.coreRevealed) return;
    sound.victory();
    this.onFeedback('Spatial paradox mastered! Central power crystal collected!', 'success');
    this.onSuccess({ moves: 4, perfect: true });
  }

  notifyState() {
    const opened = this.tileStates.filter(s => s === 1).length;
    this.onStateChange({
      tilesShifted: opened,
      totalTiles: 4,
      crystalReady: this.coreRevealed
    });
  }

  undo() {
    // Find last opened and close it
    for (let i = 3; i >= 0; i--) {
      if (this.tileStates[i] === 1) {
        this.tileStates[i] = 0;
        sound.click();
        this.checkAperture();
        this.notifyState();
        this.render();
        this.onFeedback(`Shifted tile ${i + 1} back.`, 'info');
        return;
      }
    }
  }

  clear() {
    this.tileStates = [0, 0, 0, 0];
    this.coreRevealed = false;
    sound.click();
    this.notifyState();
    this.render();
    this.onFeedback('All tiles reset to center.', 'info');
  }

  validate() {
    if (this.coreRevealed) {
      this.collectCore();
    } else {
      this.onFeedback('All 4 corner tiles must be shifted outward to open the aperture!', 'error');
      sound.error();
    }
  }

  showSolution() {
    this.clear();
    this.onFeedback('Expanding all 4 perimeter tiles outwards...', 'info');
    [0, 1, 2, 3].forEach((idx, i) => {
      setTimeout(() => {
        this.toggleTile(idx);
      }, (i + 1) * 350);
    });
  }

  render() {
    const s = this.tileStates;
    const shift = 24; // px outward shift

    // Transformations for 4 quadrants
    const transforms = [
      `translate(${s[0] ? -shift : 0}px, ${s[0] ? -shift : 0}px)`, // TL
      `translate(${s[1] ? shift : 0}px, ${s[1] ? -shift : 0}px)`,  // TR
      `translate(${s[2] ? shift : 0}px, ${s[2] ? shift : 0}px)`,   // BR
      `translate(${s[3] ? -shift : 0}px, ${s[2] ? shift : 0}px)`   // BL
    ];

    this.container.innerHTML = `
      <div class="line-puzzle-wrapper" style="flex-direction: column; gap: 16px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);">
          Tap each of the 4 interlocking corner wedges to slide them outward along guide tracks.
        </div>
        <div class="canvas-overlay-container" style="width: 380px; height: 380px; display: flex; align-items: center; justify-content: center; position: relative;">
          
          <!-- Central Aperture Crystal -->
          <div id="spatial-crystal" style="
            position: absolute;
            width: 72px;
            height: 72px;
            border-radius: 14px;
            background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
            box-shadow: 0 0 ${this.coreRevealed ? '35px #06b6d4' : '0px transparent'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: ${this.coreRevealed ? 'pointer' : 'default'};
            z-index: 1;
            transition: all 0.4s ease;
            transform: scale(${this.coreRevealed ? 1 : 0.4});
            opacity: ${this.coreRevealed ? 1 : 0.2};
          ">
            <span style="font-size: 32px;">💎</span>
          </div>

          <!-- 4 Interlocking Blocks -->
          <div style="position: relative; width: 280px; height: 280px; z-index: 2; pointer-events: none;">
            
            <!-- Tile 0: Top-Left -->
            <div class="paradox-tile" data-idx="0" style="
              position: absolute; top: 0; left: 0; width: 135px; height: 135px;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              border: 2px solid ${s[0] ? 'var(--accent-cyan)' : 'var(--border-medium)'};
              border-radius: 12px 4px 4px 4px;
              box-shadow: ${s[0] ? '0 0 16px var(--accent-cyan-glow)' : 'none'};
              transform: ${transforms[0]};
              transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
              pointer-events: auto; cursor: pointer;
              display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-weight: 800;
            ">◤ 1</div>

            <!-- Tile 1: Top-Right -->
            <div class="paradox-tile" data-idx="1" style="
              position: absolute; top: 0; right: 0; width: 135px; height: 135px;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              border: 2px solid ${s[1] ? 'var(--accent-cyan)' : 'var(--border-medium)'};
              border-radius: 4px 12px 4px 4px;
              box-shadow: ${s[1] ? '0 0 16px var(--accent-cyan-glow)' : 'none'};
              transform: ${transforms[1]};
              transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
              pointer-events: auto; cursor: pointer;
              display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-weight: 800;
            ">◥ 2</div>

            <!-- Tile 2: Bottom-Right -->
            <div class="paradox-tile" data-idx="2" style="
              position: absolute; bottom: 0; right: 0; width: 135px; height: 135px;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              border: 2px solid ${s[2] ? 'var(--accent-cyan)' : 'var(--border-medium)'};
              border-radius: 4px 4px 12px 4px;
              box-shadow: ${s[2] ? '0 0 16px var(--accent-cyan-glow)' : 'none'};
              transform: ${transforms[2]};
              transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
              pointer-events: auto; cursor: pointer;
              display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-weight: 800;
            ">◢ 3</div>

            <!-- Tile 3: Bottom-Left -->
            <div class="paradox-tile" data-idx="3" style="
              position: absolute; bottom: 0; left: 0; width: 135px; height: 135px;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              border: 2px solid ${s[3] ? 'var(--accent-cyan)' : 'var(--border-medium)'};
              border-radius: 4px 4px 4px 12px;
              box-shadow: ${s[3] ? '0 0 16px var(--accent-cyan-glow)' : 'none'};
              transform: ${transforms[3]};
              transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
              pointer-events: auto; cursor: pointer;
              display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-weight: 800;
            ">◣ 4</div>

          </div>
        </div>
      </div>
    `;

    // Bind tile clicks
    this.container.querySelectorAll('.paradox-tile').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        this.toggleTile(idx);
      });
    });

    const crystal = this.container.querySelector('#spatial-crystal');
    if (crystal) {
      crystal.addEventListener('click', () => this.collectCore());
    }
  }

  destroy() {}
}
