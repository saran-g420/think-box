/**
 * Level 8: The 16-Dot Matrix
 * Connect all 16 dots in a 4x4 grid using exactly 6 continuous straight lines.
 */

import { Geometry } from '../geometry.js';
import { sound } from '../sound.js';

export class DotMatrixPuzzle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.segments = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.animatingSolution = false;

    this.dpr = window.devicePixelRatio || 1;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="line-puzzle-wrapper">
        <div class="canvas-overlay-container">
          <canvas id="dot-matrix-canvas"></canvas>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#dot-matrix-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.bindEvents();
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const size = Math.min(parent.clientWidth || 460, 480);
    this.width = size;
    this.height = size;

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.calcGrid();
  }

  calcGrid() {
    // 4x4 grid centered with margin for outside-the-box lines
    const boxSize = this.width * 0.54;
    const startX = (this.width - boxSize) / 2;
    const startY = (this.height - boxSize) / 2;
    const step = boxSize / 3;

    this.boxRect = {
      x: startX,
      y: startY,
      width: boxSize,
      height: boxSize
    };

    this.dots = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        this.dots.push({
          id: r * 4 + c,
          r,
          c,
          x: startX + c * step,
          y: startY + r * step,
          radius: 9,
          hit: false
        });
      }
    }
  }

  bindEvents() {
    const canvas = this.canvas;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      if (this.animatingSolution) return;
      e.preventDefault();
      if (this.segments.length >= 6) {
        this.onFeedback('Maximum 6 lines reached! Submit or Undo/Clear to adjust.', 'info');
        return;
      }
      this.isDrawing = true;
      this.currentStroke = [getPos(e)];
      sound.draw();
      this.render();
    };

    const moveDraw = (e) => {
      if (!this.isDrawing || this.animatingSolution) return;
      e.preventDefault();
      const pos = getPos(e);
      const last = this.currentStroke[this.currentStroke.length - 1];
      if (Geometry.dist(pos, last) > 4) {
        this.currentStroke.push(pos);
        this.checkDotHits();
        this.render();
      }
    };

    const endDraw = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (!this.currentStroke || this.currentStroke.length < 2) return;

      const simplified = Geometry.simplifyPath(this.currentStroke, 18);
      for (let i = 0; i < simplified.length - 1; i++) {
        if (this.segments.length < 6) {
          if (this.segments.length > 0) {
            const lastEnd = this.segments[this.segments.length - 1][1];
            if (Geometry.dist(simplified[i], lastEnd) > 35) {
              this.onFeedback('Lines must be continuous without lifting the pen!', 'error');
              sound.error();
              this.render();
              return;
            }
            this.segments.push([lastEnd, simplified[i + 1]]);
          } else {
            this.segments.push([simplified[i], simplified[i + 1]]);
          }
        }
      }

      this.currentStroke = null;
      this.checkDotHits();
      this.notifyState();
      this.render();
    };

    canvas.addEventListener('mousedown', startDraw);
    window.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    window.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw);

    this._cleanup = () => {
      canvas.removeEventListener('mousedown', startDraw);
      window.removeEventListener('mousemove', moveDraw);
      window.removeEventListener('mouseup', endDraw);
      canvas.removeEventListener('touchstart', startDraw);
      window.removeEventListener('touchmove', moveDraw);
      window.removeEventListener('touchend', endDraw);
    };
  }

  notifyState() {
    const hits = this.dots.filter(d => d.hit).length;
    this.onStateChange({
      linesUsed: this.segments.length,
      maxLines: 6,
      dotsHit: hits,
      totalDots: 16
    });
  }

  checkDotHits() {
    this.dots.forEach((dot, idx) => {
      let isHit = false;
      for (const seg of this.segments) {
        if (Geometry.isDotCoveredBySegment(dot, seg[0], seg[1], 15)) {
          isHit = true;
          break;
        }
      }
      if (!isHit && this.currentStroke && this.currentStroke.length >= 2) {
        if (Geometry.isDotCoveredByPolyline(dot, this.currentStroke, 15)) {
          isHit = true;
        }
      }
      if (!dot.hit && isHit) {
        sound.dotHit(idx);
      }
      dot.hit = isHit;
    });
  }

  undo() {
    if (this.animatingSolution) return;
    if (this.segments.length > 0) {
      this.segments.pop();
      sound.click();
      this.checkDotHits();
      this.notifyState();
      this.render();
      this.onFeedback('Last segment undone.', 'info');
    }
  }

  clear() {
    if (this.animatingSolution) return;
    this.segments = [];
    this.currentStroke = null;
    this.dots.forEach(d => d.hit = false);
    sound.click();
    this.notifyState();
    this.render();
    this.onFeedback('Canvas cleared.', 'info');
  }

  validate() {
    this.checkDotHits();
    const hitCount = this.dots.filter(d => d.hit).length;
    const segmentCount = this.segments.length;

    if (segmentCount === 0) {
      this.onFeedback('Draw lines across the 16 dots!', 'error');
      sound.error();
      return;
    }

    if (hitCount < 16) {
      this.onFeedback(`Only ${hitCount} of 16 dots connected! Missed dots are highlighted in orange.`, 'error');
      sound.error();
      return;
    }

    if (segmentCount > 6) {
      this.onFeedback(`All dots covered, but you used ${segmentCount} lines! Exactly 6 lines allowed.`, 'error');
      sound.error();
      return;
    }

    this.onFeedback('Phenomenal! All 16 dots connected in 6 lines by projecting past the grid!', 'success');
    sound.success();
    this.onSuccess({ linesUsed: segmentCount, perfect: true });
  }

  showSolution() {
    this.clear();
    this.animatingSolution = true;
    this.onFeedback('Demonstrating 6-line 16-dot solution extending past perimeter...', 'info');

    const step = this.boxRect.width / 3;
    const sx = this.boxRect.x;
    const sy = this.boxRect.y;

    // Symmetrical exterior 6-line trajectory for 4x4
    const pts = [
      { x: sx, y: sy + 3 * step },            // (0,3) bottom-left
      { x: sx, y: sy - step },                // beyond top-left
      { x: sx + 4 * step, y: sy + 3 * step }, // beyond bottom-right
      { x: sx + step, y: sy + 3 * step },     // (1,3)
      { x: sx + 4 * step, y: sy },            // beyond top-right
      { x: sx + step, y: sy },                // (1,0)
      { x: sx + 3 * step, y: sy + 2 * step }  // slice remaining dots
    ];

    let i = 0;
    const run = () => {
      if (i >= pts.length - 1) {
        this.animatingSolution = false;
        this.checkDotHits();
        this.notifyState();
        this.render();
        return;
      }
      this.segments.push([pts[i], pts[i + 1]]);
      sound.dotHit(i * 2);
      this.checkDotHits();
      this.notifyState();
      this.render();
      i++;
      setTimeout(run, 650);
    };
    setTimeout(run, 350);
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Box perimeter
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.boxRect.x, this.boxRect.y, this.boxRect.width, this.boxRect.height);
    ctx.restore();

    // Segments
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.segments.forEach(([a, b], idx) => {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    if (this.currentStroke && this.currentStroke.length > 1) {
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.currentStroke[0].x, this.currentStroke[0].y);
      for (let i = 1; i < this.currentStroke.length; i++) {
        ctx.lineTo(this.currentStroke[i].x, this.currentStroke[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Dots
    this.dots.forEach(dot => {
      ctx.save();
      if (dot.hit) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius + 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius - 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  destroy() {
    if (this._cleanup) this._cleanup();
  }
}
