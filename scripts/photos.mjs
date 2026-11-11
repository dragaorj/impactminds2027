// Edition photos, ready for the site, from any originals.
//
//   1. Drop the originals (any size: JPG, PNG, HEIC from a phone, WebP…) in
//      photos-inbox/<year>/   e.g. photos-inbox/2024/
//   2. npm run photos          (also runs by itself before `npm run dev`
//                               and `npm run build`)
//
// Each photo is turned upright (camera orientation), made at most 2400 px on
// its long side (as the 2026 photos: 2400 × 1600), saved as WebP and numbered
// in file-name order: public/photos/editions/<year>/01.webp, 02.webp…
// The year's gallery on the site picks them up by itself (lib/editions.ts).
// Once converted, a year's originals can be deleted from the inbox; the
// inbox itself is never committed (.gitignore).

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INBOX = path.join(ROOT, "photos-inbox");
const OUT = path.join(ROOT, "public", "photos", "editions");
const IMAGE = /\.(jpe?g|png|webp|avif|tiff?|heic|heif)$/i;
const MAX = 2400; // long side, in pixels
const QUALITY = 80;

if (!fs.existsSync(INBOX)) process.exit(0); // nothing to do (as on the server)
// Loaded only when there are photos (sharp comes with Next.js).
const { default: sharp } = await import("sharp");

const years = fs
  .readdirSync(INBOX, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{4}$/.test(d.name))
  .map((d) => d.name);

for (const year of years) {
  const src = path.join(INBOX, year);
  const files = fs
    .readdirSync(src)
    .filter((f) => IMAGE.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!files.length) continue;

  const dest = path.join(OUT, year);
  fs.mkdirSync(dest, { recursive: true });
  // Already done for these very originals (names and sizes): skipped.
  const stamp = path.join(dest, ".converted");
  const print = files.map((f) => `${f}:${fs.statSync(path.join(src, f)).size}`).join("|");
  if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === print) continue;
  // The year is replaced as a whole: the inbox is its source of truth.
  for (const f of fs.readdirSync(dest)) if (/\.(jpe?g|png|webp|avif)$/i.test(f)) fs.rmSync(path.join(dest, f));

  let before = 0;
  let after = 0;
  for (const [i, f] of files.entries()) {
    const from = path.join(src, f);
    const to = path.join(dest, `${String(i + 1).padStart(2, "0")}.webp`);
    await sharp(from)
      .rotate()
      .resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(to);
    before += fs.statSync(from).size;
    after += fs.statSync(to).size;
  }
  fs.writeFileSync(stamp, print);
  const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
  console.log(`photos ${year}: ${files.length} → public/photos/editions/${year}/  (${mb(before)} → ${mb(after)})`);
}
