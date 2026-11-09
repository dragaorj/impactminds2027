"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { CONTACT_EMAIL } from "@/lib/site";

type Status = "idle" | "sending" | "sent" | "error" | "invalid";

const field =
  "w-full rounded-[1.25rem] bg-ink/5 px-4 py-3 text-base text-ink ring-1 ring-line outline-none transition-[box-shadow,background-color] placeholder:text-muted focus:bg-surface focus:ring-2 focus:ring-sun/60";

// Web3Forms access key issued to the conference inbox. It is public by design
// (it only lets this form send to that inbox) and its free plan only accepts
// submissions from the browser, so the form posts there directly. It lives
// here in the code; NEXT_PUBLIC_WEB3FORMS_KEY, if set, takes over.
const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "825f5f09-ad19-48f6-b62d-26d6b5662127";

// Name, email and message, sent to the conference team: through Web3Forms when
// its key is set, otherwise /api/contact (Resend). If neither can send, the
// visitor's mail app opens with the message ready, and the address is shown,
// so nothing is lost.
export default function ContactForm({ t }: { t: Dict["contact"] }) {
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (!data.name?.trim() || !/^\S+@\S+\.\S+$/.test(data.email ?? "") || !data.message?.trim()) {
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    const subject = `Contato pelo site · ${data.name.trim()}`;
    try {
      const res = WEB3FORMS_KEY
        ? await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              access_key: WEB3FORMS_KEY,
              subject,
              from_name: "Site Impact Minds",
              name: data.name,
              email: data.email,
              replyto: data.email,
              message: data.message,
              botcheck: data.company ? true : "",
            }),
          })
        : await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.success === false) throw new Error(String(res.status));
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
      // Hand the message to the visitor's mail app, ready to send.
      const body = `${data.message.trim()}

${data.name.trim()} · ${data.email.trim()}`;
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-3" data-nosplit>
      <p className="text-sm font-medium text-ink">{t.title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-ink-2">
          {t.name}
          <input name="name" autoComplete="name" required className={field} />
        </label>
        <label className="grid gap-1.5 text-sm text-ink-2">
          {t.email}
          <input name="email" type="email" autoComplete="email" required className={field} />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm text-ink-2">
        {t.message}
        <textarea name="message" rows={4} required className={`${field} resize-y`} />
      </label>
      {/* Honeypot: hidden from people, filled in by bots (the API drops those). */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex h-12 items-center gap-3 rounded-full pl-6 pr-1.5 text-[0.9375rem] font-medium btn-solid transition-transform duration-500 ease-[var(--ease-spring)] active:scale-[0.98] disabled:opacity-70"
        >
          {status === "sending" ? t.sending : t.send}
          <span className="grid size-9 place-items-center rounded-full bg-brand-ink/15 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-x-0.5">
            <ArrowRight size="1rem" />
          </span>
        </button>
        <p role="status" aria-live="polite" className="text-sm leading-snug">
          {status === "sent" && (
            <span className="inline-flex items-center gap-2 text-ink">
              <CheckCircle size="1.125rem" weight="fill" className="text-gold" />
              {t.sent}
            </span>
          )}
          {status === "invalid" && <span className="text-ink-2">{t.invalid}</span>}
          {status === "error" && (
            <span className="text-ink-2">
              {t.error}{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-ink underline decoration-gold/70 underline-offset-[3px]">
                {CONTACT_EMAIL}
              </a>
              .
            </span>
          )}
        </p>
      </div>
    </form>
  );
}
