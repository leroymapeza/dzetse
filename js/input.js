export class Input {
  constructor(canvas, gameW, gameH) {
    this.canvas = canvas;
    this.gameW = gameW;
    this.gameH = gameH;
    this.aimX = 0;
    this.aimY = 0;
    this.firing = false;
    this.firePressed = false;
    this.swapPressed = false;
    this.pointerActive = false;
    this.onFirstGesture = null; // Used to unlock audio
    this._spaceDown = false;
    this._enterDown = false;
    this._bind();
  }

  _bind() {
    const c = this.canvas;
    const update = (clientX, clientY) => {
      const rect = c.getBoundingClientRect();
      // Convert to logical game coordinates (0..gameW, 0..gameH). The canvas's
      // CSS box always matches the game's aspect ratio, so a plain fraction of
      // the CSS rect maps directly to game units regardless of devicePixelRatio.
      this.aimX = ((clientX - rect.left) / rect.width) * this.gameW;
      this.aimY = ((clientY - rect.top) / rect.height) * this.gameH;
      this.pointerActive = true;
    };

    const firstGesture = () => {
      if (this.onFirstGesture) {
        this.onFirstGesture();
        this.onFirstGesture = null;
      }
    };

    c.addEventListener('pointermove', (e) => update(e.clientX, e.clientY));
    c.addEventListener('pointerdown', (e) => {
      firstGesture();
      try { c.setPointerCapture(e.pointerId); } catch (_) {}
      update(e.clientX, e.clientY);
      this.firing = true;
      this.firePressed = true;
    });
    c.addEventListener('pointerup', () => { this.firing = false; });
    c.addEventListener('pointercancel', () => { this.firing = false; });
    c.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      firstGesture();
      if (e.code === 'Space') {
        e.preventDefault();
        if (!this._spaceDown) {
          this._spaceDown = true;
          this.swapPressed = true;
        }
      } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (!this._enterDown) {
          this._enterDown = true;
          this.firePressed = true;
        }
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') this._spaceDown = false;
      if (e.code === 'Enter' || e.code === 'NumpadEnter') this._enterDown = false;
    });
  }

  consumeFire() {
    if (this.firePressed) {
      this.firePressed = false;
      return true;
    }
    return false;
  }

  consumeSwap() {
    if (this.swapPressed) {
      this.swapPressed = false;
      return true;
    }
    return false;
  }
}