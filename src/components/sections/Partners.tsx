import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import { sponsorTiers, type Logo, type TierKey } from "@/lib/sponsors";
import { H2, container, section } from "../ui";

// Visual weight per tier: each logo gets the same area (in rem², from its own
// aspect ratio), so wide and compact marks read equally strong. Higher tiers
// are larger; --k shrinks everything a step on phones.
const AREA: Record<TierKey, number> = {
  pioneers: 34,
  visionaries: 24,
  sponsor: 20,
  catalysts: 20,
  boosting: 11,
  media: 8.5,
  partners: 10,
};
// Long, very wide wordmarks would turn into thin lines: cap their width.
const MAX_W: Record<TierKey, number> = { pioneers: 16, visionaries: 12, sponsor: 10, catalysts: 12, boosting: 9, media: 9, partners: 8 };

function Mark({ logo, tier }: { logo: Logo; tier: TierKey }) {
  const ratio = logo.w / logo.h;
  const width = Math.min(MAX_W[tier], Math.sqrt(AREA[tier] * ratio));
  return (
    <li className="flex items-center justify-center">
      <Image
        src={`/sponsors/${logo.slug}.webp`}
        alt={logo.name}
        width={logo.w}
        height={logo.h}
        sizes="16rem"
        style={{ width: `calc(var(--k) * ${width.toFixed(2)}rem)` }}
        className="h-auto mix-blend-multiply transition-transform duration-500 ease-[var(--ease-spring)] hover:scale-105"
      />
    </li>
  );
}

// One tier: its name centred over a fine rule, the logos centred under it.
function Group({ label, tier, className = "" }: { label: string; tier: TierKey; className?: string }) {
  const logos = sponsorTiers.find((t) => t.key === tier)?.logos ?? [];
  return (
    <div className={className}>
      <p className="border-b border-[#3D1B5A]/20 pb-3 text-center text-sm font-semibold text-[#3D1B5A] md:text-base">{label}</p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-[calc(var(--k)*2.5rem)] gap-y-6 md:mt-8">
        {logos.map((logo) => (
          <Mark key={logo.slug} logo={logo} tier={tier} />
        ))}
      </ul>
    </div>
  );
}

// Who joined the 2026 edition, laid out like the official sponsor board: the
// organiser on top, then each tier under its own heading. The board is a
// light lilac panel in both themes, so every brand shows in its own colours.
export default function Partners({ t }: { t: Dict["partners"] }) {
  return (
    <section id="parceiros" className={section} aria-labelledby="parceiros-title">
      <div className={container}>
        <H2 id="parceiros-title" className="max-w-[18ch]" data-reveal>
          {t.title}
        </H2>

        <div
          data-reveal
          data-nosplit
          className="mt-12 rounded-[2rem] bg-[#F1EBFA] p-1.5 ring-1 ring-[#3D1B5A]/10 [--k:0.78] sm:[--k:0.9] md:mt-16 lg:[--k:1]"
        >
          <div className="rounded-[calc(2rem-6px)] px-5 py-10 shadow-[inset_0_1px_1px_rgb(255_255_255/0.7)] sm:px-8 md:px-12 md:py-14">
            <div className="mx-auto max-w-md">
              <p className="border-b border-[#3D1B5A]/20 pb-3 text-center text-sm font-semibold text-[#3D1B5A] md:text-base">{t.tiers.organizer}</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- the brand SVG */}
              <img src="/brand/latimpacto.svg" alt="Latimpacto" width={619} height={143} className="mx-auto mt-6 h-auto w-[min(16rem,60vw)] md:mt-8" />
            </div>

            <div className="mt-12 grid gap-12 md:mt-14 lg:grid-cols-3 lg:gap-x-12">
              <Group label={t.tiers.pioneers} tier="pioneers" />
              <Group label={t.tiers.visionaries} tier="visionaries" className="lg:col-span-2" />
              <Group label={t.tiers.sponsor} tier="sponsor" />
              <Group label={t.tiers.catalysts} tier="catalysts" className="lg:col-span-2" />
              <Group label={t.tiers.boosting} tier="boosting" className="lg:col-span-3" />
            </div>
            <div className="mt-12 grid gap-12 md:mt-14 lg:grid-cols-2 lg:gap-x-12">
              <Group label={t.tiers.media} tier="media" />
              <Group label={t.tiers.partners} tier="partners" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
