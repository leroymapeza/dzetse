export const ORB_PALETTE = [
  { name: 'Ember',    core: '#ffe9c0', mid: '#ff7a2a', glow: '#ff3b0a', pulseSpeed: 3.0, pulseAmp: 0.10, pattern: 'sunburst' },
  { name: 'River',    core: '#d8f4ff', mid: '#3fb6ff', glow: '#0a74d6', pulseSpeed: 4.0, pulseAmp: 0.08, pattern: 'wave' },
  { name: 'Forest',   core: '#e0ffcd', mid: '#4fd66b', glow: '#0e8a2f', pulseSpeed: 3.5, pulseAmp: 0.09, pattern: 'chevron' },
  { name: 'Sun',      core: '#fffbd0', mid: '#ffd93b', glow: '#e0a000', pulseSpeed: 5.0, pulseAmp: 0.12, pattern: 'star' },
  { name: 'Storm',    core: '#e8d8ff', mid: '#a05cff', glow: '#5a1fd6', pulseSpeed: 4.5, pulseAmp: 0.11, pattern: 'lattice' },
  { name: 'Ancestor', core: '#ffffff', mid: '#e6e6e6', glow: '#b0b0b0', pulseSpeed: 2.5, pulseAmp: 0.06, pattern: 'spiral' }
];

export const ORB_RADIUS = 18;
export const ORB_SPACING = 42;

// Adinkra-inspired geometric motifs, one per orb color, drawn onto the
// unit circle (radius r) centered at the current origin.
const PATTERNS = {
  sunburst(ctx, r) {
    const rays = 8;
    ctx.beginPath();
    for (let i = 0; i < rays; i++) {
      const a = (Math.PI * 2 * i) / rays;
      ctx.moveTo(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28);
      ctx.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82);
    }
    ctx.stroke();
  },
  wave(ctx, r) {
    ctx.beginPath();
    for (let ring = 0; ring < 2; ring++) {
      const rr = r * (0.42 + ring * 0.28);
      const segs = 16;
      for (let i = 0; i <= segs; i++) {
        const a = (Math.PI * 2 * i) / segs;
        const wob = Math.sin(a * 5) * r * 0.07;
        const px = Math.cos(a) * (rr + wob);
        const py = Math.sin(a) * (rr + wob);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  },
  chevron(ctx, r) {
    ctx.beginPath();
    for (let row = 0; row < 2; row++) {
      const rr = r * (0.35 + row * 0.28);
      const w = r * 0.22;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        const cx = Math.cos(a) * rr, cy = Math.sin(a) * rr;
        const nx = -Math.sin(a), ny = Math.cos(a);
        ctx.moveTo(cx - nx * w, cy - ny * w);
        ctx.lineTo(cx + Math.cos(a) * w * 0.9, cy + Math.sin(a) * w * 0.9);
        ctx.lineTo(cx + nx * w, cy + ny * w);
      }
    }
    ctx.stroke();
  },
  star(ctx, r) {
    const dots = 8;
    for (let i = 0; i < dots; i++) {
      const a = (Math.PI * 2 * i) / dots;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, Math.max(1, r * 0.09), 0, Math.PI * 2);
      ctx.fill();
    }
  },
  lattice(ctx, r) {
    ctx.beginPath();
    const n = 4;
    for (let i = -n; i <= n; i++) {
      const off = (i / n) * r * 0.75;
      ctx.moveTo(-r * 0.75, off);
      ctx.lineTo(off, -r * 0.75);
      ctx.moveTo(r * 0.75, off);
      ctx.lineTo(off, r * 0.75);
    }
    ctx.stroke();
  },
  spiral(ctx, r) {
    ctx.beginPath();
    const turns = 1.6, steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = t * Math.PI * 2 * turns;
      const rr = t * r * 0.85;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
};

export function drawOrb(ctx, x, y, color, time, radius = ORB_RADIUS) {
  const pulse = 1 + Math.sin(time * color.pulseSpeed) * color.pulseAmp;
  const r = radius * pulse;

  // Outer glow
  const grd = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.4);
  grd.addColorStop(0, color.glow);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Mid
  const grd2 = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grd2.addColorStop(0, color.core);
  grd2.addColorStop(0.5, color.mid);
  grd2.addColorStop(1, color.glow);
  ctx.fillStyle = grd2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Tribal motif, clipped to the orb and slowly rotating
  const patternFn = PATTERNS[color.pattern];
  if (patternFn) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(x, y);
    ctx.rotate(time * 0.35);
    ctx.strokeStyle = 'rgba(35,18,8,0.5)';
    ctx.fillStyle = 'rgba(35,18,8,0.5)';
    ctx.lineWidth = Math.max(1, r * 0.09);
    patternFn(ctx, r);
    ctx.restore();
  }

  // Inner spark
  ctx.fillStyle = color.core;
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
}
