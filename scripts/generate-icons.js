import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgPath = join(publicDir, 'favicon.svg');
const svg = readFileSync(svgPath);

const sizes = [192, 512];

for (const size of sizes) {
  const outputPath = join(publicDir, `icon-${size}.png`);
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`Created ${outputPath}`);
}

console.log('Done!');
