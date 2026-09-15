# Dzetse — Guardian of the Wetland

Zuma-style orb-matching game. African savanna wetland theme.

## How to run
1. Open the folder in a terminal.
2. Start a local server: `python -m http.server 8000`
   (Required — service workers don't work on `file://`.)
3. Open `http://localhost:8000` in your browser.

## How to install offline
- Chrome/Edge: click the install icon in the address bar.
- iOS Safari: Share → Add to Home Screen.
- Once installed, it works fully offline.

## Fullscreen & orientation
Tapping PLAY requests fullscreen and locks the screen to landscape on
browsers that support it (Chrome/Edge on Android). iOS Safari supports
neither API, so on iPhone/iPad the game instead relies on the CSS layout
filling the real viewport and the on-screen rotate prompt if the device
is held in portrait.

## Controls
- Desktop: move mouse to aim, click (or Enter) to shoot, Space or click
  the rear orb to swap colors.
- Mobile/Tablet: drag to aim, tap to shoot, tap the rear orb to swap
  colors.

## File structure
- `index.html` — entry point
- `manifest.json` — PWA metadata
- `service-worker.js` — offline cache
- `css/style.css` — layout, fullscreen/rotate-prompt styling
- `js/main.js` — bootstrap, cover screen, fullscreen + orientation lock
- `js/assets.js` — image loader
- `js/input.js` — mouse + touch + keyboard
- `js/game.js` — canvas, resize/dpr handling, game loop
- `js/dzetse.js` — player-controlled orb-shooter sprite and aim/shoot/glance states
- `js/platform.js` — platform beneath Dzetse, default/perspective flip
- `js/path.js` — spiral path the orb chain travels along
- `js/chain.js` — orb chain: matching, popping, chain physics
- `js/orb_palette.js` — orb colors, motifs, and cached render sprites
- `js/orbs.js` — fired orb projectiles and chain-collision handling
- `js/boss.js` — crocodile head at the path's endpoint
- `js/particles.js` — pop bursts, combos, floating score text
- `js/hud.js` — lives, score, level, progress bar
- `js/overlay.js` — intro countdown, level clear, game over screens
- `js/audio.js` — ambient track, sample SFX, procedural tones
- `js/levels.js` — per-level difficulty settings
- `assets/` — your images and audio
