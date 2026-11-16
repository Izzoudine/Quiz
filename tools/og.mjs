// Génère public/thumbs/<nom>.webp (640 px) et public/og/<slug>.jpg (1200×630) depuis les miniatures des vidéos.
// Usage : node tools/og.mjs [dossier des miniatures]   (par défaut ../video/out/miniatures)
// Les images produites sont commitées : Vercel n'a pas besoin du dossier source.
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2] ?? "../video/out/miniatures";
const names = { 1: "ep1", 2: "ep2", 3: "ep3", 4: "ep4", 5: "ep5", recap: "recap" };
mkdirSync("public/thumbs", { recursive: true });
mkdirSync("public/og", { recursive: true });

for (const [slug, name] of Object.entries(names)) {
  const file = join(src, `${name}.png`);
  if (!existsSync(file)) throw new Error(`miniature manquante : ${file}`);
  await sharp(file).resize(640, 360).webp({ quality: 78 }).toFile(`public/thumbs/${name}.webp`);
  await sharp(file).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toFile(`public/og/${slug}.jpg`);
}

// image de partage de l'accueil : les 6 miniatures en mosaïque 3×2 sur papier
const tiles = await Promise.all(
  Object.values(names).map((n) => sharp(join(src, `${n}.png`)).resize(372, 209).png().toBuffer()),
);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#FCFCF8" } })
  .composite(tiles.map((input, i) => ({ input, left: 24 + (i % 3) * 388, top: 95 + Math.floor(i / 3) * 225 })))
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile("public/og/home.jpg");
console.log("ok");
