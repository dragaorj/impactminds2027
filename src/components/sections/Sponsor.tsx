import type { Dict } from "@/lib/dictionaries/pt";
import { links, participantsByYear } from "@/lib/site";
import Art from "../Art";
import { Bezel, Button, H2, container, section } from "../ui";

// Bar chart drawn as a street of Cartagena houses: each facade's height is the
// edition's attendance (one shared baseline and scale), the wall colors are the
// city's, and every value is labeled. A thin growth line links the rooftops.
const W = 560;
const BASE = 330;
const MAX_H = 230;
const SLOT = W / 4;
const FW = 96;

const walls = [
  { wall: "#C9A24D", shutter: "#3E1A5E", bloom: "#8E63C6" },
  { wall: "#C9B5E6", shutter: "#5B2A86", bloom: "" },
  { wall: "#8E63C6", shutter: "#F1E3BC", bloom: "#C9B5E6" },
  { wall: "#5B2A86", shutter: "#E2C985", bloom: "" },
];

function Facade({ x, h, wall, shutter, bloom }: { x: number; h: number; wall: string; shutter: string; bloom: string }) {
  const top = BASE - h;
  const rows: number[] = [];
  for (let y = top + 24; y + 34 <= BASE - 50; y += 54) rows.push(y);
  const win = (wx: number, wy: number) => `M${wx} ${wy + 34} V${wy + 11} A11 11 0 0 1 ${wx + 22} ${wy + 11} V${wy + 34} Z`;
  const tiles = Array.from({ length: Math.floor((FW + 12) / 8) }, (_, i) => x - 6 + i * 8);

  return (
    <>
      <rect x={x} y={top} width={FW} height={h} fill={wall} />
      <rect x={x} y={top} width={FW} height={h} fill="url(#wall-shade)" />
      <rect x={x - 6} y={top - 12} width={FW + 12} height={12} rx={2} fill="#3E1A5E" />
      {tiles.map((tx) => (
        <path key={tx} d={`M${tx} ${top - 12} q4 6 8 0`} fill="none" stroke="#7A4FA8" strokeWidth={1.2} />
      ))}
      <rect x={x - 3} y={top} width={FW + 6} height={4} fill="#fff" opacity={0.45} />

      {rows.map((ry, r) => (
        <g key={ry}>
          <path d={win(x + 16, ry)} fill={shutter} opacity={0.9} />
          <path d={win(x + 58, ry)} fill={shutter} opacity={0.9} />
          <path d={`M${x + 27} ${ry + 6} V${ry + 34} M${x + 69} ${ry + 6} V${ry + 34}`} stroke={wall} strokeWidth={1.2} opacity={0.7} />
          {r === 0 && (
            <g stroke={shutter} strokeWidth={1.4} opacity={0.85}>
              <path d={`M${x + 6} ${ry + 22} H${x + FW - 6} M${x + 4} ${ry + 36} H${x + FW - 4}`} />
              {Array.from({ length: 12 }, (_, b) => (
                <path key={b} d={`M${x + 10 + b * 7} ${ry + 22} V${ry + 36}`} />
              ))}
            </g>
          )}
        </g>
      ))}

      <path
        d={`M${x + 35} ${BASE} V${BASE - 26} A13 13 0 0 1 ${x + 61} ${BASE - 26} V${BASE} Z`}
        fill="#2A1240"
      />
      <path d={`M${x + 48} ${BASE - 39} V${BASE}`} stroke={wall} strokeWidth={1} opacity={0.5} />

      {bloom &&
        [
          [x + 4, top + 10, 6],
          [x + 12, top + 6, 5],
          [x + 2, top + 22, 5],
          [x + 14, top + 18, 4],
          [x + 22, top + 9, 3.5],
        ].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={bloom} opacity={0.95} />)}
    </>
  );
}

function GrowthChart({ t, locale }: { t: Dict["sponsor"]; locale: string }) {
  const max = Math.max(...participantsByYear.map((d) => d.value));
  const points = participantsByYear.map((d, i) => {
    const h = (d.value / max) * MAX_H;
    return { ...d, h, x: i * SLOT + (SLOT - FW) / 2, cx: i * SLOT + SLOT / 2, top: BASE - h };
  });
  const line = points
    .map((p, i) => {
      const y = p.top - 58;
      if (i === 0) return `M${p.cx} ${y}`;
      const prev = points[i - 1];
      const py = prev.top - 58;
      const dx = (p.cx - prev.cx) / 2;
      return `C${prev.cx + dx} ${py} ${p.cx - dx} ${y} ${p.cx} ${y}`;
    })
    .join(" ");

  return (
    <figure className="flex h-full flex-col p-6 md:p-9">
      <figcaption className="text-[0.9375rem] font-medium text-ink">{t.chartTitle}</figcaption>
      <svg viewBox={`0 0 ${W} ${BASE + 44}`} className="mt-6 w-full overflow-visible" aria-hidden data-bars>
        <defs>
          <linearGradient id="wall-shade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="0.82" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        {/* Growth line: the dashes march continuously and a light travels rooftop to rooftop. */}
        <path d={line} fill="none" stroke="var(--ink-2)" strokeWidth={1.5} strokeDasharray="2 6" strokeLinecap="round" className="chart-march" />
        <circle r={7} fill="var(--sun)" className="chart-runner" style={{ offsetPath: `path("${line}")` }} />
        <circle r={14} fill="var(--sun)" opacity={0.25} className="chart-runner" style={{ offsetPath: `path("${line}")` }} />

        {points.map((p, i) => (
          <g key={p.year} className="transition-opacity duration-300 hover:opacity-90">
            <title>{`${p.year}: ${p.value.toLocaleString(locale)} ${t.chartUnit}`}</title>
            <g data-bar>
              <Facade x={p.x} h={p.h} {...walls[i]} />
            </g>
            <circle cx={p.cx} cy={p.top - 58} r={5} fill="var(--surface)" stroke="var(--brand)" strokeWidth={2} />
            <text
              x={p.cx}
              y={p.top - 24}
              textAnchor="middle"
              fill="var(--ink)"
              style={{ fontFamily: "var(--font-display)", fontSize: 26 }}
            >
              <tspan data-count={p.value} data-locale={locale}>
                {p.value.toLocaleString(locale)}
              </tspan>
            </text>
            <text x={p.cx} y={BASE + 34} textAnchor="middle" fill="var(--muted)" style={{ fontSize: 19 }}>
              {p.year}
            </text>
          </g>
        ))}

        <path d={`M0 ${BASE} H${W}`} stroke="var(--line)" strokeWidth={2} />
        <path d={`M4 ${BASE + 8} H${W - 4}`} stroke="var(--line)" strokeWidth={3} strokeDasharray="10 7" strokeLinecap="round" />
      </svg>
      <table className="sr-only">
        <caption>{t.chartTitle}</caption>
        <thead>
          <tr>
            <th scope="col">{t.tableYear}</th>
            <th scope="col">{t.chartUnit}</th>
          </tr>
        </thead>
        <tbody>
          {participantsByYear.map((d) => (
            <tr key={d.year}>
              <th scope="row">{d.year}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default function Sponsor({ t, locale }: { t: Dict["sponsor"]; locale: string }) {
  return (
    <section id="patrocinio" className={section} aria-labelledby="patrocinio-title">
      <Art name="arcs" className="absolute bottom-0 left-0 hidden w-48 -scale-x-100 xl:block" />
      <div className={`${container} grid gap-12 xl:grid-cols-12 xl:items-center xl:gap-12`}>
        <Bezel className="xl:col-span-7" inner="bg-surface">
          <div data-reveal className="h-full">
            <GrowthChart t={t} locale={locale} />
          </div>
        </Bezel>
        <div className="xl:col-span-5" data-reveal>
          <p className="text-lg text-ink-2">{t.kicker}</p>
          <H2 id="patrocinio-title" className="mt-4 !text-[clamp(2.1rem,4.4vw,3.5rem)]">
            {t.title}
          </H2>
          <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-ink-2">{t.text}</p>
          <div className="mt-10">
            {links.sponsor2027 ? (
              <Button href={links.sponsor2027} external>
                {t.cta}
              </Button>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex h-12 items-center gap-3 rounded-full bg-brand pl-6 pr-1.5 text-[0.9375rem] font-medium text-brand-ink opacity-90"
              >
                {t.cta}
                <span className="rounded-full bg-brand-ink/15 px-3 py-1.5 text-xs">{t.soon}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
