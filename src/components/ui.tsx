import type { ReactNode } from "react";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

// Double-bezel card: tinted outer tray + inner core with concentric radius.
export function Bezel({
  children,
  className = "",
  inner = "bg-surface",
}: {
  children: ReactNode;
  className?: string;
  inner?: string;
}) {
  return (
    <div className={`rounded-[2rem] bg-ink/[0.04] p-1.5 ring-1 ring-line ${className}`}>
      <div
        className={`relative isolate h-full overflow-hidden rounded-[calc(2rem-6px)] shadow-[inset_0_1px_1px_rgb(255_255_255/0.12)] ${inner}`}
      >
        {children}
      </div>
    </div>
  );
}

const btnBase =
  "group inline-flex h-12 items-center gap-3 whitespace-nowrap rounded-full pl-6 pr-1.5 text-[0.9375rem] font-medium transition-transform duration-500 ease-[var(--ease-spring)] active:scale-[0.98]";

export function Button({
  href,
  children,
  tone = "brand",
  external = false,
}: {
  href: string;
  children: ReactNode;
  tone?: "brand" | "light" | "ghost";
  external?: boolean;
}) {
  const tones = {
    brand: ["btn-solid", "bg-brand-ink/15"],
    light: ["btn-light", "bg-block/10"],
    ghost: ["btn-outline", "bg-ink/8"],
  } as const;
  const [shell, icon] = tones[tone];
  return (
    <a
      href={href}
      className={`${btnBase} ${shell}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      <span
        className={`grid size-9 place-items-center rounded-full ${icon} transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105`}
      >
        <ArrowUpRight size="1rem" />
      </span>
    </a>
  );
}

export function H2({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={`font-display text-[clamp(2.25rem,5.2vw,4.25rem)] leading-[1.02] text-ink ${className}`}>
      {children}
    </h2>
  );
}

// Content sits above the decorative vectors (which are absolutely positioned).
// Full-width layout: content spans the screen with proportional side gutters
// (readable line lengths come from max-w-[..ch] on the text itself).
export const gutter = "px-5 sm:px-8 lg:px-[5vw]";
// Content never stretches past 132rem: on ultrawide screens it stays centred
// at desktop proportions while section backgrounds still run edge to edge.
export const container = `relative z-[1] mx-auto w-full max-w-[132rem] ${gutter}`;
export const section = "relative py-24 md:py-36";
