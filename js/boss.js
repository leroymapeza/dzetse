export class Boss {
  constructor(img) {
    this.img = img;
    this.x = 0;
    this.y = 0;
    this.size = 170;
    this.time = 0;
    this.rotation = 0;
    this.mouthOffset = 75; // Distance from center to mouth
  }

  setPosition(x, y, angleToCenter) {
    this.rotation = angleToCenter;
    // Offset so MOUTH is at path end, not center
    this.x = x - Math.cos(angleToCenter) * this.mouthOffset;
    this.y = y - Math.sin(angleToCenter) * this.mouthOffset;
  }

  update(dt) {
    this.time += dt;
  }

  render(ctx) {
    const breathe = 1 + Math.sin(this.time * 1.6) * 0.02;
    const s = this.size * breathe;
    ctx.save();
    ctx.translate(this.x, this.y);
    // Rotate to face center (adjust +Math.PI/2 if sprite faces UP)
    ctx.rotate(this.rotation + Math.PI / 2);
    ctx.drawImage(this.img, -s / 2, -s / 2, s, s);
    ctx.restore();
  }
}