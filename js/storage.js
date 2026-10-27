/**
 * Persistent Storage Manager with Safe Fallback
 */

const STORAGE_KEY = 'think_outside_box_save_v1';

class StorageManager {
  constructor() {
    this.memoryState = {
      unlockedLevel: 1,
      completedLevels: [],
      scores: {},
      times: {},
      muted: false
    };
    this.storageAvailable = this.checkStorage();
    this.load();
  }

  checkStorage() {
    try {
      if (typeof localStorage === 'undefined') return false;
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('LocalStorage unavailable, running in memory-only mode');
      return false;
    }
  }

  load() {
    if (!this.storageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.memoryState = { ...this.memoryState, ...parsed };
      }
    } catch (e) {
      console.error('Error reading localStorage save:', e);
    }
  }

  save() {
    if (!this.storageAvailable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryState));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }

  getUnlockedLevel() {
    return this.memoryState.unlockedLevel || 1;
  }

  isLevelUnlocked(levelId) {
    return levelId <= (this.memoryState.unlockedLevel || 1);
  }

  isLevelCompleted(levelId) {
    return (this.memoryState.completedLevels || []).includes(levelId);
  }

  getLevelScore(levelId) {
    return (this.memoryState.scores && this.memoryState.scores[levelId]) || 0;
  }

  getLevelTime(levelId) {
    return (this.memoryState.times && this.memoryState.times[levelId]) || null;
  }

  getTotalScore() {
    const scores = this.memoryState.scores || {};
    return Object.values(scores).reduce((a, b) => a + b, 0);
  }

  getCompletedCount() {
    return (this.memoryState.completedLevels || []).length;
  }

  saveLevelCompletion(levelId, score, time) {
    if (!this.memoryState.completedLevels.includes(levelId)) {
      this.memoryState.completedLevels.push(levelId);
    }

    const currentBest = this.memoryState.scores[levelId] || 0;
    if (score > currentBest) {
      this.memoryState.scores[levelId] = score;
    }

    const currentBestTime = this.memoryState.times[levelId];
    if (!currentBestTime || time < currentBestTime) {
      this.memoryState.times[levelId] = time;
    }

    // Unlock next level
    if (levelId >= this.memoryState.unlockedLevel && levelId < 10) {
      this.memoryState.unlockedLevel = levelId + 1;
    }

    this.save();
  }

  getMuted() {
    return !!this.memoryState.muted;
  }

  setMuted(muted) {
    this.memoryState.muted = !!muted;
    this.save();
  }

  resetProgress() {
    this.memoryState = {
      unlockedLevel: 1,
      completedLevels: [],
      scores: {},
      times: {},
      muted: this.memoryState.muted
    };
    this.save();
  }
}

export const storage = new StorageManager();
