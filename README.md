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

## Controls
- Desktop: move mouse to aim, click to shoot.
- Mobile/Tablet: tap or drag to aim, release to shoot.

## File structure
- `index.html` — entry point
- `manifest.json` — PWA metadata
- `service-worker.js` — offline cache
- `css/style.css` — layout
- `js/main.js` — bootstrap
- `js/assets.js` — image loader
- `js/input.js` — mouse + touch
- `js/game.js` — canvas + game loop
- `js/dzetse.js` — frog sprite + states
- `js/platform.js` — platform under frog
- `js/orbs.js` — glowing orb renderer
- `js/boss.js` — crocodile head at endpoint
- `assets/` — your images