export const STATE = {
  INTRO: 'intro',
  PLAYING: 'playing',
  LEVEL_CLEAR: 'level_clear',
  GAME_OVER: 'game_over'
};

export class Overlay {
  constructor(game) {
    this.game = game;
    this.state = STATE.INTRO;
    this.stateTime = 0;
    this.introCount = 3;
    this.introTimer = 0;
    this.fade = 1;
  }

  setState(state, opts = {}) {
    this.state = state;
    this.stateTime = 0;
    this.fade = 0;

    if (state === STATE.INTRO) {
      this.introCount = opts.count ?? 3;
      this.introTimer = 0;
    }
  }

  update(dt) {
    this.stateTime += dt;
    this.fade = Math.min(1, this.fade + dt * 2.0);

    if (this.state === STATE.INTRO) {
      this.introTimer += dt;
      if (this.introTimer >= 1.0) {
        this.introTimer -= 1.0;
        if (this.introCount > 0) {
          // Still counting down (3, 2, 1) — next tick will show one fewer,
          // or land on 0 which renders as "GO" for a full second below.
          this.introCount--;
        } else {
          // We've already shown "GO" for a full second — now start playing.
          this.setState(STATE.PLAYING);
        }
      }
    }
  }

  render(ctx, W, H) {
    if (this.state === STATE.PLAYING) return;

    const isGameOver = this.state === STATE.GAME_OVER;
    ctx.save();
    ctx.globalAlpha = (isGameOver ? 0.65 + Math.sin(this.stateTime * 2) * 0.05 : 0.55) * this.fade;
    ctx.fillStyle = isGameOver ? '#2a0402' : '#0a0500';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = this.fade;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.state === STATE.INTRO) {
      const level = this.game.currentLevel;
      ctx.font = '900 56px Cinzel, Georgia, serif';
      ctx.fillStyle = '#ffd97a';
      ctx.shadowColor = '#7a2a00';
      ctx.shadowBlur = 24;
      ctx.fillText(`LEVEL ${level.id}`, W / 2, H / 2 - 60);

      const pulse = 1 + Math.max(0, 0.35 - this.introTimer) * 0.9;
      ctx.font = `900 ${Math.round(140 * pulse)}px Cinzel, Georgia, serif`;
      ctx.fillStyle = '#ffb040';
      ctx.shadowColor = '#ff7a2a';
      ctx.shadowBlur = 30;
      const label = this.introCount > 0 ? String(this.introCount) : 'GO';
      ctx.fillText(label, W / 2, H / 2 + 60);
    }

    if (this.state === STATE.LEVEL_CLEAR) {
      ctx.font = '900 64px Cinzel, Georgia, serif';
      ctx.fillStyle = '#ffd97a';
      ctx.shadowColor = '#7a2a00';
      ctx.shadowBlur = 24;
      ctx.fillText('LEVEL CLEAR!', W / 2, H / 2 - 60);

      ctx.font = '700 32px Ubuntu, sans-serif';
      ctx.fillStyle = '#f5d59a';
      ctx.fillText(`SCORE: ${this.game.hud.score.toLocaleString()}`, W / 2, H / 2 + 20);

      ctx.font = '700 22px Ubuntu, sans-serif';
      ctx.fillStyle = '#ffb040';
      ctx.fillText('TAP or CLICK to continue', W / 2, H / 2 + 100);
    }

    if (this.state === STATE.GAME_OVER) {
      // Stamp-in: overshoots slightly then settles, instead of appearing static
      const stampT = Math.min(1, this.stateTime / 0.5);
      const eased = 1 - Math.pow(1 - stampT, 3);
      const scale = 1.4 - eased * 0.4 + Math.sin(stampT * Math.PI) * 0.08;

      ctx.save();
      ctx.translate(W / 2, H / 2 - 80);
      ctx.scale(scale, scale);
      ctx.font = '900 64px Cinzel, Georgia, serif';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(60, 0, 0, 0.8)';
      ctx.strokeText('GAME OVER', 0, 0);
      ctx.fillStyle = '#ff5a3a';
      ctx.shadowColor = '#ff2a00';
      ctx.shadowBlur = 30 + Math.sin(this.stateTime * 3) * 10;
      ctx.fillText('GAME OVER', 0, 0);
      ctx.restore();

      ctx.font = '700 36px Ubuntu, sans-serif';
      ctx.fillStyle = '#f5d59a';
      ctx.shadowBlur = 0;
      ctx.fillText(`FINAL SCORE: ${this.game.hud.score.toLocaleString()}`, W / 2, H / 2 + 10);

      ctx.font = '700 22px Ubuntu, sans-serif';
      ctx.fillStyle = '#ffb040';
      ctx.fillText('TAP or CLICK to restart', W / 2, H / 2 + 100);
    }

    ctx.restore();
  }
}
