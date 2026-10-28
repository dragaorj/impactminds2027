// Anything with its own sound (the numbers presentation, a video with sound)
// asks the background music to step aside: it fades out and pauses, then
// fades back in once every request has been released. Keys let several
// sources overlap.
export const duckMusic = (key: string) => window.dispatchEvent(new CustomEvent("im:music-duck", { detail: key }));
export const unduckMusic = (key: string) => window.dispatchEvent(new CustomEvent("im:music-unduck", { detail: key }));
