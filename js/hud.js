export class HUD {
  constructor(game) {
    this.game = game;
    this.lives = 3;
    this.score = 0;
    this.level = '1-1';
  }

  setScore(v) { this.score = v; }
  addScore(v) { this.score += v; }
  loseLife() { this.lives = Math.max(0, this.lives - 1); }

  _shadowText(ctx, text, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(text, x + 1, y + 2);
  }

  render(ctx) {
    const W = this.game.W;
    const H = this.game.H;

    const grd = ctx.createLinearGradient(0, 0, 0, 72);
    grd.addColorStop(0, 'rgba(20,10,4,0.9)');
    grd.addColorStop(1, 'rgba(20,10,4,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, 72);

    ctx.font = '700 26px Ubuntu, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    this._shadowText(ctx, `LIVES: x${this.lives}`, 24, 34);
    ctx.fillStyle = '#f5d59a';
    ctx.fillText(`LIVES: x${this.lives}`, 24, 34);

    ctx.textAlign = 'center';
    this._shadowText(ctx, `LEVEL ${this.level}`, W / 2 - 180, 34);
    ctx.fillStyle = '#ffd97a';
    ctx.fillText(`LEVEL ${this.level}`, W / 2 - 180, 34);

    this._shadowText(ctx, `SCORE: ${this.score.toLocaleString()}`, W / 2 + 120, 34);
    ctx.fillStyle = '#f5d59a';
    ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, W / 2 + 120, 34);

    // Progress bar reflects remaining chain
    const barX = W - 360, barY = 18, barW = 320, barH = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this._roundRect(ctx, barX, barY, barW, barH, 14);
    ctx.fill();

    ctx.strokeStyle = '#f0c060';
    ctx.lineWidth = 3;
    this._roundRect(ctx, barX, barY, barW, barH, 14);
    ctx.stroke();

    // Progress = how much of the chain has been cleared
    const chain = this.game.chain;
    const prog = chain ? chain.progress() : 0;

    const fillGrd = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    fillGrd.addColorStop(0, '#ff7a2a');
    fillGrd.addColorStop(1, '#ffd93b');
    ctx.fillStyle = fillGrd;
    this._roundRect(ctx, barX + 3, barY + 3, (barW - 6) * Math.max(0.02, prog), barH - 6, 11);
    ctx.fill();

    ctx.font = '900 30px Cinzel, Georgia, serif';
    ctx.textAlign = 'right';
    this._shadowText(ctx, 'DZETSE!', W - 24, 34);
    ctx.fillStyle = '#ffb040';
    ctx.fillText('DZETSE!', W - 24, 34);

    // Bottom hint
    ctx.font = '700 16px Ubuntu, sans-serif';
    ctx.textAlign = 'center';
    const hint = this.game.isTouch
      ? 'TAP THE REAR ORB to swap  •  TAP to fire'
      : 'SPACE or TAP THE REAR ORB to swap  •  CLICK to fire';
    this._shadowText(ctx, hint, W / 2, H - 18);
    ctx.fillStyle = 'rgba(245, 213, 154, 0.75)';
    ctx.fillText(hint, W / 2, H - 18);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}