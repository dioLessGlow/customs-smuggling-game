class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._unlocked = false;
    this._bgm = null;
    this._bgmVolume = 0.5;
    this._gameVol = 0.7;
    this._hintVol = 0.7;
    this._uiVol = 0.7;
    window.__soundManager = this;
    var self = this;
    function unlock() {
      if (self._unlocked) return;
      try {
        if (!self.ctx) self.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (self.ctx.state === 'suspended') self.ctx.resume();
      } catch(e) {}
      self._unlocked = true;
    }
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }

  setMuted(muted) {
    this.enabled = !muted;
  }

  unlock() {
    if (this._unlocked) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch(e) {}
    this._unlocked = true;
  }

  playTrack(index) {
    this.stopBGM();
    if (!this.ctx || !this.enabled) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    var tracks = [
      this._bgmMarch.bind(this),
      this._bgmMorning.bind(this),
      this._bgmNoon.bind(this),
      this._bgmDusk.bind(this),
      this._bgmNight.bind(this)
    ];
    if (tracks[index]) tracks[index]();
  }

  stopBGM() {
    if (this._bgm) {
      this._bgm.timers.forEach(clearTimeout);
      if (this._bgm.gain) this._bgm.gain.disconnect();
      this._bgm = null;
    }
  }

  setBGMVolume(v) {
    this._bgmVolume = v;
    if (this._bgm && this._bgm.gain) this._bgm.gain.gain.setValueAtTime(v, this.ctx.currentTime);
  }

  setGameVol(v) { this._gameVol = v / 100; }
  setHintVol(v) { this._hintVol = v / 100; }
  setUIVol(v) { this._uiVol = v / 100; }

  vibrate(ms) {
    if (!this.enabled) return;
    try { var s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.settings && s.settings.vibration === false) return; } catch(e) {}
    if (navigator.vibrate) navigator.vibrate(ms || 20);
  }

  _bgmNote(freq, dur, type, vol, time) {
    if (!this.ctx) return;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.connect(gain);
    if (this._bgm && this._bgm.gain) gain.connect(this._bgm.gain);
    else gain.connect(this.ctx.destination);
    var t = time || this.ctx.currentTime;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur);
    return { osc: osc, gain: gain };
  }

  _bgmLoop(notes, bpm) {
    var self = this;
    var beat = 60 / (bpm || 120);
    var timers = [];
    this._bgm = { timers: timers, gain: this.ctx.createGain(), track: null };
    this._bgm.gain.gain.setValueAtTime(this._bgmVolume, this.ctx.currentTime);
    this._bgm.gain.connect(this.ctx.destination);

    function schedule() {
      if (!self._bgm) return;
      var now = self.ctx.currentTime;
      var maxBeat = 0;
      notes.forEach(function(n) {
        var b = n.beat || 0;
        n.freqs.forEach(function(f, fi) {
          var d = n.dur || beat * 0.9;
          var t = now + b * beat + (fi * (n.gap || 0));
          self._bgmNote(f, d, n.type, n.vol, t);
        });
        var end = b + 1;
        if (end > maxBeat) maxBeat = end;
      });
      var id = setTimeout(schedule, maxBeat * beat * 1000 + 50);
      timers.push(id);
    }
    schedule();
  }

  _bgmMarch() {
    var notes = [];
    var melody = [262, 294, 330, 349, 392, 440, 494, 523];
    for (var i = 0; i < melody.length; i++) {
      notes.push({ beat: i * 0.5, freqs: [melody[i]], type: 'square', vol: 0.08, dur: 0.4 });
    }
    for (var i = 0; i < 16; i++) {
      notes.push({ beat: i * 0.5, freqs: [130, 196], type: 'triangle', vol: 0.06, dur: 0.45 });
    }
    this._bgmLoop(notes, 120);
  }

  _bgmMorning() {
    var notes = [];
    var harp = [523, 659, 784, 1047, 784, 659, 523, 659, 784, 1047, 1175, 1047, 784, 659, 523, 659];
    for (var i = 0; i < harp.length; i++) {
      notes.push({ beat: i * 0.75, freqs: [harp[i]], type: 'sine', vol: 0.1, dur: 0.65 });
    }
    var pad = [262, 330, 392];
    for (var i = 0; i < 12; i++) {
      notes.push({ beat: i * 2, freqs: pad, type: 'sine', vol: 0.04, dur: 1.8 });
    }
    this._bgmLoop(notes, 100);
  }

  _bgmNoon() {
    var notes = [];
    var riff = [440, 440, 523, 440, 349, 330, 349, 392];
    for (var i = 0; i < riff.length; i++) {
      notes.push({ beat: i * 0.5, freqs: [riff[i]], type: 'sawtooth', vol: 0.06, dur: 0.4 });
    }
    var bass = [175, 175, 175, 175, 146, 146, 131, 131];
    for (var i = 0; i < bass.length; i++) {
      notes.push({ beat: i * 1, freqs: [bass[i]], type: 'triangle', vol: 0.08, dur: 0.9 });
    }
    this._bgmLoop(notes, 130);
  }

  _bgmDusk() {
    var notes = [];
    var chimes = [1047, 784, 1047, 1175, 784, 659, 784, 1047, 784, 659, 523, 659, 784, 523, 440, 392];
    for (var i = 0; i < chimes.length; i++) {
      notes.push({ beat: i * 0.6, freqs: [chimes[i]], type: 'sine', vol: 0.07, dur: 0.5 });
    }
    var drone = [220, 330, 440];
    for (var i = 0; i < 8; i++) {
      notes.push({ beat: i * 2, freqs: drone, type: 'sine', vol: 0.03, dur: 1.9 });
    }
    this._bgmLoop(notes, 90);
  }

  _bgmNight() {
    var notes = [];
    var stars = [440, 523, 659, 784, 659, 523, 440, 392, 523, 440, 349, 330, 392, 330, 262, 294];
    for (var i = 0; i < stars.length; i++) {
      notes.push({ beat: i * 0.8, freqs: [stars[i]], type: 'sine', vol: 0.06, dur: 0.7 });
    }
    var bass = [131, 131, 131, 131, 98, 98, 110, 110];
    for (var i = 0; i < bass.length; i++) {
      notes.push({ beat: i * 1.6, freqs: [bass[i]], type: 'triangle', vol: 0.05, dur: 1.5 });
    }
    this._bgmLoop(notes, 70);
  }

  play(type) {
    if (!this.enabled) return;
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') { this.ctx.resume(); }
    var gv = this._gameVol;
    switch(type) {
      case 'correct': this._tone(880, 1760, 0.3, 'sine', 0.2 * gv); break;
      case 'wrong': this._tone(150, 100, 0.5, 'sawtooth', 0.2 * gv); break;
      case 'alarm': this._siren(gv); break;
      case 'click': this._tone(600, 800, 0.1, 'sine', 0.1 * this._uiVol); break;
      case 'levelup': this._tone(523, 1047, 0.4, 'sine', 0.2 * gv); break;
      case 'scan': this._tone(1200, 1800, 0.2, 'square', 0.1 * gv); break;
      case 'echo': this._tone(660, 1320, 0.6, 'sine', 0.25 * gv); break;
      case 'cycle': this._playCycle(gv); break;
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

  _siren(vol) {
    vol = vol || 1;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2 * vol, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  _playCycle(vol) {
    vol = vol || 1;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.ctx) this._tone(freq, freq * 1.5, 0.2, 'sine', 0.15 * vol);
      }, i * 150);
    });
  }
}

const soundManager = new SoundManager();
