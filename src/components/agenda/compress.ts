// Every photo is made light in the browser before it is uploaded: turned
// upright (phone photos), cropped and resized to the largest size it is ever
// shown at, and saved as WebP. A 5 MB phone photo becomes ~100–250 KB.

export type ImageKind = "speaker" | "place";

// Speakers: 4:5 portrait, the shape of their cards; the circles (the photo
// wall, the zoomed photo, up to 544 px wide, twice that on sharp screens) take
// its middle. 1200 × 1500 keeps them sharp everywhere.
const SPEAKER = { w: 1200, h: 1500 };
// Places (session images): not cropped, at most 2000 px on the long side.
const PLACE_MAX = 2000;
const QUALITY = 0.82;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Older Safari: through an <img>, which also applies the orientation.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function compressImage(file: File, kind: ImageKind): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return file;
  let src: ImageBitmap | HTMLImageElement;
  try {
    src = await decode(file);
  } catch {
    return file; // A format the browser can't read: sent as it is.
  }
  const sw = "naturalWidth" in src ? src.naturalWidth : src.width;
  const sh = "naturalHeight" in src ? src.naturalHeight : src.height;

  // The part of the photo kept (sx, sy, cw, ch) and the size it is drawn at.
  let sx = 0, sy = 0, cw = sw, ch = sh, w: number, h: number;
  if (kind === "speaker") {
    const ratio = SPEAKER.w / SPEAKER.h;
    if (sw / sh > ratio) {
      cw = Math.round(sh * ratio); // Too wide: trim both sides evenly.
      sx = Math.round((sw - cw) / 2);
    } else {
      ch = Math.round(sw / ratio); // Too tall: keep the top, where the face is.
      sy = Math.round((sh - ch) * 0.2);
    }
    const scale = Math.min(1, SPEAKER.w / cw); // Never enlarged.
    w = Math.round(cw * scale);
    h = Math.round(ch * scale);
  } else {
    const scale = Math.min(1, PLACE_MAX / Math.max(sw, sh));
    w = Math.round(sw * scale);
    h = Math.round(sh * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, sx, sy, cw, ch, 0, 0, w, h);
  if ("close" in src) src.close();

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", QUALITY));
  // A browser without WebP output (it falls back to PNG): the original. A
  // place photo already smaller than the result: the original too (speakers
  // always get the crop, so every card lines up).
  if (!blob || blob.type !== "image/webp") return file;
  if (kind === "place" && blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}
