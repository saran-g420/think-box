/**
 * Level 5: The Knight's Circuit (Limited Turns Grid)
 * Navigate from IN to OUT, charging 3 capacitor nodes in at most 4 turns.
 */

import { sound } from '../sound.js';

export class LimitedTurnsPuzzle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.gridSize = 5;
    this.startPos = { r: 0, c: 0 };
    this.endPos = { r: 4, c: 4 };

    // Capacitors to visit
    this.capacitors = [
      { r: 0, c: 3, hit: false },
      { r: 3, c: 3, hit: false },
      { r: 3, c: 1, hit: false }
    ];

    // Firewalls
    this.walls = [
      { r: 1, c: 1 },
      { r: 1, c: 2 },
      { r: 2, c: 2 }
    ];

    this.path = [{ ...this.startPos }];
    this.animatingSolution = false;
    this.dpr = window.devicePixelRatio || 1;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="line-puzzle-wrapper">
        <div class="canvas-overlay-container">
          <canvas id="limited-turns-canvas"></canvas>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#limited-turns-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.bindEvents();
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const size = Math.min(parent.clientWidth || 460, 460);
    this.width = size;
    this.height = size;

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.cellSize = this.width / this.gridSize;
  }

  countTurns() {
    if (this.path.length <= 2) return 0;
    let turns = 0;
    let prevDir = null;

    for (let i = 1; i < this.path.length; i++) {
      const dr = this.path[i].r - this.path[i - 1].r;
      const dc = this.path[i].c - this.path[i - 1].c;
      const dir = dr !== 0 ? (dr > 0 ? 'D' : 'U') : (dc > 0 ? 'R' : 'L');
      if (prevDir && dir !== prevDir) {
        turns++;
      }
      prevDir = dir;
    }
    return turns;
  }

  checkCapacitors() {
    this.capacitors.forEach(cap => {
      cap.hit = this.path.some(p => p.r === cap.r && p.c === cap.c);
    });
  }

  notifyState() {
    const turns = this.countTurns();
    const hits = this.capacitors.filter(c => c.hit).length;
    this.onStateChange({
      turnsUsed: turns,
      maxTurns: 4,
      nodesHit: hits,
      totalNodes: 3
    });
  }

  bindEvents() {
    const canvas = this.canvas;

    const handleGridTap = (e) => {
      if (this.animatingSolution) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const col = Math.floor((clientX - rect.left) / this.cellSize);
      const row = Math.floor((clientY - rect.top) / this.cellSize);

      if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) return;

      this.moveToward(row, col);
    };

    canvas.addEventListener('click', handleGridTap);
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleGridTap(e);
    }, { passive: false });

    this._cleanup = () => {
      canvas.removeEventListener('click', handleGridTap);
    };
  }

  isWall(r, c) {
    return this.walls.some(w => w.r === r && w.c === c);
  }

  moveToward(targetR, targetC) {
    const current = this.path[this.path.length - 1];
    if (targetR === current.r && targetC === current.c) return;

    // Check if target is along straight orthogonal line
    if (targetR !== current.r && targetC !== current.c) {
      this.onFeedback('Moves must be in a straight orthogonal line (Horizontal or Vertical)!', 'error');
      sound.error();
      return;
    }

    const dr = Math.sign(targetR - current.r);
    const dc = Math.sign(targetC - current.c);

    // Step by step along line, check walls
    let curR = current.r;
    let curC = current.c;
    const addedSteps = [];

    while (curR !== targetR || curC !== targetC) {
      curR += dr;
      curC += dc;
      if (this.isWall(curR, curC)) {
        this.onFeedback('Blocked by a firewall barrier!', 'error');
        sound.error();
        return;
      }
      addedSteps.push({ r: curR, c: curC });
    }

    // Add steps
    this.path.push(...addedSteps);
    sound.draw();
    this.checkCapacitors();
    this.notifyState();
    this.render();

    // Check if reached OUT
    if (targetR === this.endPos.r && targetC === this.endPos.c) {
      this.validate();
    }
  }

  undo() {
    if (this.animatingSolution) return;
    if (this.path.length > 1) {
      this.path.pop();
      sound.click();
      this.checkCapacitors();
      this.notifyState();
      this.render();
      this.onFeedback('Last step undone.', 'info');
    }
  }

  clear() {
    if (this.animatingSolution) return;
    this.path = [{ ...this.startPos }];
    this.capacitors.forEach(c => c.hit = false);
    sound.click();
    this.notifyState();
    this.render();
    this.onFeedback('Path reset to Start.', 'info');
  }

  validate() {
    const current = this.path[this.path.length - 1];
    const turns = this.countTurns();
    this.checkCapacitors();
    const hits = this.capacitors.filter(c => c.hit).length;

    if (current.r !== this.endPos.r || current.c !== this.endPos.c) {
      this.onFeedback('You must navigate all the way to the OUT terminal!', 'error');
      sound.error();
      return;
    }

    if (hits < 3) {
      this.onFeedback(`You missed ${3 - hits} capacitor(s)! All 3 purple capacitors must be powered.`, 'error');
      sound.error();
      return;
    }

    if (turns > 4) {
      this.onFeedback(`You reached OUT and charged all nodes, but used ${turns} turns! Maximum 4 turns allowed.`, 'error');
      sound.error();
      return;
    }

    this.onFeedback('Exceptional routing! Reached OUT with all capacitors charged in 4 turns!', 'success');
    sound.success();
    this.onSuccess({ turns, perfect: turns <= 4 });
  }

  showSolution() {
    this.clear();
    this.animatingSolution = true;
    this.onFeedback('Showing optimal 4-turn route...', 'info');

    // Solution sequence of straight moves:
    // Move 1: (0,0) -> (0,3) [hits C1]
    // Move 2: (0,3) -> (3,3) [hits C2] (turn 1)
    // Move 3: (3,3) -> (3,1) [hits C3] (turn 2)
    // Move 4: (3,1) -> (4,1) (turn 3)
    // Move 5: (4,1) -> (4,4) [hits OUT] (turn 4)
    const targets = [
      { r: 0, c: 3 },
      { r: 3, c: 3 },
      { r: 3, c: 1 },
      { r: 4, c: 1 },
      { r: 4, c: 4 }
    ];

    let idx = 0;
    const step = () => {
      if (idx >= targets.length) {
        this.animatingSolution = false;
        return;
      }
      this.moveToward(targets[idx].r, targets[idx].c);
      idx++;
      setTimeout(step, 650);
    };
    setTimeout(step, 400);
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const cs = this.cellSize;

    ctx.clearRect(0, 0, w, w);

    // Draw Grid Cells
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const x = c * cs;
        const y = r * cs;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cs, cs);

        // Wall
        if (this.isWall(r, c)) {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
          ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
          ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);

          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('WALL', x + cs / 2, y + cs / 2);
        }
      }
    }

    // Draw Capacitors
    this.capacitors.forEach(cap => {
      const cx = cap.c * cs + cs / 2;
      const cy = cap.r * cs + cs / 2;

      ctx.save();
      if (cap.hit) {
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#a855f7';
      } else {
        ctx.fillStyle = '#4c1d95';
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', cx, cy);
      ctx.restore();
    });

    // Draw Start (IN) & End (OUT)
    const inX = this.startPos.c * cs + cs / 2;
    const inY = this.startPos.r * cs + cs / 2;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(inX, inY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Plus Jakarta Sans"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IN', inX, inY);

    const outX = this.endPos.c * cs + cs / 2;
    const outY = this.endPos.r * cs + cs / 2;
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(outX, outY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Plus Jakarta Sans"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OUT', outX, outY);

    // Draw Player Path
    if (this.path.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(this.path[0].c * cs + cs / 2, this.path[0].r * cs + cs / 2);
      for (let i = 1; i < this.path.length; i++) {
        ctx.lineTo(this.path[i].c * cs + cs / 2, this.path[i].r * cs + cs / 2);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  destroy() {
    if (this._cleanup) this._cleanup();
  }
}
