import { readFile, access } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";

const root = resolve("ios/App/App/public");
const config = JSON.parse(
  await readFile("ios/App/App/capacitor.config.json", "utf8"),
);
if (config.server?.url)
  throw new Error(
    "Die iOS-App muss gebündelte Dateien verwenden, keine Server-URL.",
  );
if (
  !/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*)+$/.test(
    config.appId || "",
  ) ||
  config.webDir !== "dist-native"
)
  throw new Error("Unerwartete App-ID oder Web-Verzeichnis.");
const html = await readFile(resolve(root, "index.html"), "utf8");
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((p) => p.startsWith("/"));
for (const asset of assets) {
  const target = resolve(root, asset.slice(1));
  const local = relative(root, target);
  if (local.startsWith(`..${sep}`) || local === "..")
    throw new Error("Asset liegt außerhalb des App-Bundles.");
  await access(target);
}
if (html.includes("/tankmo/") || html.includes("manifest.webmanifest"))
  throw new Error(
    "PWA-Dateipfade wurden versehentlich in die native App übernommen.",
  );
try {
  await access(resolve(root, "sw.js"));
  throw new Error("Die native App darf keinen PWA-Service-Worker bündeln.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
console.log(
  `iOS-App-Bundle geprüft: ${assets.length} lokale Assets, gültige App-ID, keine Server-URL und kein Service Worker.`,
);
