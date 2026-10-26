// Filled geometric tiles from the 2027 banner (half circles, quarter discs,
// leaves and paired "D" shapes) in purple, violet, lavender and gold.

const C = {
  purple: "var(--brand)",
  deep: "var(--block)",
  violet: "var(--terra)",
  lavender: "var(--lavender)",
  gold: "var(--sun)",
};

const sets = {
  // 2 columns x 3 rows of 40px cells
  stack: {
    box: "0 0 80 120",
    shapes: [
      { d: "M0 40 A20 20 0 0 1 40 40 Z", fill: C.purple },
      { d: "M80 0 V40 H40 A40 40 0 0 1 80 0 Z", fill: C.gold },
      { d: "M0 80 Q0 40 40 40 Q40 80 0 80 Z", fill: C.lavender },
      { d: "M44 60 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0", fill: C.violet },
      { d: "M0 80 H40 A40 40 0 0 1 0 120 Z", fill: C.gold },
      { d: "M40 80 A20 20 0 0 1 40 120 Z M80 80 A20 20 0 0 0 80 120 Z", fill: C.deep },
    ],
  },
  // 4 cells in a row
  strip: {
    box: "0 0 160 40",
    shapes: [
      { d: "M0 40 A20 20 0 0 1 40 40 Z", fill: C.lavender },
      { d: "M40 40 Q40 0 80 0 Q80 40 40 40 Z", fill: C.gold },
      { d: "M80 0 A20 20 0 0 1 80 40 Z", fill: C.violet },
      { d: "M120 0 A20 20 0 0 0 120 40 Z", fill: C.purple },
      { d: "M120 0 H160 V40 A40 40 0 0 1 120 0 Z", fill: C.deep },
    ],
  },
} as const;

// Each tile idles on its own loop (turn, breathe, mirror), offset in time.
const loops = ["geo-turn", "geo-breathe", "geo-mirror"];

export default function Geo({ set, className = "" }: { set: keyof typeof sets; className?: string }) {
  const { box, shapes } = sets[set];
  return (
    <svg viewBox={box} className={`pointer-events-none ${className}`} aria-hidden focusable="false" data-reveal>
      {shapes.map((s, i) => (
        <path
          key={s.d}
          d={s.d}
          fill={s.fill}
          className={loops[i % loops.length]}
          style={{ animationDelay: `${i * -1.3}s` }}
        />
      ))}
    </svg>
  );
}
