const IMAGE_LIST = {
  arena_day:            'assets/arena_day.jpg',
  arena_night:          'assets/arena_night.jpg',
  cover:                'assets/cover.png',
  croc_idle:            'assets/croc_idle.png',
  croc_night:           'assets/croc_night.png',
  dzetse_left:          'assets/dzetse_left.png',
  dzetse_main:          'assets/dzetse_main.png',
  dzetse_recoil:        'assets/dzetse_recoil.png',
  dzetse_right:         'assets/dzetse_right.png',
  dzetse_shoot:         'assets/dzetse_shoot.png',
  platform:             'assets/platform.png',
  platform_perspective: 'assets/platform_perspective.png'
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load: ' + src));
    img.src = src;
  });
}

export async function loadAssets(onProgress) {
  const keys = Object.keys(IMAGE_LIST);
  const total = keys.length;
  let loaded = 0;
  const out = {};

  await Promise.all(keys.map(async (key) => {
    const img = await loadImage(IMAGE_LIST[key]);
    out[key] = img;
    loaded++;
    if (onProgress) onProgress(loaded, total);
  }));

  return out;
}