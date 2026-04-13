const sharp = require('sharp');
const path = require('path');

async function removeBg(inputPath, outputPath, threshold = 30) {
  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  const buf = Buffer.from(data);

  // Sample corner pixels to determine background color
  function getPixel(x, y) {
    const i = (y * width + x) * channels;
    return [buf[i], buf[i+1], buf[i+2], buf[i+3]];
  }

  // Use top-left corner as bg reference
  const [br, bg, bb] = getPixel(0, 0);

  // BFS flood-fill from all 4 corners
  const visited = new Uint8Array(width * height);
  const queue = [];

  function enqueue(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const [r, g, b, a] = getPixel(x, y);
    if (a < 128) return; // already transparent
    const dist = Math.sqrt((r-br)**2 + (g-bg)**2 + (b-bb)**2);
    if (dist > threshold) return;
    visited[idx] = 1;
    queue.push([x, y]);
  }

  // seed from corners
  enqueue(0, 0); enqueue(width-1, 0);
  enqueue(0, height-1); enqueue(width-1, height-1);

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const i = (y * width + x) * channels;
    buf[i+3] = 0; // make transparent
    enqueue(x+1, y); enqueue(x-1, y);
    enqueue(x, y+1); enqueue(x, y-1);
  }

  await sharp(buf, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log(`Saved: ${outputPath}`);
}

async function main() {
  await removeBg('public/logo.png', 'public/logo.png');
  await removeBg('public/favicon.png', 'public/favicon.png');
}

main().catch(console.error);
