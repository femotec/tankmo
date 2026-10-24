import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile("public/favicon.svg", "utf8");
await sharp(Buffer.from(svg.replace('rx="114"', 'rx="0"')))
  .resize(1024, 1024)
  .flatten({ background: "#1765eb" })
  .png()
  .toFile("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png");
const mark = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
const splash = await sharp({
  create: { width: 2732, height: 2732, channels: 3, background: "#0e141f" },
})
  .composite([{ input: mark, gravity: "centre" }])
  .png()
  .toBuffer();
for (const file of [
  "splash-2732x2732.png",
  "splash-2732x2732-1.png",
  "splash-2732x2732-2.png",
])
  await writeFile(
    `ios/App/App/Assets.xcassets/Splash.imageset/${file}`,
    splash,
  );
