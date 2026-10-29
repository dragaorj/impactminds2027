import fs from "node:fs";
import path from "node:path";

// Self-hosted video files take over from the YouTube embeds as soon as they are
// dropped into public/videos (header-2.mp4, about.mp4; a new file gets a new
// name, since videos are cached for a week): the native player shows
// no YouTube chrome at any moment. Checked at build/render time.
export function localVideo(file: string): string | undefined {
  return fs.existsSync(path.join(process.cwd(), "public", "videos", file)) ? `/videos/${file}` : undefined;
}
