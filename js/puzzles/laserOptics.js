/**
 * Level 9: Photon Prism Matrix (Laser Optics & Reflection)
 * Position and rotate 45-degree prism mirrors to route a laser beam through all 4 sensor nodes.
 */

import { sound } from '../sound.js';

export class LaserOpticsPuzzle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.gridSize = 6;

    // Mirrors at key pedestals: { r, c, angle: '/' or '\', active: true/false }
    this.mirrors = {
      '1,2': { r: 1, c: 2, angle: '\\', active: true },
      '1,5': { r: 1, c: 5, angle: '/', active: true },
      '4,5': { r: 4, c: 5, angle: '\\', active: true },
      '4,2': { r: 4, c: 2, angle: '/', active: true }
    };

    // Sensor Targets
    this.sensors = [
      { r: 1, c: 4, hit: false, label: 'S1' },
      { r: 2, c: 5, hit: false, label: 'S2' },
      { r: 4, c: 3, hit: false, label: 'S3' },
      { r: 3, c: 2, hit: false, label: 'S4' }
    ];

    this.emitter = { r: 0, c: 2, dir: 'D' }; // shooting DOWN
    this.laserPath = [];
    this.dpr = window.devicePixelRatio || 1;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="line-puzzle-wrapper">
        <div class="canvas-overlay-container">
          <canvas id="laser-optics-canvas"></canvas>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#laser-optics-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.bindEvents();
    this.traceLaser();
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

  rotateMirror(key) {
    if (this.mirrors[key]) {
      this.mirrors[key].angle = this.mirrors[key].angle === '/' ? '\\' : '/';
      sound.click();
      this.traceLaser();
      this.notifyState();
      this.render();
    }
  }

  traceLaser() {
    this.laserPath = [];
    this.sensors.forEach(s => s.hit = false);

    let curR = this.emitter.r;
    let curC = this.emitter.c;
    let dir = this.emitter.dir; // 'U', 'D', 'L', 'R'

    this.laserPath.push({ r: curR, c: curC });

    let steps = 0;
    while (steps < 30) {
      steps++;
      if (dir === 'D') curR++;
      else if (dir === 'U') curR--;
      else if (dir === 'R') curC++;
      else if (dir === 'L') curC--;

      if (curR < 0 || curR >= this.gridSize || curC < 0 || curC >= this.gridSize) {
        // Exited grid
        this.laserPath.push({ r: curR, c: curC });
        break;
      }

      this.laserPath.push({ r: curR, c: curC });

      // Check sensor hits
      this.sensors.forEach(s => {
        if (s.r === curR && s.c === curC) {
          s.hit = true;
        }
      });

      // Check mirror reflection
      const key = `${curR},${curC}`;
      if (this.mirrors[key] && this.mirrors[key].active) {
        const angle = this.mirrors[key].angle;
        if (angle === '/') {
          if (dir === 'D') dir = 'L';
          else if (dir === 'U') dir = 'R';
          else if (dir === 'R') dir = 'U';
          else if (dir === 'L') dir = 'D';
        } else if (angle === '\\') {
          if (dir === 'D') dir = 'R';
          else if (dir === 'U') dir = 'L';
          else if (dir === 'R') dir = 'D';
          else if (dir === 'L') dir = 'U';
        }
      }
    }
  }

  bindEvents() {
    const canvas = this.canvas;

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

      const c = Math.floor(x / this.cellSize);
      const r = Math.floor(y / this.cellSize);
      const key = `${r},${c}`;

      if (this.mirrors[key]) {
        this.rotateMirror(key);
      }
    };

    canvas.addEventListener('click', handleClick);
    this._cleanup = () => canvas.removeEventListener('click', handleClick);
  }

  notifyState() {
    const hits = this.sensors.filter(s => s.hit).length;
    this.onStateChange({
      sensorsLit: hits,
      totalSensors: 4
    });
  }

  undo() {
    this.clear();
  }

  clear() {
    this.mirrors = {
      '1,2': { r: 1, c: 2, angle: '\\', active: true },
      '1,5': { r: 1, c: 5, angle: '/', active: true },
      '4,5': { r: 4, c: 5, angle: '\\', active: true },
      '4,2': { r: 4, c: 2, angle: '/', active: true }
    };
    sound.click();
    this.traceLaser();
    this.notifyState();
    this.render();
    this.onFeedback('Mirrors reset.', 'info');
  }

  validate() {
    this.traceLaser();
    const hits = this.sensors.filter(s => s.hit).length;
    if (hits === 4) {
      this.onFeedback('Spectacular! Laser beam redirected through all 4 optical sensors!', 'success');
      sound.success();
      this.onSuccess({ perfect: true });
    } else {
      this.onFeedback(`Only ${hits} of 4 sensors hit by the laser. Click mirrors to rotate them!`, 'error');
      sound.error();
    }
  }

  showSolution() {
    this.onFeedback('Configuring 4 mirrors to create rectangular sensor circuit...', 'info');
    // Solution angles:
    // (1,2) -> '\' reflects Down to Right
    // (1,5) -> '/' reflects Right to Down
    // (4,5) -> '\' reflects Down to Left
    // (4,2) -> '/' reflects Left to Down
    this.mirrors['1,2'].angle = '\\';
    this.mirrors['1,5'].angle = '/';
    this.mirrors['4,5'].angle = '\\';
    this.mirrors['4,2'].angle = '/';
    sound.success();
    this.traceLaser();
    this.notifyState();
    this.render();
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const cs = this.cellSize;
    const w = this.width;

    ctx.clearRect(0, 0, w, w);

    // Draw grid tiles
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cs, r * cs, cs, cs);
      }
    }

    // Draw Laser Path
    if (this.laserPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.laserPath[0].c * cs + cs / 2, this.laserPath[0].r * cs + cs / 2);
      for (let i = 1; i < this.laserPath.length; i++) {
        ctx.lineTo(this.laserPath[i].c * cs + cs / 2, this.laserPath[i].r * cs + cs / 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw Mirrors
    for (const key in this.mirrors) {
      const m = this.mirrors[key];
      const cx = m.c * cs + cs / 2;
      const cy = m.r * cs + cs / 2;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(m.c * cs + 4, m.r * cs + 4, cs - 8, cs - 8);
      ctx.strokeStyle = 'var(--accent-cyan)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(m.c * cs + 4, m.r * cs + 4, cs - 8, cs - 8);

      // Angled Mirror surface
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      if (m.angle === '/') {
        ctx.moveTo(cx - cs * 0.3, cy + cs * 0.3);
        ctx.lineTo(cx + cs * 0.3, cy - cs * 0.3);
      } else {
        ctx.moveTo(cx - cs * 0.3, cy - cs * 0.3);
        ctx.lineTo(cx + cs * 0.3, cy + cs * 0.3);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw Sensors
    this.sensors.forEach(s => {
      const cx = s.c * cs + cs / 2;
      const cy = s.r * cs + cs / 2;

      ctx.save();
      if (s.hit) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#34d399';
      } else {
        ctx.fillStyle = '#334155';
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "Plus Jakarta Sans"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.label, cx, cy);
      ctx.restore();
    });

    // Draw Emitter
    const ex = this.emitter.c * cs + cs / 2;
    const ey = this.emitter.r * cs + cs / 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ex, ey, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LASER', ex, ey);
  }

  destroy() {
    if (this._cleanup) this._cleanup();
  }
}
