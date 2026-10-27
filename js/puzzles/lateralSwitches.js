/**
 * Level 7: The Three Switches Paradox (Lateral Logic)
 * 3 switches outside, 1 bulb inside. Uses thermal physics to deduce the correct switch.
 */

import { sound } from '../sound.js';

export class LateralSwitchesPuzzle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // Target switch is 'A'
    this.correctSwitch = 'A';

    this.switches = { A: false, B: false, C: false };
    this.bulbHeat = 0; // 0 = Cold, 1-4 = Warm, 5+ = Hot
    this.inRoom = false;
    this.touchedBulb = false;
    this.doorLocked = false;

    this.startThermalTimer();
    this.init();
  }

  init() {
    this.render();
  }

  startThermalTimer() {
    this.thermalInterval = setInterval(() => {
      // If the correct switch (A) is ON, heat increases
      if (this.switches[this.correctSwitch]) {
        this.bulbHeat = Math.min(10, this.bulbHeat + 1);
      } else {
        // Slowly cools down
        if (this.bulbHeat > 0) {
          this.bulbHeat = Math.max(0, this.bulbHeat - 0.25);
        }
      }
    }, 1000);
  }

  toggleSwitch(id) {
    if (this.inRoom) return;
    this.switches[id] = !this.switches[id];
    sound.click();
    this.notifyState();
    this.render();
  }

  enterRoom() {
    this.inRoom = true;
    this.doorLocked = true;
    sound.click();
    this.onFeedback('Entered the room! The door has latched shut. Inspect the bulb and declare your answer.', 'info');
    this.notifyState();
    this.render();
  }

  touchBulb() {
    this.touchedBulb = true;
    sound.click();

    let tempDesc = 'Completely Cold';
    if (this.bulbHeat >= 4) {
      tempDesc = '🔥 Very Hot to the touch! Electricity flowed through it recently.';
    } else if (this.bulbHeat >= 1.5) {
      tempDesc = '♨️ Lukewarm to the touch.';
    } else {
      tempDesc = '❄️ Completely room-temperature / cold.';
    }

    this.onFeedback(`Bulb Inspection: ${tempDesc}`, 'info');
    this.render();
  }

  submitAnswer(choice) {
    if (choice === this.correctSwitch) {
      this.onFeedback(`Spot on! Switch ${choice} controls the bulb! You cracked the lateral physics puzzle!`, 'success');
      sound.success();
      this.onSuccess({ perfect: true });
    } else {
      this.onFeedback(`Incorrect. It was Switch ${this.correctSwitch}. Remember: leaving Switch A ON heats the glass even after turned off!`, 'error');
      sound.error();
    }
  }

  notifyState() {
    this.onStateChange({
      inRoom: this.inRoom,
      switches: { ...this.switches },
      bulbLit: this.switches[this.correctSwitch]
    });
  }

  undo() {
    this.clear();
  }

  clear() {
    this.switches = { A: false, B: false, C: false };
    this.bulbHeat = 0;
    this.inRoom = false;
    this.touchedBulb = false;
    this.doorLocked = false;
    sound.click();
    this.notifyState();
    this.render();
    this.onFeedback('Switches reset. Outside room.', 'info');
  }

  validate() {
    if (!this.inRoom) {
      this.onFeedback('First enter the room to inspect the bulb and choose a switch!', 'error');
      sound.error();
    }
  }

  showSolution() {
    this.clear();
    this.onFeedback('Demonstrating lateral thermal solution: Switch A ON (heat for 6s), then Switch A OFF, Switch B ON, enter room!', 'info');
    this.toggleSwitch('A');
    this.bulbHeat = 6;
    setTimeout(() => {
      this.toggleSwitch('A');
      this.toggleSwitch('B');
      setTimeout(() => {
        this.enterRoom();
        setTimeout(() => {
          this.touchBulb();
        }, 500);
      }, 500);
    }, 1200);
  }

  render() {
    const isLit = this.switches[this.correctSwitch];

    if (!this.inRoom) {
      // Outside Room View (Switches)
      this.container.innerHTML = `
        <div class="line-puzzle-wrapper" style="flex-direction: column; gap: 20px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);">
            Outside the Sealed Room: Toggle switches, then click Enter Room.
          </div>
          <div class="switch-room-board">
            <div class="room-partition">
              <span style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-cyan);">
                Switch Panel (Outside)
              </span>

              ${['A', 'B', 'C'].map(sw => `
                <div class="switch-unit ${this.switches[sw] ? 'is-on' : ''}" data-sw="${sw}">
                  <span style="font-weight: 700; font-size: 1rem;">Switch ${sw}</span>
                  <div class="switch-toggle-pill"></div>
                </div>
              `).join('')}

              <button id="btn-enter-room" class="btn-primary" style="margin-top: 14px; width: 100%;">
                🚪 Enter Sealed Room (One-way)
              </button>
            </div>

            <div class="room-partition" style="opacity: 0.6; justify-content: center; text-align: center;">
              <span style="font-size: 48px;">🔒</span>
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-secondary);">Door Closed</span>
              <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
                The incandescent light bulb is inside. You cannot see through the door.
              </p>
            </div>
          </div>
        </div>
      `;

      this.container.querySelectorAll('[data-sw]').forEach(el => {
        el.addEventListener('click', (e) => {
          const sw = e.currentTarget.getAttribute('data-sw');
          this.toggleSwitch(sw);
        });
      });

      const enterBtn = this.container.querySelector('#btn-enter-room');
      if (enterBtn) {
        enterBtn.addEventListener('click', () => this.enterRoom());
      }
    } else {
      // Inside Room View (Bulb & Deductions)
      let tempLabel = 'Not Touched Yet';
      if (this.touchedBulb) {
        if (this.bulbHeat >= 4) tempLabel = '🔥 Very Hot!';
        else if (this.bulbHeat >= 1.5) tempLabel = '♨️ Lukewarm';
        else tempLabel = '❄️ Completely Cold';
      }

      this.container.innerHTML = `
        <div class="line-puzzle-wrapper" style="flex-direction: column; gap: 20px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan);">
            Inside the Sealed Room (Door Locked)
          </div>
          <div class="switch-room-board" style="max-width: 540px; flex-direction: column; align-items: center;">
            
            <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 14px;">
              <div class="lightbulb-graphic ${isLit ? 'lit' : ''}">
                <span style="font-size: 38px;">${isLit ? '💡' : '🌑'}</span>
              </div>
              <div style="font-weight: 700; font-size: 1.1rem; color: ${isLit ? '#facc15' : 'var(--text-muted)'};">
                ${isLit ? 'Light is ON' : 'Light is OFF'}
              </div>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center;">
              <button id="btn-touch-bulb" class="btn-secondary" style="font-size: 0.85rem;">
                ✋ Feel Bulb Temperature
              </button>
              <div style="font-weight: 700; font-size: 0.9rem; color: #fde047;">
                Temp: ${tempLabel}
              </div>
            </div>

            <div style="width: 100%; border-top: 1px solid var(--border-subtle); padding-top: 16px; text-align: center;">
              <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 12px;">
                Which switch controls the bulb?
              </span>
              <div style="display: flex; gap: 14px; justify-content: center;">
                <button class="btn-secondary btn-choice" data-choice="A" style="padding: 10px 24px; font-size: 1.05rem;">Switch A</button>
                <button class="btn-secondary btn-choice" data-choice="B" style="padding: 10px 24px; font-size: 1.05rem;">Switch B</button>
                <button class="btn-secondary btn-choice" data-choice="C" style="padding: 10px 24px; font-size: 1.05rem;">Switch C</button>
              </div>
            </div>

          </div>
        </div>
      `;

      const touchBtn = this.container.querySelector('#btn-touch-bulb');
      if (touchBtn) touchBtn.addEventListener('click', () => this.touchBulb());

      this.container.querySelectorAll('.btn-choice').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const choice = e.currentTarget.getAttribute('data-choice');
          this.submitAnswer(choice);
        });
      });
    }
  }

  destroy() {
    if (this.thermalInterval) clearInterval(this.thermalInterval);
  }
}
