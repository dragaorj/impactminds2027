"use client";

import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { CONTACT_EMAIL } from "@/lib/site";

type Status = "idle" | "sending" | "sent" | "error";
type Field = "name" | "email" | "message";

const field =
  "w-full rounded-[1.25rem] bg-ink/5 px-4 py-3 text-base text-ink ring-1 ring-line outline-none transition-[box-shadow,background-color] placeholder:text-muted focus:bg-surface focus:ring-2 focus:ring-gold aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger";

// Web3Forms access key issued to the conference inbox. It is public by design
// (it only lets this form send to that inbox) and its free plan only accepts
// submissions from the browser, so the form posts there directly. It lives
// here in the code; NEXT_PUBLIC_WEB3FORMS_KEY, if set, takes over.
const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "825f5f09-ad19-48f6-b62d-26d6b5662127";
const SUBJECT = "Mensagem do site ImpactMindsConference";

const check = (name: Field, value: string) =>
  name === "email" ? /^\S+@\S+\.\S+$/.test(value.trim()) : value.trim().length > 0;

// Name, email and message, sent to the conference team: through Web3Forms when
// its key is set, otherwise /api/contact (Resend). Each field says what is
// missing right under it. If sending fails, the message stays in the form and
// the visitor can choose to send it from their own mail app (never opened
// for them) or write to the address shown.
export default function ContactForm({ t }: { t: Dict["contact"] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, boolean>>>({});
  const [mailto, setMailto] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const message: Record<Field, string> = { name: t.nameMissing, email: t.emailInvalid, message: t.messageMissing };

  // A field that was flagged clears as soon as it is right.
  const recheck = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    if (errors[name as Field] && check(name as Field, value)) setErrors((m) => ({ ...m, [name]: false }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    const data = Object.fromEntries(new FormData(el)) as Record<string, string>;
    const found = (["name", "email", "message"] as Field[]).filter((k) => !check(k, data[k] ?? ""));
    setErrors(Object.fromEntries(found.map((k) => [k, true])));
    if (found.length) {
      (el.elements.namedItem(found[0]) as HTMLElement | null)?.focus();
      setStatus("idle");
      return;
    }
    setStatus("sending");
    try {
      const res = WEB3FORMS_KEY
        ? await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              access_key: WEB3FORMS_KEY,
              subject: SUBJECT,
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
      el.reset();
      setStatus("sent");
    } catch {
      // The message stays in the fields; sending it by mail is the visitor's call.
      const body = `${data.message.trim()}\n\n${data.name.trim()} · ${data.email.trim()}`;
      setMailto(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`);
      setStatus("error");
    }
  };

  const input = (name: Field, extra: Record<string, unknown>, multiline = false) => {
    const props = {
      name,
      required: true,
      onInput: recheck,
      "aria-invalid": errors[name] || undefined,
      "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
      ...extra,
    };
    return (
      <>
        {multiline ? <textarea {...props} rows={4} className={`${field} resize-y`} /> : <input {...props} className={field} />}
        {errors[name] && (
          <span id={`contact-${name}-error`} className="flex items-center gap-1.5 text-sm text-danger">
            <WarningCircle size="1rem" weight="fill" aria-hidden className="shrink-0" />
            {message[name]}
          </span>
        )}
      </>
    );
  };

  return (
    <form ref={form} onSubmit={submit} noValidate className="grid gap-3" data-nosplit>
      <p className="text-sm font-medium text-ink">{t.title}</p>
      {/* One column, in the order people think: who, how to answer, what. */}
      <label className="grid gap-1.5 text-sm text-ink-2">
        {t.name}
        {input("name", { autoComplete: "name" })}
      </label>
      <label className="grid gap-1.5 text-sm text-ink-2">
        {t.email}
        {input("email", { type: "email", autoComplete: "email", inputMode: "email" })}
      </label>
      <label className="grid gap-1.5 text-sm text-ink-2">
        {t.message}
        {input("message", {}, true)}
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
              <CheckCircle size="1.125rem" weight="fill" className="text-brand" />
              {t.sent}
            </span>
          )}
        </p>
      </div>
      {status === "error" && (
        <div role="alert" className="grid gap-3 rounded-[1.25rem] bg-danger/[0.06] p-4 text-sm text-ink ring-1 ring-danger/25">
          <p className="flex items-start gap-2">
            <WarningCircle size="1.125rem" weight="fill" aria-hidden className="mt-px shrink-0 text-danger" />
            {t.error}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <a
              href={mailto}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-medium btn-outline"
            >
              {t.mailApp}
              <ArrowUpRight size="0.9375rem" aria-hidden />
            </a>
            <span className="text-ink-2">
              {t.orWrite}{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-ink underline decoration-gold/70 underline-offset-[3px]">
                {CONTACT_EMAIL}
              </a>
            </span>
          </p>
        </div>
      )}
    </form>
  );
}
