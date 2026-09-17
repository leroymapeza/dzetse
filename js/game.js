import { Input } from './input.js';
import { Dzetse } from './dzetse.js';
import { Platform } from './platform.js';
import { Orbs } from './orbs.js';
import { Boss } from './boss.js';
import { HUD } from './hud.js';
import { Audio } from './audio.js';
import { Path } from './path.js';
import { Chain } from './chain.js';
import { Particles } from './particles.js';
import { Overlay, STATE } from './overlay.js';
import { getLevel, LEVELS } from './levels.js';
import { ORB_PALETTE } from './orb_palette.js';

const GAME_W = 1280;
const GAME_H = 720;
const BACKGROUND_CROP_ANCHOR_Y = 0.35;
const ARENA_CENTER_X = GAME_W * 0.50;
const ARENA_CENTER_Y = GAME_H * 0.59;
const POP_SCORE = 150;
const TAP_SWAP_RADIUS = 34;

export class Game {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets;
    this.W = GAME_W;
    this.H = GAME_H;
    this.input = new Input(canvas, this.W, this.H);
    this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this._resize();
    window.addEventListener('resize', () => this._resize());
    // Some mobile browsers report the old viewport size for a moment after
    // rotation, so re-run resize once the new dimensions have settled.
    window.addEventListener('orientationchange', () => setTimeout(() => this._resize(), 300));
    
    this.arenaX = ARENA_CENTER_X;
    this.arenaY = ARENA_CENTER_Y;
    this.levelIndex = 0;
    this.currentLevel = getLevel(this.levelIndex);
    
    this.path = new Path(this.arenaX, this.arenaY, {
      rOuter: this.currentLevel.rOuter,
      rInner: this.currentLevel.rInner,
      turns: this.currentLevel.turns,
      startAngle: this.currentLevel.startAngle,
      direction: 1
    });
    
    this.chain = new Chain(this.path, {
      count: this.currentLevel.chainCount,
      speed: this.currentLevel.chainSpeed,
      colorCount: this.currentLevel.colorCount
    });
    
    this._bakePathGlow();

    this.platform = new Platform(assets.platform, assets.platform_perspective, this.arenaX, this.arenaY);
    this.dzetse = new Dzetse(assets, this.arenaX, this.arenaY);
    this.orbs = new Orbs();
    this.particles = new Particles();
    this.boss = new Boss(assets.croc_idle);
    this._applyLevelVisuals();
    
    const endPt = this.path.end;
    const angleToCenter = Math.atan2(this.arenaY - endPt.y, this.arenaX - endPt.x);
    this.boss.setPosition(endPt.x, endPt.y, angleToCenter);
    
    this.hud = new HUD(this);
    this.audio = new Audio();
    this.overlay = new Overlay(this);
    this.platform.onMove = () => this.audio.stoneDoor();
    this.platform.onPerspectiveVisible = (visible) => {
      if (visible) this.dzetse.forceGlance(Math.random() < 0.5 ? 'left' : 'right');
      else this.dzetse.releaseGlance();
    };
    this.frogTimer = 6 + Math.random() * 10;
    this.crocGrowlTimer = 5 + Math.random() * 7;
    
    // Unlock audio on first user gesture
    this.input.onFirstGesture = () => { this.audio.unlock(); };
    
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.flashAlpha = 0;
    this.flashColor = '#ffffff';
    
    this.chain.onReachEnd = () => {
      this.hud.loseLife();
      this.audio.pop();
      this.audio.crocGrowl();
      this._shake(18, 0.55);
      if (this.hud.lives <= 0) {
        this.audio.gameOver();
        this.particles.gameOverBurst(this.arenaX, this.arenaY);
        this._shake(30, 0.9);
        this.overlay.setState(STATE.GAME_OVER);
      } else {
        this.chain.reset({
          speed: this.currentLevel.chainSpeed,
          count: this.currentLevel.chainCount,
          colorCount: this.currentLevel.colorCount
        });
      }
    };
    
    this.chain.onPop = (x, y, colorIndex) => {
      this.particles.burst(x, y, colorIndex);
      this.audio.orbExplosion();
      this._lastPopX = x;
      this._lastPopY = y;
      this._lastPopColor = colorIndex;
    };
    
    this.chain.onResolve = (popped, combos) => {
      const mult = combos > 1 ? Math.pow(1.5, combos - 1) : 1;
      const earned = Math.round(popped * POP_SCORE * mult);
      this.hud.addScore(earned);
      this.audio.pop(combos);
      const tx = this._lastPopX ?? this.arenaX;
      const ty = this._lastPopY ?? this.arenaY;
      const colorHex = ORB_PALETTE[this._lastPopColor ?? 0].mid;
      this.particles.addFloatingText(tx, ty - 24, `+${earned}`, { color: '#ffe9a8' });
      if (combos > 1) {
        this.audio.combo(combos);
        this.particles.addFloatingText(tx, ty - 58, `COMBO x${combos}!`, { color: '#ffb040', big: true });
        this.particles.comboBurst(tx, ty, combos);
        this.particles.lightRays(tx, ty, combos);
        this._shake(22 + combos * 8, 0.45);
        this._flash(colorHex, 0.3 + combos * 0.06);
      } else {
        this._shake(14, 0.22);
        this._flash(colorHex, 0.18);
      }
    };
    
    this.chain.onCleared = () => {
      if (this.overlay.state === STATE.PLAYING) {
        this.audio.cleared();
        this.overlay.setState(STATE.LEVEL_CLEAR);
      }
    };
    
    this.overlay.setState(STATE.INTRO, { count: 3 });
    this.lastTime = performance.now();
    this.running = false;
  }

  _advanceLevel() {
    this.levelIndex++;
    if (this.levelIndex >= LEVELS.length) {
      // Endless mode past the last designed level: keep ramping every stat
      // instead of just speed, capped so it stays winnable.
      this.endlessBumps = (this.endlessBumps ?? 0) + 1;
      const base = LEVELS[LEVELS.length - 1];
      this.currentLevel = {
        ...base,
        id: `${base.id}+${this.endlessBumps}`,
        chainSpeed: base.chainSpeed + this.endlessBumps * 1.2,
        chainCount: Math.min(base.chainCount + this.endlessBumps * 2, 60),
        colorCount: Math.min(ORB_PALETTE.length, base.colorCount + Math.floor(this.endlessBumps / 2))
      };
      this.levelIndex = LEVELS.length - 1;
    } else {
      this.endlessBumps = 0;
      this.currentLevel = getLevel(this.levelIndex);
    }
    this.path = new Path(this.arenaX, this.arenaY, {
      rOuter: this.currentLevel.rOuter,
      rInner: this.currentLevel.rInner,
      turns: this.currentLevel.turns,
      startAngle: this.currentLevel.startAngle,
      direction: 1
    });
    this.chain.path = this.path;
    this.chain.reset({
      speed: this.currentLevel.chainSpeed,
      count: this.currentLevel.chainCount,
      colorCount: this.currentLevel.colorCount
    });
    const endPt = this.path.end;
    const angleToCenter = Math.atan2(this.arenaY - endPt.y, this.arenaX - endPt.x);
    this.boss.setPosition(endPt.x, endPt.y, angleToCenter);
    this.hud.level = this.currentLevel.id;
    this._applyLevelVisuals();
    this._bakePathGlow();
    this.overlay.setState(STATE.INTRO, { count: 3 });
    this.audio.intro();
  }

  _restartGame() {
    this.levelIndex = 0;
    this.endlessBumps = 0;
    this.currentLevel = getLevel(this.levelIndex);
    this.hud.lives = 4;
    this.hud.score = 0;
    this.hud.level = this.currentLevel.id;
    this.path = new Path(this.arenaX, this.arenaY, {
      rOuter: this.currentLevel.rOuter,
      rInner: this.currentLevel.rInner,
      turns: this.currentLevel.turns,
      startAngle: this.currentLevel.startAngle,
      direction: 1
    });
    this.chain.path = this.path;
    this.chain.reset({
      speed: this.currentLevel.chainSpeed,
      count: this.currentLevel.chainCount,
      colorCount: this.currentLevel.colorCount
    });
    const endPt = this.path.end;
    const angleToCenter = Math.atan2(this.arenaY - endPt.y, this.arenaX - endPt.x);
    this.boss.setPosition(endPt.x, endPt.y, angleToCenter);
    this._applyLevelVisuals();
    this._bakePathGlow();
    this.overlay.setState(STATE.INTRO, { count: 3 });
    this.audio.intro();
  }

  _bakePathGlow() {
    if (!this.pathGlowCanvas) {
      this.pathGlowCanvas = document.createElement('canvas');
      this.pathGlowCanvas.width = this.W;
      this.pathGlowCanvas.height = this.H;
    }
    const octx = this.pathGlowCanvas.getContext('2d');
    octx.clearRect(0, 0, this.W, this.H);
    this.chain.renderPath(octx);
  }

  _shake(mag, time) {
    this.shakeMag = mag;
    this.shakeTime = time;
  }

  _flash(color, alpha) {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  _applyLevelVisuals() {
    this.bgImage = this.currentLevel.night ? this.assets.arena_night : this.assets.arena_day;
    this.boss.img = this.currentLevel.night ? this.assets.croc_night : this.assets.croc_idle;
  }

  _resize() {
    const maxDpr = (navigator.hardwareConcurrency || 8) <= 4 ? 1 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const targetRatio = this.W / this.H;
    const winRatio = vw / vh;
    let cssW, cssH;
    if (winRatio > targetRatio) {
      cssH = vh;
      cssW = vh * targetRatio;
    } else {
      cssW = vw;
      cssH = vw / targetRatio;
    }
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.audio.intro();
    requestAnimationFrame((t) => this._loop(t));
  }

  _loop(t) {
    if (!this.running) return;
    const dt = Math.min((t - this.lastTime) / 1000, 0.05);
    this.lastTime = t;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this._loop(t));
  }

  update(dt) {
    this.overlay.update(dt);

    // Consume input ONCE per frame to prevent double-eating
    const fire = this.input.consumeFire();
    const swap = this.input.consumeSwap();

    // Overlay interactions
    if (fire) {
      if (this.overlay.state === STATE.LEVEL_CLEAR) {
        this._advanceLevel();
        return;
      }
      if (this.overlay.state === STATE.GAME_OVER) {
        this._restartGame();
        return;
      }
    }

    if (this.overlay.state !== STATE.PLAYING) {
      return;
    }

    this.dzetse.setAimFromTarget(this.input.aimX, this.input.aimY);

    if (swap) {
      this.dzetse.swap();
      this.audio.swap();
    }

    this.dzetse.update(dt);
    this.chain.update(dt);
    this.boss.update(dt);
    this.platform.update(dt);
    this.particles.update(dt);
    this.orbs.update(dt, this.chain);

    this.frogTimer -= dt;
    if (this.frogTimer <= 0) {
      this.audio.frogCroak();
      this.frogTimer = 8 + Math.random() * 14;
    }

    this.crocGrowlTimer -= dt;
    if (this.crocGrowlTimer <= 0) {
      this.audio.crocGrowl();
      this.crocGrowlTimer = 9 + Math.random() * 12;
    }

    // Shoot logic — tapping near the rear (next) orb swaps instead of firing
    if (fire) {
      const nearRearOrb = this.dzetse.distanceToNextOrb(this.input.aimX, this.input.aimY) < TAP_SWAP_RADIUS;
      if (nearRearOrb) {
        if (!swap) {
          this.dzetse.swap();
          this.audio.swap();
        }
      } else if (this.dzetse.tryShoot()) {
        const firedColor = this.dzetse.consumeShot();
        const mouth = this.dzetse.getMouthPosition();
        this.orbs.spawn(mouth.x, mouth.y, this.dzetse.aim, firedColor);
        this.audio.shoot();
      }
    }

    if (this.shakeTime > 0) this.shakeTime -= dt;
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.6);
  }

  render() {
    const ctx = this.ctx;
    let shakeX = 0, shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeMag;
      shakeY = (Math.random() - 0.5) * this.shakeMag;
    }
    ctx.save();
    ctx.translate(shakeX, shakeY);
    this._drawCover(ctx, this.bgImage, 0, 0, this.W, this.H, BACKGROUND_CROP_ANCHOR_Y);
    if (this.pathGlowCanvas) ctx.drawImage(this.pathGlowCanvas, 0, 0, this.W, this.H);
    this.platform.render(ctx);
    this.boss.render(ctx);
    this.chain.render(ctx, this.chain.time);
    this.particles.render(ctx);
    this.dzetse.render(ctx);
    this.orbs.render(ctx);
    ctx.restore();

    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.restore();
    }

    this.hud.render(ctx);
    this.overlay.render(ctx, this.W, this.H);
  }

  _drawCover(ctx, img, x, y, w, h, anchorY = 0.5) {
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > boxRatio) {
      sw = img.height * boxRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / boxRatio;
      sy = (img.height - sh) * anchorY;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
}