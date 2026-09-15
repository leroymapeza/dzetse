import { loadAssets } from './assets.js';
import { Game } from './game.js';

// Afro-centric type pairing, both browser-safe via Google Fonts:
// Cinzel for carved-stone titles, Ubuntu for readable HUD/body text.
const FONT_STYLESHEET_URL = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;900&family=Ubuntu:wght@400;700;900&display=swap';

function loadFonts() {
  if (!document.getElementById('dzetse-fonts')) {
    const link = document.createElement('link');
    link.id = 'dzetse-fonts';
    link.rel = 'stylesheet';
    link.href = FONT_STYLESHEET_URL;
    document.head.appendChild(link);
  }
  const specs = ['700 20px Ubuntu', '900 20px Ubuntu', '600 20px Cinzel', '900 20px Cinzel'];
  return Promise.all(specs.map((s) => document.fonts.load(s)))
    .then(() => document.fonts.ready)
    .catch((e) => console.warn('Font load fallback (using system fonts):', e));
}

function createLoadingScreen() {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'fixed', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0a0500', color: '#f5d59a', font: 'bold 22px Ubuntu, sans-serif', zIndex: '1000'
  });
  document.body.appendChild(el);
  return el;
}

function createCoverScreen(coverImgEl) {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: '#0a0500', zIndex: '1000', gap: '32px'
  });

  Object.assign(coverImgEl.style, {
    maxWidth: '90vw', maxHeight: '70vh', objectFit: 'contain',
    filter: 'drop-shadow(0 0 30px rgba(255,150,50,0.35))'
  });

  const button = document.createElement('button');
  button.textContent = 'PLAY';
  Object.assign(button.style, {
    font: '900 28px Cinzel, Georgia, serif', color: '#3a1e0f',
    background: 'linear-gradient(#ffd97a, #ff9a3a)', border: 'none', borderRadius: '14px',
    padding: '14px 56px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
    letterSpacing: '2px', transition: 'transform 0.15s ease'
  });
  button.addEventListener('mouseenter', () => { button.style.transform = 'scale(1.06)'; });
  button.addEventListener('mouseleave', () => { button.style.transform = 'scale(1)'; });

  overlay.appendChild(coverImgEl);
  overlay.appendChild(button);
  document.body.appendChild(overlay);
  return { overlay, button };
}

async function boot() {
  const loadingEl = createLoadingScreen();

  try {
    const [assets] = await Promise.all([
      loadAssets((loaded, total) => {
        loadingEl.textContent = `${Math.round((loaded / total) * 100)}%`;
      }),
      loadFonts()
    ]);

    const canvas = document.getElementById('game');
    const game = new Game(canvas, assets);
    loadingEl.remove();

    const { overlay, button } = createCoverScreen(assets.cover);
    button.addEventListener('click', () => {
      overlay.remove();
      game.audio.unlock().then(() => game.start());
    }, { once: true });
  } catch (err) {
    console.error('Boot failed:', err);
    loadingEl.remove();
    alert('Failed to load. Check console.\n\n' + err.message);
  }
}

boot();
