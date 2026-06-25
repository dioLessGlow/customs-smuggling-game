class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._unlocked = false;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    window.__soundManager = this;
  }

  setMuted(muted) {
    this.enabled = !muted;
  }

  unlock() {
    if (this._unlocked) return;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this._unlocked = true;
    }
  }

  play(type) {
    if (!this.enabled) return;
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') { this.ctx.resume(); return; }
    switch(type) {
      case 'correct': this._tone(880, 1760, 0.3, 'sine', 0.2); break;
      case 'wrong': this._tone(150, 100, 0.5, 'sawtooth', 0.2); break;
      case 'alarm': this._siren(); break;
      case 'click': this._tone(600, 800, 0.1, 'sine', 0.1); break;
      case 'levelup': this._tone(523, 1047, 0.4, 'sine', 0.2); break;
      case 'scan': this._tone(1200, 1800, 0.2, 'square', 0.1); break;
      case 'echo': this._tone(660, 1320, 0.6, 'sine', 0.25); break;
      case 'cycle': this._playCycle(); break;
    }
  }

  _tone(sf, ef, dur, type, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(sf, this.ctx.currentTime);
    if (ef) osc.frequency.exponentialRampToValueAtTime(ef, this.ctx.currentTime + dur * 0.3);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  _siren() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  _playCycle() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.ctx) this._tone(freq, freq * 1.5, 0.2, 'sine', 0.15);
      }, i * 150);
    });
  }
}

const soundManager = new SoundManager();
