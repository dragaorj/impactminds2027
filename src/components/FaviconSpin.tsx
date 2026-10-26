"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "./prefs";

const TURN_MS = 12_000; // one slow revolution
const FRAME_MS = 100;

// Browsers show SVG favicons as a still image, so the Latimpacto mark is drawn
// rotated onto a canvas and swapped in as the tab icon a few times a second.
// The static /icon.svg stays as the fallback for crawlers and reduced motion.
export default function FaviconSpin() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    let timer = 0;
    const img = new Image();
    img.onload = () => {
      document.head.appendChild(link);
      const draw = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(((Date.now() % TURN_MS) / TURN_MS) * Math.PI * 2);
        // The petals reach the corners, so draw slightly smaller to stay inside the tile while turning.
        const s = size * 0.7;
        ctx.drawImage(img, -s / 2, -s / 2, s, s);
        ctx.restore();
        link.href = canvas.toDataURL("image/png");
      };
      draw();
      timer = window.setInterval(draw, FRAME_MS);
    };
    img.src = "/brand/favicon.svg";

    return () => {
      window.clearInterval(timer);
      link.remove();
    };
  }, []);

  return null;
}
