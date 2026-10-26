"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "./prefs";

const TURN_MS = 12_000; // one slow revolution
const FRAME_MS = 100;

// Browsers show SVG favicons as a still image, so the Latimpacto mark is drawn
// rotated onto a canvas and fed to the tab a few times a second. Chrome
// prefers an SVG icon over any PNG one, so instead of adding a second link the
// existing icon links are taken over while spinning and restored afterwards.
// The static /icon.svg stays for crawlers and reduced motion.
export default function FaviconSpin() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let links: { el: HTMLLinkElement; href: string; type: string; sizes: string }[] = [];
    let added: HTMLLinkElement | null = null;
    let timer = 0;
    const img = new Image();
    img.onload = () => {
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
      const draw = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(((Date.now() % TURN_MS) / TURN_MS) * Math.PI * 2);
        // The petals reach the corners, so draw slightly smaller to stay inside the tile while turning.
        const s = size * 0.7;
        ctx.drawImage(img, -s / 2, -s / 2, s, s);
        ctx.restore();
        const url = canvas.toDataURL("image/png");
        for (const { el } of links) el.href = url;
      };
      draw();
      timer = window.setInterval(draw, FRAME_MS);
    };
    img.src = "/brand/favicon.svg";

    return () => {
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
