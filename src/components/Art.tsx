// Line drawings of Cartagena (balconies, doors, the Clock Tower, San Pedro
// Claver, palms, bougainvillea). Every stroke carries pathLength=1 so ScrollFx
// can draw it in with a single dashoffset tween as the section scrolls by.

type ArtName =
  | "balcony"
  | "door"
  | "tower"
  | "palm"
  | "bougainvillea"
  | "window"
  | "church"
  | "sun"
  | "birds"
  | "skyline"
  | "laurel"
  | "arcs";

const f1 = (n: number) => n.toFixed(1);

function waves(y: number, from: number, to: number, w = 30) {
  let d = `M${from} ${y}`;
  for (let x = from; x < to; x += w) d += ` q${w / 4} -5 ${w / 2} 0 t${w / 2} 0`;
  return d;
}

// Leaves set alternately along a cubic stem, like the laurels on the 2027 banner.
function laurel() {
  const s = [10, 112], c1 = [60, 100], c2 = [104, 66], e = [150, 12];
  const at = (t: number, i: number) =>
    (1 - t) ** 3 * s[i] + 3 * (1 - t) ** 2 * t * c1[i] + 3 * (1 - t) * t ** 2 * c2[i] + t ** 3 * e[i];
  const paths = [`M${s[0]} ${s[1]} C${c1.join(" ")} ${c2.join(" ")} ${e.join(" ")}`];
  for (let k = 1; k <= 9; k++) {
    const t = k / 10;
    const p = [at(t, 0), at(t, 1)];
    const q = [at(t + 0.02, 0), at(t + 0.02, 1)];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const dir = [(q[0] - p[0]) / len, (q[1] - p[1]) / len];
    const side = k % 2 ? 1 : -1;
    const n = [-dir[1] * side, dir[0] * side];
    const size = 30 - k * 1.2;
    const tip = [p[0] + (n[0] * 0.8 + dir[0] * 0.6) * size, p[1] + (n[1] * 0.8 + dir[1] * 0.6) * size];
    const mid = [(p[0] + tip[0]) / 2, (p[1] + tip[1]) / 2];
    const off = [-(tip[1] - p[1]) * 0.28, (tip[0] - p[0]) * 0.28];
    paths.push(
      `M${f1(p[0])} ${f1(p[1])} Q${f1(mid[0] + off[0])} ${f1(mid[1] + off[1])} ${f1(tip[0])} ${f1(tip[1])} Q${f1(mid[0] - off[0])} ${f1(mid[1] - off[1])} ${f1(p[0])} ${f1(p[1])}`,
    );
  }
  paths.push("M150 12 q-10 2 -14 12 q10 -2 14 -12");
  return paths;
}


function flower(x: number, y: number, r: number, turn = 0) {
  return [0, 120, 240]
    .map((deg) => {
      const a = ((deg + turn) * Math.PI) / 180;
      const tip = [x + r * Math.cos(a), y + r * Math.sin(a)];
      const c1 = [x + r * 0.9 * Math.cos(a - 0.55), y + r * 0.9 * Math.sin(a - 0.55)];
      const c2 = [x + r * 0.9 * Math.cos(a + 0.55), y + r * 0.9 * Math.sin(a + 0.55)];
      const f = (n: number) => n.toFixed(1);
      return `M${f(x)} ${f(y)} Q${f(c1[0])} ${f(c1[1])} ${f(tip[0])} ${f(tip[1])} Q${f(c2[0])} ${f(c2[1])} ${f(x)} ${f(y)}`;
    })
    .join(" ");
}

const range = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

// A path can carry its own loop class (waves, boats, birds...); plain strings
// move with the whole drawing's idle loop instead.
type Stroke = string | { d: string; c: string; delay?: number };

const drawings: Record<ArtName, { box: string; paths: Stroke[]; loop?: string }> = {
  balcony: {
    box: "0 0 240 260",
    paths: [
      "M20 40 L36 18 H204 L220 40 Z",
      ...range(52, 188, 17).map((x) => `M${x} 18 V40`),
      "M8 40 H232",
      "M24 40 V256 M216 40 V256",
      "M82 166 V96 Q120 60 158 96 V166",
      "M120 78 V166",
      "M10 62 H230 M18 62 V120 M222 62 V120",
      "M14 120 H226",
      ...range(26, 214, 12).map((x) => `M${x} 120 V170`),
      "M14 170 H226 M14 178 H226",
      ...[44, 92, 148, 196].map((x) => `M${x} 178 C${x} 196 ${x - 14} 198 ${x - 14} 214`),
      flower(34, 116, 9, 10),
      flower(50, 112, 7, 70),
      flower(204, 116, 9, 40),
    ],
  },
  door: {
    box: "0 0 200 300",
    paths: [
      "M20 296 V120 Q20 28 100 28 Q180 28 180 120 V296",
      "M40 296 V124 Q40 52 100 52 Q160 52 160 124 V296",
      "M92 28 L96 14 H104 L108 28",
      "M100 52 V296",
      "M52 140 H90 V220 H52 Z",
      "M110 140 H148 V220 H110 Z",
      "M52 236 H90 V284 H52 Z",
      "M110 236 H148 V284 H110 Z",
      "M81 186 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0",
      "M105 186 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0",
      "M4 296 H196",
    ],
  },
  tower: {
    box: "0 0 220 320",
    paths: [
      "M10 316 V190 H210 V316",
      "M30 316 V250 Q30 222 52 222 Q74 222 74 250 V316",
      "M88 316 V250 Q88 222 110 222 Q132 222 132 250 V316",
      "M146 316 V250 Q146 222 168 222 Q190 222 190 250 V316",
      "M4 190 H216 M4 182 H216",
      "M60 182 V96 H160 V182",
      "M86 136 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0",
      "M110 136 V120 M110 136 L122 142",
      "M52 96 H168 M56 88 H164",
      "M76 88 V48 H144 V88",
      "M96 88 V68 Q110 54 124 68 V88",
      "M70 48 H150",
      "M84 48 Q84 16 110 12 Q136 16 136 48",
      "M110 12 V2",
    ],
  },
  palm: {
    box: "0 0 220 320",
    paths: [
      "M118 316 C114 240 104 170 112 98",
      "M134 316 C130 240 120 170 124 98",
      ...[280, 244, 208, 172, 136].map((y, i) => `M${116 - i * 2} ${y} q9 5 17 0`),
      "M118 96 C82 70 42 76 10 104",
      "M118 96 C92 52 52 36 22 42",
      "M118 96 C122 52 140 24 168 14",
      "M118 96 C152 70 192 76 214 104",
      "M118 96 C152 94 178 120 188 150",
      "M118 96 C86 96 58 120 48 152",
      "M60 78 l-6 14 M44 84 l-8 12 M80 62 l-4 -14 M60 50 l-2 -14 M150 78 l6 14 M170 84 l8 12 M138 44 l12 -6 M150 28 l12 -4",
    ],
  },
  bougainvillea: {
    box: "0 0 260 200",
    paths: [
      "M4 30 C60 40 110 20 150 60 C180 90 220 100 256 90",
      "M110 34 C120 70 100 110 120 150",
      "M190 84 C196 110 220 120 230 150",
      flower(40, 34, 12, 0),
      flower(70, 30, 10, 50),
      flower(118, 70, 12, 20),
      flower(108, 104, 10, 80),
      flower(122, 146, 11, 30),
      flower(160, 72, 12, 60),
      flower(210, 96, 10, 10),
      flower(228, 146, 12, 90),
      "M88 30 q10 -20 26 -14 q-6 18 -26 14",
      "M168 82 q18 -6 24 10 q-18 6 -24 -10",
    ],
  },
  window: {
    box: "0 0 180 260",
    paths: [
      "M20 30 L30 12 H150 L160 30 Z",
      "M8 30 H172",
      "M24 30 V230 H156 V30",
      "M24 62 Q90 36 156 62",
      ...range(40, 140, 16).map((x) => `M${x} 56 V230`),
      "M24 122 H156 M24 176 H156",
      "M14 230 H166",
      "M30 230 q0 20 20 24 H130 q20 -4 20 -24",
    ],
  },
  church: {
    box: "0 0 300 240",
    paths: [
      "M60 236 V120 H240 V236",
      "M54 120 H246",
      "M100 120 Q100 40 150 34 Q200 40 200 120",
      "M150 34 V120 M126 40 Q118 80 120 120 M174 40 Q182 80 180 120",
      "M140 34 V18 H160 V34 M150 18 V4 M144 9 H156",
      "M20 236 V92 H60 V236 M240 236 V92 H280 V236",
      "M16 92 H64 M26 92 Q40 58 54 92 M40 72 V60",
      "M236 92 H284 M246 92 Q260 58 274 92 M260 72 V60",
      "M30 140 V120 Q40 108 50 120 V140 M250 140 V120 Q260 108 270 120 V140",
      "M130 236 V192 Q150 168 170 192 V236",
      "M138 160 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0",
      "M4 236 H296",
    ],
  },
  sun: {
    box: "0 0 160 160",
    paths: [
      "M40 80 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0",
      ...range(0, 330, 30).map((deg) => {
        const a = (deg * Math.PI) / 180;
        const f = (n: number) => n.toFixed(1);
        return `M${f(80 + 52 * Math.cos(a))} ${f(80 + 52 * Math.sin(a))} L${f(80 + 70 * Math.cos(a))} ${f(80 + 70 * Math.sin(a))}`;
      }),
    ],
  },
  // The walled city seen from the bay, as in the centre of the 2027 banner.
  skyline: {
    box: "0 0 600 212",
    loop: "",
    paths: [
      {
        d: "M22 150 C20 126 24 106 22 88 M22 88 C12 80 5 82 2 90 M22 88 C16 74 8 70 2 70 M22 88 C26 74 34 70 42 72 M22 88 C32 82 40 86 44 94 M22 88 C22 76 24 68 27 62",
        c: "loop-sway",
      },
      "M40 150 V112 H80 V150 M46 112 Q60 90 74 112 M60 96 V88",
      "M92 150 V72 H112 V150 M89 72 H115 M95 72 Q102 54 109 72 M102 58 V46 M98 104 V94 Q102 88 106 94 V104",
      "M112 150 V104 H250 V150 M110 104 L130 96 H232 L252 104",
      ...range(118, 232, 20).map((x) => `M${x} 150 V136 Q${x + 7} 126 ${x + 14} 136 V150`),
      "M164 96 V86 H200 V96 M164 86 Q164 60 182 56 Q200 60 200 86 M182 56 V60 M178 56 V48 H186 V56 M182 48 V38 M178 42 H186",
      "M214 96 V56 H236 V96 M212 56 H238 M219 78 V68 Q225 60 231 68 V78 M214 56 L225 30 L236 56 M225 30 V22",
      "M256 150 V118 H370 V150 M252 118 H374 M252 124 H374",
      ...range(262, 356, 16).map((x) => `M${x} 140 V132 Q${x + 5} 125 ${x + 10} 132 V140`),
      "M380 150 V108 H450 V150 M392 108 Q392 78 415 74 Q438 78 438 108 M411 74 V64 H419 V74 M415 64 V54 M411 58 H419",
      "M462 150 V70 H492 V150 M458 70 H496 M466 70 L477 40 L488 70 M477 40 V30 M469 94 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M470 150 V134 Q477 126 484 134 V150",
      "M496 150 V124 H562 V150",
      ...range(498, 552, 14).map((x) => `M${x} 124 V117 H${x + 8} V124`),
      "M562 150 V104 H578 V150 M562 104 Q570 92 578 104",
      {
        d: "M590 150 C592 126 588 108 590 92 M590 92 C580 84 572 86 568 94 M590 92 C586 78 578 74 571 74 M590 92 C594 80 598 76 600 75",
        c: "loop-sway",
        delay: -2,
      },
      "M0 150 H600",
      { d: waves(166, 6, 250), c: "loop-wave" },
      { d: waves(166, 330, 590), c: "loop-wave", delay: -1.5 },
      { d: waves(184, 30, 210, 26), c: "loop-wave", delay: -0.7 },
      { d: waves(200, 480, 594, 26), c: "loop-wave", delay: -2.2 },
      { d: "M96 180 H138 L131 190 H103 Z M117 178 V154 L134 177 Z M114 176 L101 160 V176", c: "loop-bob" },
      {
        d: "M372 198 H474 L465 208 H382 Z M384 198 V188 H404 V198 M406 198 V188 H426 V198 M428 198 V182 H446 V198 M450 198 V178 H462 V198 M455 178 V170",
        c: "loop-bob",
        delay: -1.8,
      },
      { d: "M240 22 q6 -6 12 0 q6 -6 12 0", c: "loop-fly" },
      { d: "M290 38 q5 -5 10 0 q5 -5 10 0", c: "loop-fly", delay: -3 },
      { d: "M60 34 q5 -5 10 0 q5 -5 10 0", c: "loop-fly", delay: -5 },
      { d: "M514 42 q2 -10 13 -9 q5 -11 18 -5 q11 -2 12 9 z", c: "loop-drift" },
    ],
  },
  laurel: { box: "0 0 160 120", paths: laurel(), loop: "loop-sway-soft" },
  arcs: {
    box: "0 0 120 120",
    paths: [28, 44, 60, 76, 92, 108].map((r, i) => ({
      d: `M${120 - r} 120 A${r} ${r} 0 0 1 120 ${120 - r}`,
      c: "loop-pulse",
      delay: i * 0.35,
    })),
    loop: "",
  },
  birds: {
    box: "0 0 200 80",
    paths: [
      "M10 40 q12 -14 24 0 q12 -14 24 0",
      "M80 20 q9 -10 18 0 q9 -10 18 0",
      "M140 52 q10 -12 20 0 q10 -12 20 0",
    ],
  },
};

// Every drawing idles in an endless loop (CSS, paused under reduced motion):
// by default the whole piece floats; marked strokes run their own loop.
export default function Art({ name, className = "" }: { name: ArtName; className?: string }) {
  const { box, paths, loop = "loop-float" } = drawings[name];
  return (
    <svg viewBox={box} className={`art ${className}`} aria-hidden focusable="false" data-art>
      <g className={loop}>
        {paths.map((p, i) =>
          typeof p === "string" ? (
            <path key={i} d={p} pathLength={1} />
          ) : (
            <path
              key={i}
              d={p.d}
              pathLength={1}
              className={p.c}
              style={p.delay ? { animationDelay: `${p.delay}s` } : undefined}
            />
          ),
        )}
      </g>
    </svg>
  );
}
