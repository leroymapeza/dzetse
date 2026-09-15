export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.unlocked = false;

    // Ambient background track (real recording, looped)
    this.ambientTrackUrl = 'assets/adinkra_audio-tribal-drums-526712.mp3';
    this.ambientGain = null;
    this.ambientBuffer = null;
    this.ambientSource = null;
    this.ambientPlaying = false;
    this.ambientLoadStarted = false;

    // One-shot sample SFX
    this.sfxSources = {
      stoneDoor: 'assets/578491__postproddog__heavy-stone-door-opens-2.mp3',
      alligatorGrowl: 'assets/animals_alligator_growl.mp3',
      frogCroak: 'assets/Frog Croaking.wav',
      orbExplosion: 'assets/34905__matthewgeorge__flat-kk.wav'
    };
    this.sfxBuffers = {};

    // Create the context eagerly so decoding can start before the first
    // gesture — only *resuming/playing* needs a gesture, not creating it.
    this._ensure();
    this._loadAmbientTrack();
    this._loadSfxBuffers();
  }

  _ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.error('Audio init failed:', e);
        this.enabled = false;
        return null;
      }
    }
    return this.ctx;
  }

  _loadAmbientTrack() {
    if (this.ambientLoadStarted || !this.ctx) return;
    this.ambientLoadStarted = true;
    fetch(this.ambientTrackUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} loading ${this.ambientTrackUrl}`);
        return res.arrayBuffer();
      })
      .then((buf) => this.ctx.decodeAudioData(buf))
      .then((audioBuffer) => {
        this.ambientBuffer = audioBuffer;
        // If the player already unlocked audio before this finished loading, start now.
        if (this.unlocked) this._playAmbientBuffer();
      })
      .catch((e) => {
        console.error('Ambient track failed to load (check the path/deploy):', e);
      });
  }

  _loadSfxBuffers() {
    if (!this.ctx) return;
    Object.entries(this.sfxSources).forEach(([key, url]) => {
      fetch(encodeURI(url))
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
          return res.arrayBuffer();
        })
        .then((buf) => this.ctx.decodeAudioData(buf))
        .then((buffer) => { this.sfxBuffers[key] = buffer; })
        .catch((e) => console.error(`Failed to load ${key} (${url}):`, e));
    });
  }

  _playBuffer(key, gain = 1, when = 0) {
    const buffer = this.sfxBuffers[key];
    const ctx = this.ctx;
    if (!buffer || !ctx || ctx.state !== 'running' || !this.enabled) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(this.masterGain);
    src.start(ctx.currentTime + when);
  }

  stoneDoor() { this._playBuffer('stoneDoor', 0.6); }
  crocGrowl() { this._playBuffer('alligatorGrowl', 0.7); }
  frogCroak() { this._playBuffer('frogCroak', 0.35); }
  orbExplosion() { this._playBuffer('orbExplosion', 0.85); }

  // Called from a user gesture. Must be called before any sound plays.
  unlock() {
    const ctx = this._ensure();
    if (!ctx) return Promise.resolve();
    if (ctx.state === 'suspended') {
      return ctx.resume().then(() => {
        this.unlocked = true;
        this._playAmbientBuffer();
      }).catch(() => {});
    }
    this.unlocked = true;
    this._playAmbientBuffer();
    return Promise.resolve();
  }

  _playAmbientBuffer() {
    if (this.ambientPlaying || !this.enabled || !this.ambientBuffer) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    if (!this.ambientGain) {
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.value = 0.55;
      this.ambientGain.connect(this.masterGain);
    }
    const src = ctx.createBufferSource();
    src.buffer = this.ambientBuffer;
    src.loop = true;
    src.connect(this.ambientGain);
    src.start(0);
    this.ambientSource = src;
    this.ambientPlaying = true;
  }

  stopAmbient() {
    if (this.ambientSource) {
      try { this.ambientSource.stop(); } catch (e) { /* already stopped */ }
      this.ambientSource = null;
    }
    this.ambientPlaying = false;
  }

  setAmbientVolume(v) {
    if (this.ambientGain) this.ambientGain.gain.value = v;
  }

  _tone({ type = 'sine', freq = 440, freqEnd = null, attack = 0.005, decay = 0.15, gain = 0.2, when = 0 }) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + decay);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    osc.connect(g).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + attack + decay + 0.05);
  }

  _noise({ duration = 0.1, gain = 0.2, filterFreq = 2000, when = 0 }) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + when;
    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(g).connect(this.masterGain);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  _djembe(when = 0, gain = 0.3, pitch = 160) {
    this._tone({ type: 'sine', freq: pitch, freqEnd: pitch * 0.4, attack: 0.002, decay: 0.18, gain, when });
    this._noise({ duration: 0.04, gain: gain * 0.5, filterFreq: 1200, when });
  }

  _talking(when = 0, gain = 0.25, pitchHigh = 400, pitchLow = 180) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitchHigh, t);
    osc.frequency.exponentialRampToValueAtTime(pitchLow, t + 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(g).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  _mbira(when = 0, gain = 0.2, pitch = 880) {
    this._tone({ type: 'triangle', freq: pitch, attack: 0.002, decay: 0.35, gain, when });
    this._tone({ type: 'sine', freq: pitch * 2, attack: 0.002, decay: 0.25, gain: gain * 0.4, when });
  }

  shoot() {
    this._mbira(0, 0.18, 660);
    this._mbira(0.02, 0.12, 990);
  }

  pop(comboLevel = 1) {
    this._djembe(0, 0.32, 180 + comboLevel * 20);
    this._noise({ duration: 0.08, gain: 0.15, filterFreq: 3000, when: 0.01 });
    if (comboLevel > 1) {
      const notes = [660, 880, 1100, 1320].slice(0, comboLevel);
      notes.forEach((n, i) => this._mbira(0.05 + i * 0.05, 0.14, n));
    }
  }

  combo(level = 2) {
    this._talking(0, 0.22, 400 + level * 40, 180);
    this._djembe(0.02, 0.28, 200);
  }

  swap() {
    this._mbira(0, 0.14, 880);
    this._mbira(0.06, 0.12, 660);
  }

  cleared() {
    const beat = 0.12;
    for (let i = 0; i < 6; i++) {
      this._djembe(i * beat, 0.22, i % 2 === 0 ? 180 : 140);
    }
    const melody = [523, 659, 784, 1046, 784, 1046];
    melody.forEach((n, i) => this._mbira(i * beat, 0.18, n));
    this._talking(0, 0.25, 500, 220);
    this._talking(beat * 3, 0.22, 420, 200);
  }

  gameOver() {
    this._djembe(0, 0.35, 100);
    this._tone({ type: 'sine', freq: 300, freqEnd: 90, attack: 0.01, decay: 0.9, gain: 0.24 });
    this._tone({ type: 'sine', freq: 200, freqEnd: 60, attack: 0.01, decay: 1.2, gain: 0.18, when: 0.1 });
  }

  intro() {
    this._djembe(0, 0.28, 160);
    this._djembe(0.5, 0.28, 160);
    this._djembe(1.0, 0.28, 160);
    this._talking(1.5, 0.3, 500, 220);
  }
}
