import { ORB_PALETTE, ORB_RADIUS, drawOrbSprite } from './orb_palette.js';
const ORB_SPEED = 900;
const ORB_LIFETIME = 3.0;

export class Orbs {
  constructor() {
    this.list = [];
    this.time = 0;
  }

  // Updated to accept colorIndex
  spawn(x, y, angle, colorIndex) {
    this.list.push({
      x, y,
      vx: Math.sin(angle) * ORB_SPEED,
      vy: -Math.cos(angle) * ORB_SPEED,
      life: ORB_LIFETIME,
      colorIndex,
      trail: []
    });
  }

  // Updated to accept chain and perform swept collision
  update(dt, chain) {
    this.time += dt;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const o = this.list[i];
      o.trail.push({ x: o.x, y: o.y });
      if (o.trail.length > 18) o.trail.shift();

      const prevX = o.x;
      const prevY = o.y;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.life -= dt;

      // Swept collision detection
      if (chain) {
        let hit = false;
        const steps = 6;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const sx = prevX + (o.x - prevX) * t;
          const sy = prevY + (o.y - prevY) * t;
          const idx = chain.findNearestOrb(sx, sy, 30);
          if (idx >= 0) {
            chain.tryInsert(sx, sy, o.colorIndex);
            this.list.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }

      if (o.life <= 0 || o.x < -100 || o.x > 2000 || o.y < -100 || o.y > 1200) {
        this.list.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const o of this.list) {
      const color = ORB_PALETTE[o.colorIndex];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < o.trail.length; i++) {
        const t = o.trail[i];
        const f = i / o.trail.length;
        const rr = ORB_RADIUS * (0.3 + f * 0.8);
        const grd = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, rr);
        grd.addColorStop(0, color.core);
        grd.addColorStop(0.5, color.mid);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = f * 0.55;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(t.x, t.y, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      drawOrbSprite(ctx, o.x, o.y, o.colorIndex, this.time, ORB_RADIUS);
    }
  }
}