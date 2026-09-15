import { ORB_PALETTE } from './orb_palette.js';

const GRAVITY = 520;

export class Particles {
  constructor() {
    this.list = [];
    this.time = 0;
  }

  burst(x, y, colorIndex) {
    const color = ORB_PALETTE[colorIndex];

    // Shattered orb fragments — bigger, faster, more chaotic than a single pop needs
    // to feel "big"; this is the base hit every match gets.
    const shardCount = 26;
    for (let i = 0; i < shardCount; i++) {
      const a = (Math.PI * 2 * i) / shardCount + (Math.random() - 0.5) * 0.6;
      const speed = 220 + Math.random() * 380;
      this.list.push({
        type: 'shard',
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 80,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 18,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        color,
        size: 7 + Math.random() * 9
      });
    }

    // Dense radiating spark shower
    const sparkCount = 40;
    for (let i = 0; i < sparkCount; i++) {
      const a = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.35;
      const speed = 320 + Math.random() * 460;
      this.list.push({
        type: 'spark',
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.32 + Math.random() * 0.3,
        maxLife: 0.62,
        color,
        size: 2.5 + Math.random() * 3
      });
    }

    // Drifting embers for lingering haze
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 90;
      this.list.push({
        type: 'ember',
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 40,
        life: 0.9 + Math.random() * 0.6,
        maxLife: 1.5,
        color,
        size: 6 + Math.random() * 6
      });
    }

    // 8-point starburst spike — the classic match-3 "pop" icon, scales down as it fades
    this.list.push({
      type: 'star',
      x, y,
      life: 0.28,
      maxLife: 0.28,
      color,
      maxSize: 130,
      rot: Math.random() * Math.PI
    });

    // Three layered shockwave rings, pushed out much further than before
    this.list.push({ type: 'ring', x, y, life: 0.3, maxLife: 0.3, color, startR: 8, endR: 130, width: 9 });
    this.list.push({ type: 'ring', x, y, life: 0.48, maxLife: 0.48, color, startR: 6, endR: 220, width: 5 });
    this.list.push({ type: 'ring', x, y, life: 0.65, maxLife: 0.65, color, startR: 4, endR: 320, width: 2.5 });

    // Bright core flash
    this.list.push({ type: 'flash', x, y, life: 0.2, maxLife: 0.2, color, maxR: 140 });
  }

  // Called once per combo resolution (not per orb) — a bigger celebratory
  // shockwave plus a shower of falling confetti, scaled to the combo size.
  comboBurst(x, y, comboLevel) {
    const colors = ORB_PALETTE;
    const confettiCount = Math.min(90, 30 + comboLevel * 18);
    for (let i = 0; i < confettiCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
      const speed = 260 + Math.random() * 420;
      this.list.push({
        type: 'shard',
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 120,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 22,
        life: 0.8 + Math.random() * 0.7,
        maxLife: 1.5,
        color,
        size: 6 + Math.random() * 8
      });
    }
    for (let r = 0; r < 3; r++) {
      this.list.push({
        type: 'ring',
        x, y,
        life: 0.5 + r * 0.2,
        maxLife: 0.5 + r * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        startR: 10,
        endR: 260 + r * 120 + comboLevel * 20,
        width: 8 - r * 2
      });
    }
    this.list.push({ type: 'flash', x, y, life: 0.3, maxLife: 0.3, color: colors[0], maxR: 220 + comboLevel * 20 });
  }

  // Long streaks bursting from the combo point, reaching well past the arena
  // edge — meant to read at a glance, distinct from the localized pop VFX.
  lightRays(x, y, comboLevel) {
    this.list.push({
      type: 'rays',
      x, y,
      life: 0.35,
      maxLife: 0.35,
      rayCount: 8 + comboLevel * 2,
      length: 520 + comboLevel * 130,
      rot: Math.random() * Math.PI
    });
  }

  // Somber, heavy burst for the losing moment — embers pulled inward
  // before a dark shockwave, deliberately slower and duller than a combo.
  gameOverBurst(x, y) {
    const emberCount = 46;
    for (let i = 0; i < emberCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const startR = 260 + Math.random() * 220;
      this.list.push({
        type: 'ember',
        x: x + Math.cos(a) * startR,
        y: y + Math.sin(a) * startR,
        vx: -Math.cos(a) * startR * 1.6,
        vy: -Math.sin(a) * startR * 1.6 - 30,
        life: 0.75 + Math.random() * 0.4,
        maxLife: 1.15,
        color: { mid: '#ff5a3a', glow: '#7a0000', core: '#ffb08a' },
        size: 5 + Math.random() * 6
      });
    }
    for (let r = 0; r < 2; r++) {
      this.list.push({
        type: 'ring',
        x, y,
        life: 0.6 + r * 0.35,
        maxLife: 0.6 + r * 0.35,
        color: { mid: '#ff3a1a' },
        startR: 6,
        endR: 340 + r * 180,
        width: 12 - r * 4
      });
    }
    this.list.push({ type: 'flash', x, y, life: 0.45, maxLife: 0.45, color: { core: '#ffcaa0' }, maxR: 260 });
  }

  addFloatingText(x, y, text, opts = {}) {
    const life = opts.life ?? (opts.big ? 1.2 : 0.9);
    this.list.push({
      type: 'text',
      x, y,
      vy: opts.big ? -85 : -60,
      life,
      maxLife: life,
      text,
      color: opts.color ?? '#ffe9a8',
      fontSize: opts.big ? 44 : 26,
      big: !!opts.big
    });
  }

  update(dt) {
    this.time += dt;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }

      if (p.type === 'shard') {
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.rot += p.vrot * dt;
      } else if (p.type === 'spark') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.9;
        p.vy *= 0.9;
      } else if (p.type === 'ember') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
      } else if (p.type === 'text') {
        p.y += p.vy * dt;
        p.vy *= 0.96;
      }
      // ring/flash/star sit still and just fade/expand
    }
  }

  render(ctx) {
    for (const p of this.list) {
      const t = p.life / p.maxLife;
      switch (p.type) {
        case 'rays': {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = t;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot + (1 - t) * 0.4);
          for (let i = 0; i < p.rayCount; i++) {
            const a = (Math.PI * 2 * i) / p.rayCount;
            const ex = Math.cos(a) * p.length;
            const ey = Math.sin(a) * p.length;
            const grd = ctx.createLinearGradient(0, 0, ex, ey);
            grd.addColorStop(0, 'rgba(255,255,255,0.9)');
            grd.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = grd;
            ctx.lineWidth = 10 * t;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(ex, ey);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }
        case 'ring': {
          const r = p.startR + (p.endR - p.startR) * (1 - t);
          ctx.save();
          ctx.globalAlpha = t * 0.85;
          ctx.strokeStyle = p.color.mid;
          ctx.lineWidth = p.width * t + 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'flash': {
          ctx.save();
          ctx.globalAlpha = t * 0.9;
          const maxR = p.maxR ?? 75;
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, maxR);
          grd.addColorStop(0, '#ffffff');
          grd.addColorStop(0.35, p.color.core);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(p.x, p.y, maxR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'star': {
          const points = 8;
          const outer = p.maxSize * (1 - t * 0.3);
          const inner = outer * 0.35;
          ctx.save();
          ctx.globalAlpha = t;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color.core;
          ctx.shadowColor = p.color.glow;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const a = (Math.PI * i) / points;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'shard': {
          ctx.save();
          ctx.globalAlpha = Math.min(1, t * 1.4);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          const s = p.size * (0.5 + t * 0.5);
          const grd = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
          grd.addColorStop(0, p.color.core);
          grd.addColorStop(1, p.color.glow);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.6, s * 0.3);
          ctx.lineTo(-s * 0.6, s * 0.3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'spark': {
          ctx.save();
          ctx.globalAlpha = t;
          ctx.fillStyle = p.color.core;
          ctx.shadowColor = p.color.glow;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'ember': {
          ctx.save();
          ctx.globalAlpha = t * 0.8;
          ctx.fillStyle = p.color.mid;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'text': {
          ctx.save();
          ctx.globalAlpha = Math.min(1, t * 1.6);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const scale = p.big ? 1 + (1 - t) * 0.15 : 1;
          const family = p.big ? 'Cinzel, Georgia, serif' : 'Ubuntu, sans-serif';
          ctx.font = `900 ${Math.round(p.fontSize * scale)}px ${family}`;
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 8;
          ctx.fillText(p.text, p.x, p.y);
          ctx.restore();
          break;
        }
      }
    }
  }
}
