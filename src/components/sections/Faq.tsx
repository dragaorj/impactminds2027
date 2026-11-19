"use client";

import { useEffect, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { FaqBlock, FaqItem } from "@/lib/faq";
import { FAQ_EMAIL } from "@/lib/faq";

// One answer's text: paragraphs and bulleted lists; [[sponsor:…]] becomes the
// link to the sponsorship brochure, [[mail]] the conference's e-mail.
function Rich({ text, sponsorHref }: { text: string; sponsorHref: string }) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[\[(sponsor|mail)(?::([^\]]+))?\]\]$/);
        if (!m) return <span key={i}>{p}</span>;
        if (m[1] === "mail")
          return (
            <a key={i} href={`mailto:${FAQ_EMAIL}`} className="font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:decoration-brand">
              {FAQ_EMAIL}
            </a>
          );
        return (
          <a
            key={i}
            href={sponsorHref}
            {...(sponsorHref.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:decoration-brand"
          >
            {m[2]}
          </a>
        );
      })}
    </>
  );
}

function Answer({ blocks, sponsorHref }: { blocks: FaqBlock[]; sponsorHref: string }) {
  return (
    <div className="space-y-4 text-base leading-relaxed text-ink-2 md:text-lg">
      {blocks.map((b, i) =>
        typeof b === "string" ? (
          <p key={i}>
            <Rich text={b} sponsorHref={sponsorHref} />
          </p>
        ) : (
          <ul key={i} className="space-y-2.5">
            {b.map((li) => (
              <li key={li} className="flex gap-3">
                <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-gold" />
                <span>{li}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

// The questions, numbered, one under the other; a question opens its answer
// in place with a soft glide (several can be open at once).
export default function FaqList({ items, sponsorHref }: { items: FaqItem[]; sponsorHref: string }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  // Arriving with #q-5 (a question picked on the home page): that question
  // opens and comes into view.
  useEffect(() => {
    const m = /^#q-(\d+)$/.exec(location.hash);
    if (!m) return;
    const i = Number(m[1]);
    const id = requestAnimationFrame(() => {
      setOpen(new Set([i]));
      document.getElementById(`q-${i}`)?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <ol className="divide-y divide-line border-y border-line">
      {items.map((it, i) => {
        const on = open.has(i);
        const id = `faq-${i}`;
        return (
          <li key={it.q} id={`q-${i}`} className="scroll-mt-28">
            <h2>
              <button
                type="button"
                aria-expanded={on}
                aria-controls={id}
                onClick={() => toggle(i)}
                className="group flex w-full items-start gap-4 py-6 text-left md:gap-6 md:py-7"
              >
                <span aria-hidden className="w-[2ch] shrink-0 pt-1 font-display text-lg tabular-nums text-gold md:text-xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-display text-[clamp(1.25rem,2vw,1.625rem)] leading-snug text-ink transition-colors group-hover:text-brand">{it.q}</span>
                <span
                  aria-hidden
                  className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ring-1 transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] ${
                    on ? "rotate-45 bg-brand text-brand-ink ring-brand" : "text-ink ring-line group-hover:bg-sun group-hover:text-sun-ink group-hover:ring-sun"
                  }`}
                >
                  <Plus size="1rem" weight="bold" />
                </span>
              </button>
            </h2>
            <div id={id} role="region" className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="pb-8 pl-[calc(2ch+1rem)] pr-2 md:pl-[calc(2ch+1.5rem)] md:pr-16">
                  <Answer blocks={it.a} sponsorHref={sponsorHref} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
