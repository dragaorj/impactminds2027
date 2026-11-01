// A soft confetti burst on a canvas: two cannons in the bottom corners fire
// inwards and up, then the pieces drift down, flutter and fade. Gold, lilac
// and cream like the site; a few hundred pieces, one rAF loop, gone after
// about five seconds. Returns a stop function.

const COLORS = ["#D9B865", "#E8D193", "#F3E3B0", "#B79BE8", "#8C5CD6", "#FFFFFF"];
const PIECES = 220;
const LIFE_MS = 5200;
const FADE_MS = 1400;

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  wobble: number;
  wobbleSpeed: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
  delay: number;
};

export function burstConfetti(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // Speeds scale with the screen so the arc reaches about two thirds up.
  const power = Math.sqrt(H) * 0.95;
  const pieces: Piece[] = Array.from({ length: PIECES }, (_, i) => {
    const left = i % 2 === 0;
    const angle = ((left ? -62 : -118) + (Math.random() - 0.5) * 34) * (Math.PI / 180);
    const speed = power * (0.55 + Math.random() * 0.6);
    return {
      x: left ? -10 : W + 10,
      y: H * (0.78 + Math.random() * 0.12),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.08,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      round: Math.random() < 0.25,
      // Two waves, a beat apart, feel softer than one bang.
      delay: i < PIECES * 0.6 ? Math.random() * 120 : 380 + Math.random() * 200,
    };
  });

  const start = performance.now();
  let last = start;
  let frame = 0;
  const tick = (now: number) => {
    const dt = Math.min(2.5, (now - last) / 16.67);
    last = now;
    const age = now - start;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = age > LIFE_MS - FADE_MS ? Math.max(0, (LIFE_MS - age) / FADE_MS) : 1;
    for (const p of pieces) {
      if (age < p.delay) continue;
      p.vx *= Math.pow(0.986, dt);
      p.vy = p.vy * Math.pow(0.986, dt) + 0.16 * dt;
      // Light pieces never fall fast: they flutter.
      if (p.vy > 3.2) p.vy = 3.2;
      p.wobble += p.wobbleSpeed * dt;
      p.x += (p.vx + Math.sin(p.wobble) * 0.9) * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Flat ribbons turn in 3D: the height shrinks and grows with the wobble.
        ctx.fillRect(-p.w / 2, (-p.h / 2) * Math.cos(p.wobble), p.w, p.h * Math.cos(p.wobble));
      }
      ctx.restore();
    }
    if (age < LIFE_MS) frame = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    ctx.clearRect(0, 0, W, H);
  };
}
