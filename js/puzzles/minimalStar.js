/**
 * Level 3: Continuous Star Flow (Eulerian Path Envelope Graph)
 * Trace all 8 edges of the envelope without lifting or repeating edges.
 */

import { sound } from '../sound.js';

export class MinimalStarPuzzle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.traversedEdges = []; // ["A-B", "B-C", ...]
    this.visitedNodes = [];   // ["A", "B", ...]
    this.currentNode = null;
    this.animatingSolution = false;

    this.dpr = window.devicePixelRatio || 1;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="line-puzzle-wrapper">
        <div class="canvas-overlay-container">
          <canvas id="minimal-star-canvas"></canvas>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#minimal-star-canvas');
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

    this.calcGraph();
  }

  calcGraph() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const w = this.width * 0.44;
    const h = this.height * 0.44;

    this.nodes = {
      A: { id: 'A', x: cx - w / 2, y: cy + h / 2, label: 'A' },
      B: { id: 'B', x: cx + w / 2, y: cy + h / 2, label: 'B' },
      C: { id: 'C', x: cx - w / 2, y: cy - h * 0.1, label: 'C' },
      D: { id: 'D', x: cx + w / 2, y: cy - h * 0.1, label: 'D' },
      E: { id: 'E', x: cx, y: cy - h * 0.7, label: 'E' }
    };

    // 8 defined edges
    this.validEdges = [
      'A-B', 'A-C', 'B-D', 'C-D', 'C-E', 'D-E', 'A-D', 'B-C'
    ];
  }

  getEdgeKey(u, v) {
    return [u, v].sort().join('-');
  }

  bindEvents() {
    const canvas = this.canvas;

    const handleClick = (e) => {
      if (this.animatingSolution) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

      // Find nearest node within 32px
      let clickedNode = null;
      for (const key in this.nodes) {
        const n = this.nodes[key];
        const dist = Math.hypot(n.x - x, n.y - y);
        if (dist <= 36) {
          clickedNode = n.id;
          break;
        }
      }

      if (clickedNode) {
        this.selectNode(clickedNode);
      }
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleClick(e);
    }, { passive: false });

    this._cleanup = () => {
      canvas.removeEventListener('click', handleClick);
    };
  }

  selectNode(nodeId) {
    if (!this.currentNode) {
      // Start path at this node
      this.currentNode = nodeId;
      this.visitedNodes = [nodeId];
      sound.click();
      this.onFeedback(`Path started at Node ${nodeId}. Now tap connected neighbors!`, 'info');
      this.notifyState();
      this.render();
      return;
    }

    if (nodeId === this.currentNode) {
      this.onFeedback(`Already at Node ${nodeId}. Choose a neighboring node.`, 'info');
      return;
    }

    const edgeKey = this.getEdgeKey(this.currentNode, nodeId);
    if (!this.validEdges.includes(edgeKey)) {
      this.onFeedback(`No direct edge between ${this.currentNode} and ${nodeId}!`, 'error');
      sound.error();
      return;
    }

    if (this.traversedEdges.includes(edgeKey)) {
      this.onFeedback(`Edge ${this.currentNode}-${nodeId} was already traversed! Cannot retrace edges.`, 'error');
      sound.error();
      return;
    }

    // Traverse edge
    this.traversedEdges.push(edgeKey);
    this.currentNode = nodeId;
    this.visitedNodes.push(nodeId);
    sound.dotHit(this.traversedEdges.length);
    this.notifyState();
    this.render();

    if (this.traversedEdges.length === 8) {
      this.onFeedback('Masterful! You traversed all 8 edges in one continuous stroke!', 'success');
      sound.success();
      this.onSuccess({ moves: 8, perfect: true });
    }
  }

  notifyState() {
    this.onStateChange({
      edgesDone: this.traversedEdges.length,
      totalEdges: 8,
      currentNode: this.currentNode
    });
  }

  undo() {
    if (this.animatingSolution) return;
    if (this.traversedEdges.length > 0) {
      this.traversedEdges.pop();
      this.visitedNodes.pop();
      this.currentNode = this.visitedNodes[this.visitedNodes.length - 1] || null;
      sound.click();
      this.notifyState();
      this.render();
      this.onFeedback('Last step undone.', 'info');
    } else if (this.currentNode) {
      this.currentNode = null;
      this.visitedNodes = [];
      this.notifyState();
      this.render();
    }
  }

  clear() {
    if (this.animatingSolution) return;
    this.traversedEdges = [];
    this.visitedNodes = [];
    this.currentNode = null;
    sound.click();
    this.notifyState();
    this.render();
    this.onFeedback('Puzzle reset.', 'info');
  }

  validate() {
    if (this.traversedEdges.length === 8) {
      this.onSuccess({ moves: 8, perfect: true });
    } else {
      this.onFeedback(`Only ${this.traversedEdges.length} of 8 edges traced. Keep going!`, 'error');
      sound.error();
    }
  }

  showSolution() {
    this.clear();
    this.animatingSolution = true;
    this.onFeedback('Demonstrating Euler path starting at bottom-left node A...', 'info');

    // Valid Euler path: A -> C -> E -> D -> C -> B -> D -> A -> B
    const seq = ['A', 'C', 'E', 'D', 'C', 'B', 'D', 'A', 'B'];
    let idx = 0;

    const step = () => {
      if (idx >= seq.length) {
        this.animatingSolution = false;
        return;
      }
      this.selectNode(seq[idx]);
      idx++;
      if (idx < seq.length) {
        setTimeout(step, 600);
      }
    };
    step();
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Draw all potential edges (faint dashed lines)
    this.validEdges.forEach(key => {
      const [u, v] = key.split('-');
      const p1 = this.nodes[u];
      const p2 = this.nodes[v];
      const isTraversed = this.traversedEdges.includes(key);

      ctx.save();
      if (isTraversed) {
        // Glowing cyan traversed edge
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      } else {
        // Untraversed potential edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Draw Nodes
    for (const key in this.nodes) {
      const node = this.nodes[key];
      const isCurrent = this.currentNode === key;
      const isVisited = this.visitedNodes.includes(key);

      ctx.save();
      if (isCurrent) {
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
        ctx.fill();
      } else if (isVisited) {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 13, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 13, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
      ctx.restore();
    }
  }

  destroy() {
    if (this._cleanup) this._cleanup();
  }
}
