"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, DownloadSimple } from "@phosphor-icons/react";
import type { PDFDocumentProxy } from "pdfjs-dist";

type Labels = {
  back: string;
  download: string;
  loading: string;
  pages: string;
  error: string;
  open: string;
  page: string;
  pageError: string;
  retry: string;
};

// The site's own PDF reader (PDF.js), so a report opens on screen in any
// browser, phones included (Chrome on Android has no viewer and would only
// download it). Pages are laid out at once from the first page's shape and
// each one is drawn as it nears the screen, at the width it is shown; the
// file streams in by ranges, so the first pages show long before the rest
// has arrived. The bar on top goes back to the site or downloads the file.
// Each page also carries its own text, hidden from sight, so screen readers
// read the report; a page still drawing shows a soft pulse, and one that fails
// says so, with a retry and the download.
export default function PdfReader({ src, title, back, labels }: { src: string; title: string; back: string; labels: Labels }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [ratio, setRatio] = useState(1.414);
  const [count, setCount] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let gone = false;
    let loaded: PDFDocumentProxy | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        loaded = await pdfjs.getDocument({ url: src, disableAutoFetch: true, rangeChunkSize: 524288 }).promise;
        if (gone) return void loaded.destroy();
        const first = await loaded.getPage(1);
        const v = first.getViewport({ scale: 1 });
        setRatio(v.height / v.width);
        setCount(loaded.numPages);
        setDoc(loaded);
      } catch {
        if (!gone) setFailed(true);
      }
    })();
    return () => {
      gone = true;
      loaded?.destroy();
    };
  }, [src]);

  const bar =
    "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-300";

  return (
    <div className="min-h-[100dvh] bg-[#150b20] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[rgb(21_11_32/0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          {/* Back to where the visitor came from on the site (scroll kept), or home. */}
          <a
            href={back}
            onClick={(e) => {
              try {
                if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
                  e.preventDefault();
                  history.back();
                }
              } catch {}
            }}
            className={`${bar} -ml-2 shrink-0 text-white/85 hover:bg-white/10`}
          >
            <ArrowLeft size="1.05rem" aria-hidden />
            <span className="max-sm:sr-only">{labels.back}</span>
          </a>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg leading-tight sm:text-xl">{title}</h1>
            {count > 0 && (
              <p className="text-xs text-white/55">
                {count} {labels.pages}
              </p>
            )}
          </div>
          <a href={src} download className={`${bar} shrink-0 bg-[#D9B865] text-[#2A1240] hover:bg-white`}>
            <DownloadSimple size="1.05rem" aria-hidden />
            <span className="max-sm:sr-only">{labels.download}</span>
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-10">
        {failed ? (
          <div className="grid min-h-[50vh] place-items-center text-center">
            <div>
              <p className="text-white/80">{labels.error}</p>
              <a href={src} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-11 items-center rounded-full bg-[#D9B865] px-5 text-sm font-medium text-[#2A1240]">
                {labels.open}
              </a>
            </div>
          </div>
        ) : !doc ? (
          <div className="grid min-h-[50vh] place-items-center" role="status">
            <span className="flex items-center gap-3 text-sm text-white/70">
              <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-[#D9B865]" />
              {labels.loading}
            </span>
          </div>
        ) : (
          <ol className="space-y-4 sm:space-y-6">
            {Array.from({ length: count }, (_, i) => (
              <li key={i}>
                <Page doc={doc} n={i + 1} total={count} ratio={ratio} src={src} labels={labels} />
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}

// One page: a white sheet of the document's proportions, drawn once it comes
// within about a screen of view (and redrawn if the width changes).
function Page({
  doc,
  n,
  total,
  ratio,
  src,
  labels,
}: {
  doc: PDFDocumentProxy;
  n: number;
  total: number;
  ratio: number;
  src: string;
  labels: Labels;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [own, setOwn] = useState<number | null>(null);
  const [state, setState] = useState<"drawing" | "ready" | "failed">("drawing");
  const [text, setText] = useState("");
  const [attempt, setAttempt] = useState(0);
  const name = labels.page.replace("{n}", String(n)).replace("{total}", String(total));

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let task: { cancel: () => void } | null = null;
    let gone = false;
    const draw = async () => {
      const el = box.current;
      const c = canvas.current;
      if (!el || !c) return;
      // A redraw at a new width keeps the drawn page on show.
      setState((st) => (st === "ready" ? st : "drawing"));
      let page;
      try {
        page = await doc.getPage(n);
      } catch {
        if (!gone) setState("failed");
        return;
      }
      if (gone) return;
      // The page's words, for screen readers (read once).
      page
        .getTextContent()
        .then((c) => !gone && setText(c.items.map((it) => ("str" in it ? it.str : "")).join(" ").replace(/\s+/g, " ").trim()))
        .catch(() => {});
      const base = page.getViewport({ scale: 1 });
      setOwn(base.height / base.width);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const v = page.getViewport({ scale: (el.clientWidth * dpr) / base.width });
      c.width = Math.floor(v.width);
      c.height = Math.floor(v.height);
      task?.cancel();
      const t = page.render({ canvas: c, viewport: v });
      task = t;
      try {
        await t.promise;
        if (!gone) setState("ready");
      } catch (err) {
        // A cancelled render (resize, leaving) is not a failure.
        if (!gone && (err as { name?: string })?.name !== "RenderingCancelledException") setState("failed");
      }
    };
    draw();
    let w = box.current?.clientWidth ?? 0;
    const ro = new ResizeObserver(() => {
      const now = box.current?.clientWidth ?? 0;
      if (Math.abs(now - w) > 24) {
        w = now;
        draw();
      }
    });
    if (box.current) ro.observe(box.current);
    return () => {
      gone = true;
      ro.disconnect();
      task?.cancel();
    };
  }, [near, doc, n, attempt]);

  return (
    <div
      ref={box}
      className="relative w-full overflow-hidden rounded-md bg-white shadow-[0_20px_60px_-30px_rgb(0_0_0/0.8)]"
      style={{ aspectRatio: `1 / ${own ?? ratio}` }}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />
      {/* The page as text for screen readers, named "Page n of N". */}
      <section aria-label={name} className="sr-only">
        {text}
      </section>
      {state === "drawing" && <span aria-hidden className="absolute inset-0 animate-pulse bg-[#ece8f0]" />}
      {state === "failed" && (
        <div className="absolute inset-0 grid place-items-center bg-[#f4f1f6] p-6 text-center text-[#2A1240]">
          <div className="grid justify-items-center gap-3">
            <p className="text-sm">{labels.pageError}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setAttempt((a) => a + 1)}
                className="inline-flex h-11 items-center rounded-full bg-[#2A1240] px-5 text-sm font-medium text-white"
              >
                {labels.retry}
              </button>
              <a href={src} download className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium ring-1 ring-[#2A1240]/25">
                {labels.download}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
