import { ORB_PALETTE, ORB_RADIUS, ORB_SPACING, drawOrbSprite } from './orb_palette.js';

const MIN_MATCH = 3;
const SETTLE_TIME = 0.12;
const HIT_RADIUS = 34;

export class Chain {
  constructor(path, opts = {}) {
    this.path = path;
    this.baseSpeed = opts.speed ?? 40;
    this.speed = this.baseSpeed;
    this.spacing = ORB_SPACING;
    this.colorCount = opts.colorCount ?? ORB_PALETTE.length;

    const count = opts.count ?? 50;
    this.initialCount = count;
    this.orbs = [];
    for (let i = 0; i < count; i++) {
      this.orbs.push({
        distance: i * this.spacing,
        colorIndex: this._pickColor(i)
      });
    }

    this.traveled = 0;
    this.recoilOffset = 0; // temporary backward nudge applied on pop, eases back to 0
    this.reachedEnd = false;
    this.time = 0;
    this.pendingMatches = [];

    this.onReachEnd = null;
    this.onPop = null;
    this.onResolve = null;
    this.onCleared = null;
  }

  reset(opts = {}) {
    this.baseSpeed = opts.speed ?? this.baseSpeed;
    this.speed = this.baseSpeed;
    this.colorCount = opts.colorCount ?? this.colorCount;
    const count = opts.count ?? this.orbs.length;
    this.initialCount = count;

    this.orbs = [];
    for (let i = 0; i < count; i++) {
      this.orbs.push({
        distance: i * this.spacing,
        colorIndex: this._pickColor(i)
      });
    }

    this.traveled = 0;
    this.recoilOffset = 0;
    this.reachedEnd = false;
    this.time = 0;
    this.pendingMatches = [];
  }

  _pickColor(i) {
    const paletteSize = Math.min(this.colorCount, ORB_PALETTE.length);
    return (i * 7 + 3) % paletteSize;
  }

  update(dt) {
    this.time += dt;
    if (this.reachedEnd) return;

    this.traveled += this.speed * dt;

    if (this.recoilOffset !== 0) {
      this.recoilOffset += (0 - this.recoilOffset) * Math.min(1, dt * 10);
      if (Math.abs(this.recoilOffset) < 0.05) this.recoilOffset = 0;
    }

    for (let i = this.pendingMatches.length - 1; i >= 0; i--) {
      const p = this.pendingMatches[i];
      p.timer -= dt;
      if (p.timer <= 0) {
        this.pendingMatches.splice(i, 1);
        this._resolveAt(p.idx);
      }
    }

    if (this.orbs.length > 0) {
      const lead = this.orbs[this.orbs.length - 1];
      if (this._orbPathDistance(lead) >= this.path.length) {
        this.reachedEnd = true;
        if (this.onReachEnd) this.onReachEnd();
      }
    }
  }

  _orbPathDistance(orb) {
    return this.traveled + this.recoilOffset + orb.distance;
  }

  findNearestOrb(x, y, maxDist = HIT_RADIUS) {
    let bestIdx = -1;
    let bestDist = maxDist * maxDist;
    for (let i = 0; i < this.orbs.length; i++) {
      const d = this._orbPathDistance(this.orbs[i]);
      if (d < 0 || d > this.path.length) continue;
      const p = this.path.getPointAt(d);
      const dx = p.x - x;
      const dy = p.y - y;
      const dd = dx * dx + dy * dy;
      if (dd < bestDist) {
        bestDist = dd;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  _pathDistanceOfPoint(x, y) {
    let bestDist = Infinity;
    let bestPathDistance = 0;
    const step = 8;
    for (let d = 0; d <= this.path.length; d += step) {
      const p = this.path.getPointAt(d);
      const dist = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestPathDistance = d;
      }
    }
    for (let d = Math.max(0, bestPathDistance - step); d <= Math.min(this.path.length, bestPathDistance + step); d += 1) {
      const p = this.path.getPointAt(d);
      const dist = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestPathDistance = d;
      }
    }
    return bestPathDistance;
  }

  insertAtPoint(impactX, impactY, colorIndex) {
    const hitPathDistance = this._pathDistanceOfPoint(impactX, impactY);
    const targetOrbDistance = hitPathDistance - this.traveled;

    let insertIdx = this.orbs.length;
    for (let i = 0; i < this.orbs.length; i++) {
      if (this.orbs[i].distance > targetOrbDistance) {
        insertIdx = i;
        break;
      }
    }

    let chosenIdx = insertIdx;
    if (insertIdx > 0 && insertIdx < this.orbs.length) {
      const prev = this.orbs[insertIdx - 1].distance;
      const next = this.orbs[insertIdx].distance;
      const distToPrev = Math.abs(targetOrbDistance - prev);
      const distToNext = Math.abs(targetOrbDistance - next);
      chosenIdx = distToPrev < distToNext ? insertIdx - 1 : insertIdx;
    }

    for (let i = chosenIdx; i < this.orbs.length; i++) {
      this.orbs[i].distance += this.spacing;
    }

    let newDistance;
    if (chosenIdx === 0) {
      newDistance = this.orbs.length > 0 ? this.orbs[0].distance - this.spacing : 0;
      if (newDistance < 0) newDistance = 0;
    } else {
      newDistance = this.orbs[chosenIdx - 1].distance + this.spacing;
    }

    this.orbs.splice(chosenIdx, 0, { distance: newDistance, colorIndex });
    return chosenIdx;
  }

  tryInsert(x, y, colorIndex) {
    const idx = this.findNearestOrb(x, y, HIT_RADIUS);
    if (idx < 0) return false;
    const insertedIdx = this.insertAtPoint(x, y, colorIndex);
    this.pendingMatches.push({ idx: insertedIdx, timer: SETTLE_TIME });
    return { inserted: true };
  }

  findMatchAround(idx) {
    if (idx < 0 || idx >= this.orbs.length) return null;
    const color = this.orbs[idx].colorIndex;
    let start = idx;
    while (start - 1 >= 0 && this.orbs[start - 1].colorIndex === color) start--;
    let end = idx;
    while (end + 1 < this.orbs.length && this.orbs[end + 1].colorIndex === color) end++;
    const count = end - start + 1;
    if (count >= MIN_MATCH) return { start, end, count };
    return null;
  }

  popRange(start, end) {
    const hasLeadingSegment = end < this.orbs.length - 1;
    const removed = this.orbs.splice(start, end - start + 1);
    const gapSize = removed.length * this.spacing;
    if (hasLeadingSegment) {
      // Orbs behind the gap surge forward to close it against the segment
      // still ahead of them — eased in via the recoil below, not teleported.
      for (let i = 0; i < start; i++) {
        this.orbs[i].distance += gapSize;
      }
      this.recoilOffset -= gapSize * 0.6;
    } else {
      // The pop reached the actual lead orb — nothing ahead to catch up to,
      // so the chain's tip genuinely falls back and buys real time.
      this.recoilOffset -= gapSize * 0.3;
    }
    return removed.length;
  }

  _resolveAt(idx) {
    let totalPopped = 0;
    let combos = 0;
    let currentIdx = idx;
    let match = this.findMatchAround(currentIdx);

    while (match) {
      combos++;
      const { start, end } = match;
      for (let i = start; i <= end; i++) {
        const orb = this.orbs[i];
        if (!orb) continue;
        const d = this._orbPathDistance(orb);
        const p = this.path.getPointAt(d);
        if (this.onPop) this.onPop(p.x, p.y, orb.colorIndex);
      }
      totalPopped += this.popRange(start, end);
      if (this.orbs.length === 0) break;
      currentIdx = Math.max(0, Math.min(start, this.orbs.length - 1));
      match = this.findMatchAround(currentIdx);
    }

    if (totalPopped > 0 && this.onResolve) this.onResolve(totalPopped, combos);
    if (this.orbs.length === 0 && this.onCleared) this.onCleared();
  }

  // Progress: how close the lead orb is to reaching Dzetse (0..1)
  progress() {
    if (this.orbs.length === 0) return 0;
    const lead = this.orbs[this.orbs.length - 1];
    return Math.min(1, Math.max(0, this._orbPathDistance(lead) / this.path.length));
  }

  render(ctx, time) {
    for (const orb of this.orbs) {
      const d = this._orbPathDistance(orb);
      if (d < 0 || d > this.path.length) continue;
      const p = this.path.getPointAt(d);
      drawOrbSprite(ctx, p.x, p.y, orb.colorIndex, time, ORB_RADIUS);
    }
  }

  renderPath(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 200, 120, 0.18)';
    ctx.lineWidth = ORB_RADIUS * 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 160, 60, 0.35)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    const pts = this.path.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();
  }
}