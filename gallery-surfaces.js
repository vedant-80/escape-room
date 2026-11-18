import * as THREE from 'three';

function makeSurface(width, height, anisotropy, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let seed = 413;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  paint(canvas.getContext('2d'), width, height, random);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

function addGrain(context, width, height, random, count) {
  for (let index = 0; index < count; index++) {
    context.fillStyle = index % 2 ? '#453e3021' : '#fffaf02b';
    const size = 0.6 + random() * 2.1;
    context.fillRect(random() * width, random() * height, size * 1.5, size);
  }
}

export function limestoneTexture(anisotropy) {
  return makeSurface(768, 384, anisotropy, (context, width, height, random) => {
    const stone = ['#c9bfaa', '#c2b7a2', '#cec4b1', '#c4b9a6', '#c6baa3'];
    const blockWidth = width / 4;
    const blockHeight = height / 4;
    context.fillStyle = '#a59a87';
    context.fillRect(0, 0, width, height);

    for (let row = 0; row < 4; row++) {
      const colors = Array.from({ length: 4 }, () => stone[Math.floor(random() * stone.length)]);
      const y = row * blockHeight;
      const offset = row % 2 * blockWidth / 2;
      for (let column = -1; column < 4; column++) {
        const x = column * blockWidth + offset;
        context.fillStyle = colors[(column + 4) % 4];
        context.fillRect(x + 1, y + 1, blockWidth - 2, blockHeight - 2);
        context.fillStyle = '#fff8e438';
        context.fillRect(x + 2, y + 2, blockWidth - 4, 1);
      }
    }
    addGrain(context, width, height, random, 12500);
  });
}

export function marbleTexture(anisotropy) {
  return makeSurface(768, 768, anisotropy, (context, width, height, random) => {
    const tile = width / 4;
    const marble = ['#e2ded4', '#d7d3c9', '#e6e1d7', '#dad6cd'];
    context.fillStyle = '#a9a296';
    context.fillRect(0, 0, width, height);

    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 4; column++) {
        context.save();
        context.translate(column * tile, row * tile);
        context.beginPath();
        context.rect(1, 1, tile - 2, tile - 2);
        context.clip();
        context.fillStyle = marble[Math.floor(random() * marble.length)];
        context.fillRect(0, 0, tile, tile);
        if (random() > 0.5) {
          context.translate(tile, 0);
          context.scale(-1, 1);
        }

        for (let vein = 0; vein < 4; vein++) {
          const start = -55 + vein * 64 + random() * 45;
          const drift = 0.5 + random() * 0.6;
          const curve = 10 + random() * 19;
          const phase = random() * Math.PI * 2;
          context.beginPath();
          for (let x = 0; x <= tile; x += 4) {
            const y = start + x * drift + Math.sin(x / 29 + phase) * curve
              + Math.sin(x / 7 + phase) * 2.6;
            if (x === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.lineCap = 'round';
          context.strokeStyle = '#8d85791d';
          context.lineWidth = 5 + random() * 8;
          context.stroke();
          context.strokeStyle = '#77756c40';
          context.lineWidth = 0.6 + random() * 0.9;
          context.stroke();
        }
        context.restore();
      }
    }
    addGrain(context, width, height, random, 9000);
  });
}
