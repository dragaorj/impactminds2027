"use client";

import { useState } from "react";
import { ArrowRight, EnvelopeSimple } from "@phosphor-icons/react";

const TO = "conferencia@latimpacto.org";
const CC = ["julia.rocha@yelloweventos.com.br", "fyw.ggwp@gmail.com"];

type Labels = {
  formTitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  interest: string;
  invalid: string;
  opened: string;
  subject: string;
  message: string;
  contact: string;
};

// "I'm interested in sponsoring": the visitor leaves an email and the button
// opens their own mail app with the note ready to send (mailto): to the
// conference team, copying the producers, in the page's language, with the
// email they typed in the body. A frosted pill like the hero's info bar: the
// field and the gold-on-hover button share one rounded line.
export default function SponsorForm({ labels }: { labels: Labels }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "opened">("idle");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      setStatus("invalid");
      return;
    }
    const params = [
      `cc=${CC.map(encodeURIComponent).join(",")}`,
      `subject=${encodeURIComponent(labels.subject)}`,
      `body=${encodeURIComponent(`${labels.message}\n\n${labels.contact}: ${email.trim()}`)}`,
    ].join("&");
    window.location.href = `mailto:${TO}?${params}`;
    setStatus("opened");
  };

  const message = status === "invalid" ? labels.invalid : status === "opened" ? labels.opened : null;

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-sm font-medium text-ink">{labels.formTitle}</p>
      <div className="mt-3 flex items-center gap-2 rounded-full bg-surface/70 p-1.5 ring-1 ring-line backdrop-blur-xl transition-shadow focus-within:ring-2 focus-within:ring-sun/60">
        <EnvelopeSimple size="1.25rem" aria-hidden className="ml-3 shrink-0 text-muted" />
        <label htmlFor="sponsor-email" className="sr-only">
          {labels.emailLabel}
        </label>
        <input
          id="sponsor-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "invalid") setStatus("idle");
          }}
          placeholder={labels.emailPlaceholder}
          aria-invalid={status === "invalid" || undefined}
          aria-describedby={message ? "sponsor-email-msg" : undefined}
          className="field-bare h-11 min-w-0 flex-1 rounded-full bg-transparent px-2 text-[0.9375rem] text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="group flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand pl-5 pr-2 text-[0.9375rem] font-medium text-brand-ink transition-colors duration-300 hover:bg-sun hover:text-sun-ink"
        >
          {labels.interest}
          <span className="grid size-7 place-items-center rounded-full bg-brand-ink/15 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-x-0.5">
            <ArrowRight size="0.875rem" />
          </span>
        </button>
      </div>
      {message && (
        <p id="sponsor-email-msg" role={status === "invalid" ? "alert" : "status"} className="mt-2 pl-4 text-sm text-gold">
          {message}
          {status === "opened" && (
            <>
              {" "}
              <a href={`mailto:${TO}`} className="font-medium underline underline-offset-2">
                {TO}
              </a>
            </>
          )}
        </p>
      )}
    </form>
  );
}
