const FLIP_DURATION = 0.55;

export class Platform {
  constructor(imgDefault, imgPerspective, x, y) {
    this.imgDefault = imgDefault;
    this.imgPerspective = imgPerspective;
    this.x = x;
    this.y = y;
    this.size = 340;
    this.phase = 'default';
    this.phaseTimer = this._nextInterval();
    this.flip = 0; // 0 = default face, 1 = perspective face
    this.onMove = null; // called at the start of each flip (sound cue)
    this.onPerspectiveVisible = null; // called with true/false as perspective art appears/disappears
  }

  _nextInterval() {
    return 14 + Math.random() * 14;
  }

  _perspectiveHold() {
    return 3 + Math.random() * 2;
  }

  update(dt) {
    this.phaseTimer -= dt;
    switch (this.phase) {
      case 'default':
        if (this.phaseTimer <= 0) this._enterPhase('flipToPerspective');
        break;
      case 'flipToPerspective':
        this.flip = 1 - Math.max(0, this.phaseTimer) / FLIP_DURATION;
        if (this.phaseTimer <= 0) this._enterPhase('perspective');
        break;
      case 'perspective':
        if (this.phaseTimer <= 0) this._enterPhase('flipToDefault');
        break;
      case 'flipToDefault':
        this.flip = Math.max(0, this.phaseTimer) / FLIP_DURATION;
        if (this.phaseTimer <= 0) this._enterPhase('default');
        break;
    }
  }

  _enterPhase(phase) {
    this.phase = phase;
    if (phase === 'flipToPerspective') {
      this.phaseTimer = FLIP_DURATION;
      this.flip = 0;
      if (this.onMove) this.onMove();
      if (this.onPerspectiveVisible) this.onPerspectiveVisible(true);
    } else if (phase === 'perspective') {
      this.phaseTimer = this._perspectiveHold();
      this.flip = 1;
    } else if (phase === 'flipToDefault') {
      this.phaseTimer = FLIP_DURATION;
      this.flip = 1;
      if (this.onMove) this.onMove();
    } else if (phase === 'default') {
      this.phaseTimer = this._nextInterval();
      this.flip = 0;
      if (this.onPerspectiveVisible) this.onPerspectiveVisible(false);
    }
  }

  render(ctx) {
    const half = this.size / 2;
    // A real card-flip: scaleX crosses zero (edge-on) at the halfway point,
    // where the texture swaps, so the perspective art visibly turns into view
    // instead of just fading in place.
    const angle = this.flip * Math.PI;
    const raw = Math.cos(angle);
    const onPerspective = this.flip > 0.5;
    const img = onPerspective ? this.imgPerspective : this.imgDefault;
    const scaleX = onPerspective ? -raw : raw;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(Math.abs(scaleX) < 0.02 ? 0.02 : scaleX, 1);
    ctx.drawImage(img, -half, -half, this.size, this.size);
    ctx.restore();
  }
}
