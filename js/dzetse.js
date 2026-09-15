import { ORB_PALETTE, ORB_RADIUS, drawOrb } from './orb_palette.js';
const SHOOT_DURATION = 0.1;
const RECOIL_DURATION = 0.14;
const SHOOT_COOLDOWN = 0.12;
const MOUTH_OFFSET = 68;
const ORBIT_RADIUS = 96;
const ORBIT_SPIN = 0.35;
const GLANCE_DURATION = 0.5;

export class Dzetse {
  constructor(assets, x, y) {
    this.assets = assets;
    this.x = x;
    this.y = y;
    this.size = 220;
    this.aim = 0;
    this.cooldownTimer = 0;
    this.spriteMain = assets.dzetse_main;
    this.spriteShoot = assets.dzetse_shoot;
    this.spriteRecoil = assets.dzetse_recoil;
    this.spriteLeft = assets.dzetse_left;
    this.spriteRight = assets.dzetse_right;
    this.currentColor = this._randomColor();
    this.nextColor = this._randomColor();
    this.orbitAngle = -Math.PI / 2;
    this.swapTween = 0;
    this.time = 0;

    this.shotState = 'idle'; // idle | shoot | recoil
    this.shotTimer = 0;
    this.glanceDir = null; // null | 'left' | 'right'
    this.glanceRemaining = 0;
    this.glanceTimer = this._nextGlanceInterval();
    this.lockedGlanceDir = null; // set while the platform is in perspective mode
  }

  _randomColor() {
    return Math.floor(Math.random() * ORB_PALETTE.length);
  }

  _nextGlanceInterval() {
    return 4 + Math.random() * 5;
  }

  setAimFromTarget(tx, ty) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    this.aim = Math.atan2(dx, -dy);
  }

  getMouthPosition() {
    return {
      x: this.x + Math.sin(this.aim) * MOUTH_OFFSET,
      y: this.y - Math.cos(this.aim) * MOUTH_OFFSET
    };
  }

  getOrbPositions() {
    const a1 = this.orbitAngle;
    const a2 = this.orbitAngle + Math.PI;
    return {
      current: { x: this.x + Math.cos(a1) * ORBIT_RADIUS, y: this.y + Math.sin(a1) * ORBIT_RADIUS },
      next: { x: this.x + Math.cos(a2) * ORBIT_RADIUS, y: this.y + Math.sin(a2) * ORBIT_RADIUS }
    };
  }

  distanceToNextOrb(px, py) {
    const pos = this.getOrbPositions();
    return Math.hypot(px - pos.next.x, py - pos.next.y);
  }

  forceGlance(dir) {
    this.lockedGlanceDir = dir;
    this.glanceDir = null;
    this.glanceRemaining = 0;
  }

  releaseGlance() {
    this.lockedGlanceDir = null;
    this.glanceTimer = this._nextGlanceInterval();
  }

  swap() {
    const tmp = this.currentColor;
    this.currentColor = this.nextColor;
    this.nextColor = tmp;
    this.orbitAngle += Math.PI;
    this.swapTween = 0.25;
  }

  tryShoot() {
    if (this.cooldownTimer > 0) return false;
    this.shotState = 'shoot';
    this.shotTimer = SHOOT_DURATION;
    this.cooldownTimer = SHOOT_COOLDOWN;
    this.glanceDir = null;
    this.glanceRemaining = 0;
    return true;
  }

  consumeShot() {
    const fired = this.currentColor;
    this.currentColor = this.nextColor;
    this.nextColor = this._randomColor();
    return fired;
  }

  update(dt) {
    this.time += dt;
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.swapTween > 0) this.swapTween -= dt;
    this.orbitAngle += ORBIT_SPIN * dt;

    if (this.shotState === 'shoot') {
      this.shotTimer -= dt;
      if (this.shotTimer <= 0) {
        this.shotState = 'recoil';
        this.shotTimer = RECOIL_DURATION;
      }
    } else if (this.shotState === 'recoil') {
      this.shotTimer -= dt;
      if (this.shotTimer <= 0) {
        this.shotState = 'idle';
        this.shotTimer = 0;
      }
    }

    if (this.glanceRemaining > 0) {
      this.glanceRemaining -= dt;
      if (this.glanceRemaining <= 0) {
        this.glanceDir = null;
        this.glanceTimer = this._nextGlanceInterval();
      }
    } else if (this.shotState === 'idle' && !this.lockedGlanceDir) {
      this.glanceTimer -= dt;
      if (this.glanceTimer <= 0) {
        this.glanceDir = Math.random() < 0.5 ? 'left' : 'right';
        this.glanceRemaining = GLANCE_DURATION;
      }
    }
  }

  _currentSprite() {
    if (this.shotState === 'shoot') return this.spriteShoot;
    if (this.shotState === 'recoil') return this.spriteRecoil;
    if (this.lockedGlanceDir) return this.lockedGlanceDir === 'left' ? this.spriteLeft : this.spriteRight;
    if (this.glanceDir === 'left') return this.spriteLeft;
    if (this.glanceDir === 'right') return this.spriteRight;
    return this.spriteMain;
  }

  render(ctx) {
    const sprite = this._currentSprite();
    let offsetX = 0, offsetY = 0;
    if (this.shotState === 'recoil') {
      const t = this.shotTimer / RECOIL_DURATION;
      const push = 14 * t;
      offsetX = Math.sin(this.aim) * push;
      offsetY = -Math.cos(this.aim) * push;
    }
    ctx.save();
    ctx.translate(this.x + offsetX, this.y + offsetY);
    ctx.rotate(this.aim + Math.PI);
    ctx.drawImage(sprite, -this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();

    const pos = this.getOrbPositions();
    const t = this.time;
    drawOrb(ctx, pos.current.x, pos.current.y, ORB_PALETTE[this.currentColor], t, ORB_RADIUS * 1.15);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.current.x, pos.current.y, ORB_RADIUS * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.75;
    drawOrb(ctx, pos.next.x, pos.next.y, ORB_PALETTE[this.nextColor], t, ORB_RADIUS * 0.85);
    ctx.restore();
  }
}
