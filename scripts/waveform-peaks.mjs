// Precomputes the music player's waveforms (Waveform.tsx): the loudness of
// 112 slices of every track in public/music, saved to public/music/peaks.json.
// Run once whenever the playlist changes:  node scripts/waveform-peaks.mjs
// (The browser then never has to download and decode a whole MP3 for it.)
import fs from "node:fs";
import path from "node:path";
import decode from "audio-decode";

const SLICES = 112;
const dir = path.join(process.cwd(), "public", "music");
const out = {};

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".mp3")).sort()) {
  const audio = await decode(fs.readFileSync(path.join(dir, file)));
  const data = audio.channelData[0];
  const size = Math.floor(data.length / SLICES);
  const rms = [];
  for (let i = 0; i < SLICES; i++) {
    let sum = 0;
    const start = i * size;
    // Every 16th sample is plenty for a loudness estimate (as the player did).
    for (let j = 0; j < size; j += 16) sum += data[start + j] ** 2;
    rms.push(Number(Math.sqrt(sum / (size / 16)).toFixed(4)));
  }
  out[`/music/${file}`] = rms;
  console.log(file, "ok");
}

fs.writeFileSync(path.join(dir, "peaks.json"), JSON.stringify(out));
console.log("wrote public/music/peaks.json");
