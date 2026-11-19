import type { Locale } from "@/lib/i18n";
import { faqCopy, faqPath } from "@/lib/faq";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Button, container, section } from "../ui";

// Near the end of the home page: an invitation to the FAQ page, with a few of
// its questions as a preview.
export default function FaqTeaser({ lang }: { lang: Locale }) {
  const f = faqCopy[lang];
  // Each preview opens its own question on the FAQ page (#q-n).
  const preview = [1, 5, 7].filter((i) => f.items[i]).map((i) => ({ ...f.items[i], i }));
  return (
    <section id="faq" className={`${section} scroll-mt-20`} aria-labelledby="faq-title">
      <div className={`${container} grid gap-10 xl:grid-cols-12 xl:items-center xl:gap-12`}>
        <div className="xl:col-span-5" data-reveal>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold md:text-sm">{f.title}</p>
          <h2 id="faq-title" className="mt-5 font-display text-[clamp(2.25rem,4.4vw,3.5rem)] leading-[1.02] text-balance text-ink">
            {f.homeTitle}
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-2">{f.homeText}</p>
          <div className="mt-9">
            <Button href={faqPath(lang)}>{f.homeCta}</Button>
          </div>
        </div>
        <ul className="grid gap-3 xl:col-span-7" data-reveal>
          {preview.map((it) => (
            <li key={it.q}>
              <a
                href={`${faqPath(lang)}#q-${it.i}`}
                className="group flex items-center justify-between gap-6 rounded-[1.5rem] bg-surface/70 px-6 py-5 ring-1 ring-line transition-[transform,box-shadow,background-color] duration-500 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:bg-surface hover:ring-sun/50 md:px-7 md:py-6"
              >
                <span className="font-display text-[clamp(1.125rem,1.7vw,1.5rem)] leading-snug text-ink transition-colors group-hover:text-brand">{it.q}</span>
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full text-ink ring-1 ring-line transition-colors group-hover:bg-sun group-hover:text-sun-ink group-hover:ring-sun">
                  <ArrowRight size="1rem" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
