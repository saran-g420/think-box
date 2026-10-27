/**
 * Level 1: The Nine-Dot Classic Puzzle
 * 3x3 grid where lines MUST extend beyond the imaginary box.
 */

import { Geometry } from '../geometry.js';
import { sound } from '../sound.js';

export class NineDotPuzzle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.points = []; // [{x, y}] user stroke points
    this.segments = []; // [[pA, pB], [pB, pC], ...]
    this.isDrawing = false;
    this.animatingSolution = false;

    this.canvas = null;
    this.ctx = null;
    this.dpr = window.devicePixelRatio || 1;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="line-puzzle-wrapper">
        <div class="canvas-overlay-container">
          <canvas id="nine-dot-canvas"></canvas>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#nine-dot-canvas');
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
    // 3x3 grid positioned centrally with 35% margin for "Outside the Box" extensions
    const boxSize = this.width * 0.52;
    const startX = (this.width - boxSize) / 2;
    const startY = (this.height - boxSize) / 2;
    const step = boxSize / 2;

    this.boxRect = {
      x: startX,
      y: startY,
      width: boxSize,
      height: boxSize
    };

    this.dots = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        this.dots.push({
          id: row * 3 + col,
          row,
          col,
          x: startX + col * step,
          y: startY + row * step,
          radius: 10,
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
      const pos = getPos(e);
      this.isDrawing = true;

      // Start new stroke or continue
      if (this.segments.length >= 4) {
        this.onFeedback('Maximum 4 lines reached! Submit or Undo/Clear to adjust.', 'info');
        return;
      }

      this.currentStroke = [pos];
      sound.draw();
      this.render();
    };

    const moveDraw = (e) => {
      if (!this.isDrawing || this.animatingSolution) return;
      e.preventDefault();
      const pos = getPos(e);
      const last = this.currentStroke[this.currentStroke.length - 1];

      // Minimum move distance to avoid jitter
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

      // Simplify current stroke into straight segment(s)
      const simplified = Geometry.simplifyPath(this.currentStroke, 18);
      for (let i = 0; i < simplified.length - 1; i++) {
        if (this.segments.length < 4) {
          // If we already have segments, check continuity with last endpoint
          if (this.segments.length > 0) {
            const lastSegment = this.segments[this.segments.length - 1];
            const lastEnd = lastSegment[1];
            // Snap to last point if reasonably close (within 35px), or bridge it
            if (Geometry.dist(simplified[i], lastEnd) > 35) {
              this.onFeedback('Line must be continuous! Please draw without lifting the pen.', 'error');
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
      maxLines: 4,
      dotsHit: hits,
      totalDots: 9
    });
  }

  checkDotHits() {
    let newHitOccurred = false;
    this.dots.forEach((dot, idx) => {
      let isHit = false;

      // Check committed segments
      for (const seg of this.segments) {
        if (Geometry.isDotCoveredBySegment(dot, seg[0], seg[1], 16)) {
          isHit = true;
          break;
        }
      }

      // Check active drawing stroke
      if (!isHit && this.currentStroke && this.currentStroke.length >= 2) {
        if (Geometry.isDotCoveredByPolyline(dot, this.currentStroke, 16)) {
          isHit = true;
        }
      }

      if (!dot.hit && isHit) {
        newHitOccurred = true;
        sound.dotHit(idx);
      }
      dot.hit = isHit;
    });

    if (newHitOccurred) {
      this.notifyState();
    }
  }

  undo() {
    if (this.animatingSolution) return;
    if (this.segments.length > 0) {
      this.segments.pop();
      sound.click();
      this.checkDotHits();
      this.notifyState();
      this.render();
      this.onFeedback('Removed last line segment.', 'info');
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
    if (this.animatingSolution) return;
    this.checkDotHits();

    const hitCount = this.dots.filter(d => d.hit).length;
    const segmentCount = this.segments.length;

    if (segmentCount === 0) {
      this.onFeedback('Please draw your lines across the dots first!', 'error');
      sound.error();
      return;
    }

    if (hitCount < 9) {
      const missed = 9 - hitCount;
      this.onFeedback(`You missed ${missed} dot${missed > 1 ? 's' : ''}! Notice the unhit dots highlighted in amber.`, 'error');
      sound.error();
      this.render();
      return;
    }

    if (segmentCount > 4) {
      this.onFeedback(`All dots covered, but you used ${segmentCount} lines! Exactly 4 straight lines required.`, 'error');
      sound.error();
      return;
    }

    // Success!
    this.onFeedback('Brilliant! You connected all 9 dots in 4 straight lines by thinking outside the box!', 'success');
    sound.success();
    this.onSuccess({
      linesUsed: segmentCount,
      perfect: segmentCount === 4
    });
  }

  showSolution() {
    this.clear();
    this.animatingSolution = true;
    this.onFeedback('Demonstrating classic 4-line solution extending beyond the box...', 'info');

    // Classic Solution coordinates:
    // Dot 6 (bottom-left): row 2, col 0
    // Dot 0 (top-left): row 0, col 0
    // Overshoot Point 1: row -1, col 0 (above top-left)
    // Overshoot Point 2: row 2, col 3 (past bottom-right)
    // Point 3: row 2, col 0 (bottom-left)
    // Point 4: row 0, col 2 (top-right)
    const step = this.boxRect.width / 2;
    const startX = this.boxRect.x;
    const startY = this.boxRect.y;

    const p0 = { x: startX, y: startY + 2 * step }; // Dot bottom-left
    const p1 = { x: startX, y: startY - step };      // Beyond top-left
    const p2 = { x: startX + 3 * step, y: startY + 2 * step }; // Beyond bottom-right
    const p3 = { x: startX, y: startY + 2 * step }; // Back to bottom-left
    const p4 = { x: startX + 2 * step, y: startY }; // Top-right dot

    const keyPoints = [p0, p1, p2, p3, p4];
    let stepIdx = 0;

    const drawStep = () => {
      if (stepIdx >= keyPoints.length - 1) {
        this.animatingSolution = false;
        this.checkDotHits();
        this.notifyState();
        this.render();
        this.onFeedback('Notice how the lines extend far outside the square boundary!', 'success');
        return;
      }

      this.segments.push([keyPoints[stepIdx], keyPoints[stepIdx + 1]]);
      sound.dotHit(stepIdx * 2);
      this.checkDotHits();
      this.notifyState();
      this.render();
      stepIdx++;
      setTimeout(drawStep, 650);
    };

    setTimeout(drawStep, 400);
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Subtle Background Grid Texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const cellSize = 30;
    for (let x = 0; x <= w; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. The Imaginary "Box" Perimeter
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.boxRect.x, this.boxRect.y, this.boxRect.width, this.boxRect.height);

    ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE ASSUMED BOX', this.boxRect.x + this.boxRect.width / 2, this.boxRect.y - 8);
    ctx.restore();

    // 3. User Drawn Segments
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.segments.forEach(([a, b], idx) => {
      // Glow
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Core line
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Number badge on segment
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(midX, midY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${idx + 1}`, midX, midY);
    });

    // 4. Current In-Progress Freehand Stroke
    if (this.currentStroke && this.currentStroke.length > 1) {
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(this.currentStroke[0].x, this.currentStroke[0].y);
      for (let i = 1; i < this.currentStroke.length; i++) {
        ctx.lineTo(this.currentStroke[i].x, this.currentStroke[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 5. The Nine Dots
    this.dots.forEach(dot => {
      ctx.save();
      if (dot.hit) {
        // Glowing Cyan Halo
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius - 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Unhit Dot (Subtle Charcoal with Light Border)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
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
