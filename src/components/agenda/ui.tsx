"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CaretDown, X } from "@phosphor-icons/react";

// The platform's building blocks, in an iOS-like hand: soft white surfaces on
// a quiet ground, hairline borders, gentle shadows, large radii, clear type
// (titles semibold and tight, text at a comfortable 15px, secondary in grey).

export const card = "rounded-[22px] bg-surface shadow-[var(--shadow-card)] ring-1 ring-line";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export function Avatar({ name, photo, size = 32, ring = false }: { name: string; photo?: string; size?: number; ring?: boolean }) {
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-brand-soft align-middle ${ring ? "ring-2 ring-surface" : ""}`} style={{ width: size, height: size }} title={name}>
      {photo ? (
        <Image src={photo} alt="" fill sizes={`${Math.round(size * 2)}px`} className="object-cover" />
      ) : (
        <span className="grid size-full place-items-center font-semibold text-brand" style={{ fontSize: Math.max(11, size * 0.36) }}>
          {initials(name)}
        </span>
      )}
    </span>
  );
}

// A soft label with a colour dot (format, room).
// size "md": the height of the pill buttons beside it (h-9).
export function Tag({ color, children, size = "sm" }: { color: string; children: React.ReactNode; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold ${size === "md" ? "h-9 px-3.5 text-[13px]" : "px-2.5 py-1 text-xs"}`}
      style={{ background: `color-mix(in srgb, ${color} 12%, white)`, color: `color-mix(in srgb, ${color} 78%, black)` }}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="truncate">{children}</span>
    </span>
  );
}

// iOS segmented control: a grey track, the chosen item on a raised white thumb.
export function Segmented<V extends string>({
  value,
  onChange,
  options,
  label,
  className = "",
  size = "md",
}: {
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: React.ReactNode; title?: string }[];
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="group" aria-label={label} className={`flex rounded-full bg-[rgb(118_118_128/0.12)] p-[3px] ${className}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 font-medium sm:px-3.5 transition-[background-color,box-shadow,color] duration-200 ${
              size === "sm" ? "h-8 text-[13px]" : "h-9 text-sm"
            } ${on ? "bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06),0_3px_8px_-2px_rgb(0_0_0/0.12)]" : "text-ink-2 hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Buttons: primary (brand), secondary (white), quiet (no fill), danger.
export function Button({
  kind = "secondary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "primary" | "secondary" | "quiet" | "danger" }) {
  const look = {
    primary: "bg-brand text-brand-ink shadow-[0_8px_20px_-10px_rgb(91_42_134/0.7)] hover:brightness-110",
    secondary: "bg-surface text-ink ring-1 ring-line shadow-[var(--shadow-card)] hover:bg-[#fbfafc]",
    quiet: "text-ink-2 hover:bg-[rgb(118_118_128/0.1)] hover:text-ink",
    danger: "bg-[#fdecec] text-[#b42318] hover:bg-[#fbdcdc]",
  }[kind];
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition-[transform,background-color,filter,box-shadow] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${look} ${className}`}
    />
  );
}

// Detail panel. Default: slides in from the right on wide screens (a floating
// card), up from the bottom on phones. centered: a card in the middle of the
// screen. A native <dialog> (focus trap, Esc, inert page), closed by the
// button, Esc or a click on the veil. An optional footer stays pinned.
export function Sheet({
  open,
  onClose,
  label,
  closeLabel,
  centered = false,
  wide = false,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  closeLabel: string;
  centered?: boolean;
  wide?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // Opens at the top (the photo, the title), whatever got the focus.
      requestAnimationFrame(() => body.current?.scrollTo({ top: 0 }));
    }
    if (!open && d.open) d.close();
  }, [open]);

  const box = centered
    ? "m-auto max-h-[min(90dvh,54rem)] rounded-[28px]"
    : "m-0 mt-auto max-h-[92dvh] w-full rounded-t-[28px] sm:my-3 sm:ml-auto sm:mr-3 sm:h-[calc(100dvh-1.5rem)] sm:max-h-none sm:w-[min(31rem,calc(100vw-1.5rem))] sm:rounded-[28px]";

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-centered={centered ? "" : undefined}
      className={`platform-sheet max-w-none overflow-hidden bg-surface p-0 text-ink shadow-[0_30px_80px_-24px_rgb(28_20_36/0.4)] backdrop:bg-[rgb(28_20_36/0.24)] backdrop:backdrop-blur-[3px] ${box}`}
      style={centered ? { width: `min(${wide ? "40rem" : "34rem"}, calc(100vw - 1.5rem))` } : undefined}
    >
      <div className={`flex flex-col ${centered ? "max-h-[min(90dvh,54rem)]" : "max-h-[92dvh] sm:h-full sm:max-h-none"}`}>
        <div className="relative flex shrink-0 items-center justify-end px-4 pt-3">
          {!centered && <span aria-hidden className="absolute left-1/2 top-2 h-[5px] w-9 -translate-x-1/2 rounded-full bg-[rgb(118_118_128/0.3)] sm:hidden" />}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="grid size-9 place-items-center rounded-full bg-[rgb(118_118_128/0.12)] text-ink-2 transition-colors hover:bg-[rgb(118_118_128/0.2)] hover:text-ink"
          >
            <X size={15} weight="bold" />
          </button>
        </div>
        <div
          ref={body}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-8 pt-3 sm:px-7"
        >
          {children}
        </div>
        {footer && <div className="shrink-0 border-t border-line bg-surface px-6 py-4 sm:px-7">{footer}</div>}
      </div>
    </dialog>
  );
}

// "24 ago", "Ter" and the long form, from an ISO date, in the visitor's language.
export function dayLabel(date: string, lang: string) {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return { weekday: "", day: date, num: date, long: date };
  const loc = lang === "pt" ? "pt-BR" : lang;
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: "UTC", ...o }).format(d);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    weekday: cap(f({ weekday: "short" }).replace(".", "")),
    day: f({ day: "numeric", month: "short" }).replace(".", ""),
    num: f({ day: "numeric" }),
    long: cap(f({ weekday: "long", day: "numeric", month: "long" })),
  };
}

export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// A long text in short: six lines ending in "…", and a small button with an
// arrow to read the rest (and to fold it again).
export function ReadMore({ text, more, less, className = "" }: { text: string; more: string; less: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420;
  return (
    <div className={className}>
      <div className="relative">
        <p className={`whitespace-pre-line text-[15px] leading-[1.6] text-ink-2 ${long && !open ? "line-clamp-6" : ""}`}>{text}</p>
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
        >
          {open ? less : more}
          <CaretDown size={13} weight="bold" aria-hidden className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------- form fields

export const fieldBox =
  "w-full rounded-[14px] bg-[rgb(118_118_128/0.08)] px-4 text-[15px] text-ink outline-none ring-1 ring-transparent transition-[box-shadow,background-color] placeholder:text-muted focus:bg-surface focus:ring-2 focus:ring-brand/35";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// The same text in PT / EN / ES: one field, three tabs (a dot marks an
// empty language).
export function TriField({
  label,
  value,
  onChange,
  multiline = false,
  langsLabel,
}: {
  label: string;
  value: Partial<Record<"pt" | "en" | "es", string>>;
  onChange: (v: { pt: string; en: string; es: string }) => void;
  multiline?: boolean;
  langsLabel: string;
}) {
  const [l, setL] = useState<"pt" | "en" | "es">("pt");
  const v = { pt: value.pt ?? "", en: value.en ?? "", es: value.es ?? "" };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-2">{label}</span>
        <Segmented
          size="sm"
          label={langsLabel}
          value={l}
          onChange={setL}
          options={(["pt", "es", "en"] as const).map((x) => ({
            value: x,
            label: (
              <span className="flex items-center gap-1 uppercase">
                {x}
                {!v[x].trim() && <span aria-hidden className="size-1 rounded-full bg-[#e0a43a]" />}
              </span>
            ),
          }))}
        />
      </div>
      {multiline ? (
        <textarea value={v[l]} onChange={(e) => onChange({ ...v, [l]: e.target.value })} rows={6} lang={l} className={`${fieldBox} min-h-36 resize-y py-3 leading-relaxed`} />
      ) : (
        <input value={v[l]} onChange={(e) => onChange({ ...v, [l]: e.target.value })} lang={l} className={`${fieldBox} h-12`} />
      )}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-[15px] text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-[#34c759]" : "bg-[rgb(120_120_128/0.16)]"}`}
      >
        <span className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)] transition-[left] duration-200 ${checked ? "left-[22px]" : "left-[2px]"}`} />
      </button>
    </div>
  );
}

// Inside a search field, on the right: how many are shown ("13 palestrantes"),
// or "3 de 13" while searching or filtering.
export function SearchCount({ shown, total, one, many, of, filtered }: { shown: number; total: number; one: string; many: string; of: string; filtered: boolean }) {
  return (
    <span aria-live="polite" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-[13px] text-muted">
      {filtered ? (
        <>
          <span className="font-semibold tabular-nums text-ink">{shown}</span> {of} <span className="tabular-nums">{total}</span>
        </>
      ) : (
        <>
          <span className="font-semibold tabular-nums text-ink">{total}</span> {total === 1 ? one : many}
        </>
      )}
    </span>
  );
}

// A page's title with the place and dates. Phones: the two side by side (the
// place and the dates on two short lines at the right), saving a line;
// wider screens: the line under the title.
export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  const [place, dates] = subtitle.split(" · ");
  return (
    <div className="flex items-center justify-between gap-4 sm:block">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] sm:text-[2.5rem]">{title}</h1>
      <p className="text-right text-[12px] leading-snug text-muted sm:mt-1 sm:text-left sm:text-[15px]">
        <span className="max-sm:block">{place}</span>
        {dates && (
          <>
            <span className="max-sm:hidden"> · </span>
            <span className="max-sm:block">{dates}</span>
          </>
        )}
      </p>
    </div>
  );
}
