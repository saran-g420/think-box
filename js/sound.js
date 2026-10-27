/**
 * Audio Synthesizer using Web Audio API
 * Zero external audio file dependencies - 100% reliable, instant, offline-capable
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initAudioContext();
  }

  initAudioContext() {
    if (!this.ctx && (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.initAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.15, volume = 0.2, attack = 0.01, decay = 0.1) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, this.ctx.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  click() {
    if (this.muted) return;
    this.playTone(800, 'triangle', 0.05, 0.15, 0.005, 0.04);
  }

  draw() {
    if (this.muted) return;
    this.playTone(320, 'sine', 0.04, 0.06, 0.01, 0.03);
  }

  dotHit(index = 0) {
    if (this.muted) return;
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
    const freq = pentatonic[index % pentatonic.length];
    this.playTone(freq, 'sine', 0.18, 0.25, 0.01, 0.15);
  }

  hint() {
    if (this.muted) return;
    this.playTone(587.33, 'triangle', 0.12, 0.18, 0.01, 0.1);
    setTimeout(() => {
      this.playTone(880.00, 'sine', 0.25, 0.22, 0.02, 0.2);
    }, 90);
  }

  error() {
    if (this.muted) return;
    this.playTone(180, 'sawtooth', 0.12, 0.2, 0.01, 0.1);
    setTimeout(() => {
      this.playTone(140, 'sawtooth', 0.18, 0.25, 0.01, 0.15);
    }, 100);
  }

  success() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.35, 0.25, 0.02, 0.3);
      }, i * 90);
    });
  }

  victory() {
    if (this.muted) return;
    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.00],
      [659.25, 830.61, 987.77],
      [1046.50, 1318.51, 1567.98]
    ];
    chords.forEach((chord, step) => {
      setTimeout(() => {
        chord.forEach(f => this.playTone(f, 'sine', 0.5, 0.18, 0.02, 0.45));
      }, step * 200);
    });
  }
}

export const sound = new SoundManager();
