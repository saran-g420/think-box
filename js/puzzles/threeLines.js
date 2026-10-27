/**
 * Level 2: Five Dots, Three Lines (The Triangle Envelope)
 * Connect 5 dots using only 3 continuous lines.
 */

import { Geometry } from '../geometry.js';
import { sound } from '../sound.js';

export class ThreeLinesPuzzle {
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
          <canvas id="three-lines-canvas"></canvas>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#three-lines-canvas');
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

    this.calcDots();
  }

  calcDots() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const span = this.width * 0.28;

    // 5 dots: Apex (top), Center, Left, Right, Bottom
    this.dots = [
      { id: 0, x: cx, y: cy - span * 1.1, radius: 10, hit: false, label: 'A' },
      { id: 1, x: cx - span, y: cy + span * 0.7, radius: 10, hit: false, label: 'B' },
      { id: 2, x: cx + span, y: cy + span * 0.7, radius: 10, hit: false, label: 'C' },
      { id: 3, x: cx, y: cy, radius: 10, hit: false, label: 'D' },
      { id: 4, x: cx, y: cy + span * 0.7, radius: 10, hit: false, label: 'E' }
    ];
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
      if (this.segments.length >= 3) {
        this.onFeedback('Maximum 3 lines reached! Submit or Clear to try again.', 'info');
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
        if (this.segments.length < 3) {
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
      maxLines: 3,
      dotsHit: hits,
      totalDots: 5
    });
  }

  checkDotHits() {
    this.dots.forEach((dot, idx) => {
      let isHit = false;
      for (const seg of this.segments) {
        if (Geometry.isDotCoveredBySegment(dot, seg[0], seg[1], 18)) {
          isHit = true;
          break;
        }
      }
      if (!isHit && this.currentStroke && this.currentStroke.length >= 2) {
        if (Geometry.isDotCoveredByPolyline(dot, this.currentStroke, 18)) {
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
      this.onFeedback('Draw your lines across the five dots!', 'error');
      sound.error();
      return;
    }

    if (hitCount < 5) {
      this.onFeedback(`Only ${hitCount} of 5 dots connected. You must touch all 5 dots!`, 'error');
      sound.error();
      return;
    }

    if (segmentCount > 3) {
      this.onFeedback(`All dots covered, but you used ${segmentCount} lines! Exactly 3 straight lines required.`, 'error');
      sound.error();
      return;
    }

    this.onFeedback('Fantastic! Connected all 5 dots in 3 lines by forming an exterior triangle slice!', 'success');
    sound.success();
    this.onSuccess({ linesUsed: segmentCount, perfect: true });
  }

  showSolution() {
    this.clear();
    this.animatingSolution = true;
    this.onFeedback('Showing 3-line envelope solution...', 'info');

    // Solution:
    // Line 1: From left of base (x: cx - span*1.4, y: cy + span*0.7) through Left and Bottom to Right (cx + span*1.3, cy + span*0.7)
    // Line 2: From (cx + span*1.3, cy + span*0.7) diagonally up past apex to (cx, cy - span*1.8)
    // Line 3: From (cx, cy - span*1.8) straight down through Apex and Center!
    const cx = this.width / 2;
    const cy = this.height / 2;
    const span = this.width * 0.28;

    const p0 = { x: cx - span * 1.3, y: cy + span * 0.7 };
    const p1 = { x: cx + span * 1.3, y: cy + span * 0.7 };
    const p2 = { x: cx, y: cy - span * 1.7 };
    const p3 = { x: cx, y: cy + span * 0.7 };

    const pts = [p0, p1, p2, p3];
    let step = 0;

    const runStep = () => {
      if (step >= pts.length - 1) {
        this.animatingSolution = false;
        this.checkDotHits();
        this.notifyState();
        this.render();
        return;
      }
      this.segments.push([pts[step], pts[step + 1]]);
      sound.dotHit(step * 2);
      this.checkDotHits();
      this.notifyState();
      this.render();
      step++;
      setTimeout(runStep, 650);
    };

    setTimeout(runStep, 350);
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

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
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
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
