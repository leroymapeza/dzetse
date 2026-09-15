export class Path {
  constructor(centerX, centerY, opts = {}) {
    this.cx = centerX;
    this.cy = centerY;
    this.rOuter = opts.rOuter ?? 290;
    this.rInner = opts.rInner ?? 150;
    this.turns = opts.turns ?? 2.0;
    this.startAngle = opts.startAngle ?? (-Math.PI * 0.5);
    this.direction = opts.direction ?? 1;
    this.resolution = 240;
    this.points = [];
    this._build();
  }

  _build() {
    const N = this.resolution;
    const totalAngle = this.turns * Math.PI * 2;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const r = this.rOuter + (this.rInner - this.rOuter) * t;
      const a = this.startAngle + this.direction * totalAngle * t;
      this.points.push({
        x: this.cx + Math.cos(a) * r,
        y: this.cy + Math.sin(a) * r
      });
    }
    this.cum = [0];
    let total = 0;
    for (let i = 1; i < this.points.length; i++) {
      const dx = this.points[i].x - this.points[i - 1].x;
      const dy = this.points[i].y - this.points[i - 1].y;
      total += Math.hypot(dx, dy);
      this.cum.push(total);
    }
    this.length = total;
  }

  getPointAt(distance) {
    const d = Math.max(0, Math.min(distance, this.length));
    let lo = 0;
    let hi = this.cum.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= d) lo = mid;
      else hi = mid;
    }
    const segLen = this.cum[hi] - this.cum[lo];
    const t = segLen > 0 ? (d - this.cum[lo]) / segLen : 0;
    const a = this.points[lo];
    const b = this.points[hi];
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    return { x, y, angle };
  }

  get end() { return this.getPointAt(this.length); }
  get start() { return this.getPointAt(0); }
}