import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="#338cff"/><stop offset="1" stop-color="#1354d4"/></linearGradient></defs><rect width="512" height="512" rx="114" fill="url(#b)"/><g fill="none" stroke="white" stroke-width="23" stroke-linecap="round" stroke-linejoin="round"><path d="M155 359V169q0-22 22-22h105q22 0 22 22v190M139 364h184M304 229h21q22 0 22 22v58q0 20 18 20t18-20V206l-34-34"/><rect x="188" y="180" width="83" height="64" rx="8" fill="white" stroke="none"/><path d="m210 307 18 18 36-40"/></g></svg>`;
await mkdir("public/icons", { recursive: true });
await writeFile("public/favicon.svg", svg);
for (const [file, size] of [
  ["icon-192", 192],
  ["icon-512", 512],
  ["maskable-512", 512],
  ["apple-touch-icon", 180],
])
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icons/${file}.png`);
