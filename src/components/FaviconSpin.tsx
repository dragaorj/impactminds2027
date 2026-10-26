"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "./prefs";

const TURN_MS = 14_000; // one slow revolution
const FRAME_MS = 50; // ~1.3° per frame, small enough to read as continuous
const SIZE = 64;

// Draws one rotated frame. Shared by the worker (stringified below) and the
// main-thread fallback, so it must stay self-contained.
function drawFrame(ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, img: CanvasImageSource, size: number, turnMs: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.imageSmoothingQuality = "high";
  ctx.translate(size / 2, size / 2);
  ctx.rotate(((Date.now() % turnMs) / turnMs) * Math.PI * 2);
  // The petals reach the corners, so draw slightly smaller to stay inside the tile while turning.
  const s = size * 0.7;
  ctx.drawImage(img, -s / 2, -s / 2, s, s);
  ctx.restore();
}

// Frames are rendered in a worker on an OffscreenCanvas: worker timers are not
// throttled like the page's own timers, so the spin stays even (also while
// the tab is in the background) and never competes with page animations.
const workerSource = `
const drawFrame = ${drawFrame.toString()};
let timer = 0;
onmessage = (e) => {
  const { bitmap, size, turnMs, frameMs } = e.data;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const reader = new FileReaderSync();
  let busy = false;
  timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    drawFrame(ctx, bitmap, size, turnMs);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    postMessage(reader.readAsDataURL(blob));
    busy = false;
  }, frameMs);
};
`;

// Browsers show SVG favicons as a still image, so the Latimpacto mark is drawn
// rotated and fed to the tab many times a second. Chrome prefers an SVG icon
// over any PNG one, so the existing icon links are taken over while spinning
// and restored afterwards. The static /icon.svg stays for crawlers and
// reduced motion.
export default function FaviconSpin() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let links: { el: HTMLLinkElement; href: string; type: string; sizes: string }[] = [];
    let added: HTMLLinkElement | null = null;
    let worker: Worker | null = null;
    let timer = 0;
    let cancelled = false;

    const takeOver = () => {
      links = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')].map((el) => ({
        el,
        href: el.href,
        type: el.type,
        sizes: el.getAttribute("sizes") ?? "",
      }));
      if (!links.length) {
        added = document.createElement("link");
        added.rel = "icon";
        document.head.appendChild(added);
        links = [{ el: added, href: "", type: "", sizes: "" }];
      }
      for (const { el } of links) {
        el.type = "image/png";
        el.removeAttribute("sizes");
      }
    };
    const show = (url: string) => {
      for (const { el } of links) el.href = url;
    };

    const img = new Image(SIZE * 2, SIZE * 2);
    img.onload = async () => {
      if (cancelled) return;
      takeOver();
      try {
        if (typeof OffscreenCanvas === "undefined") throw new Error("no OffscreenCanvas");
        const bitmap = await createImageBitmap(img, { resizeWidth: SIZE * 2, resizeHeight: SIZE * 2 });
        if (cancelled) return;
        const url = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
        worker = new Worker(url);
        URL.revokeObjectURL(url);
        worker.onmessage = (e: MessageEvent<string>) => show(e.data);
        worker.postMessage({ bitmap, size: SIZE, turnMs: TURN_MS, frameMs: FRAME_MS }, [bitmap]);
      } catch {
        // Fallback: draw on the main thread.
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        timer = window.setInterval(() => {
          drawFrame(ctx, img, SIZE, TURN_MS);
          show(canvas.toDataURL("image/png"));
        }, FRAME_MS);
      }
    };
    img.src = "/brand/favicon.svg";

    return () => {
      cancelled = true;
      worker?.terminate();
      window.clearInterval(timer);
      added?.remove();
      for (const { el, href, type, sizes } of links) {
        if (el === added) continue;
        el.href = href;
        el.type = type;
        if (sizes) el.setAttribute("sizes", sizes);
      }
    };
  }, []);

  return null;
}
