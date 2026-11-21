import timings from "./timings.json";

export type Line = { key: string; text: string; start: number; end: number };
export const lines: Line[] = timings.lines;
export const TOTAL = timings.total;
export const L = Object.fromEntries(lines.map((l) => [l.key, l])) as Record<string, Line>;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const backOut = (x: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** pop-in scale for an element appearing at `at` */
export const pop = (t: number, at: number, d = 0.35) => backOut(prog(t, at, at + d));
/** 0..1 visibility window with short fades */
export const win = (t: number, a: number, b: number, fi = 0.25, fo = 0.25) => clamp(Math.min(prog(t, a, a + fi), 1 - prog(t, b - fo, b)));

/** deterministic PRNG */
export const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/** Section boundaries in seconds, derived from the narration. */
export const S = {
  hook: 0,
  news: L.news1.start - 0.2,
  recap: L.recap1.start - 0.3,
  whatsNew: L.new1.start - 0.3,
  split: L.new3.start,
  means: L.mean1.start - 0.3,
  worms: L.mean3.start - 0.2,
  rating: L.rate1.start - 0.3,
  adwave: L.ad1.start - 0.3,
  cta: L.cta1.start - 0.3,
  end: TOTAL,
};

export const C = {
  navy: "#06182a",
  aqua: "#2ee6d6",
  yellow: "#ffd23f",
  red: "#ff4d5e",
  amber: "#ffb020",
  green: "#3ddc84",
  white: "#ffffff",
  // four fish schools (ICPs)
  schools: ["#4da3ff", "#ffd23f", "#3ddc84", "#ff6fb5"],
  // four specialists
  specs: ["#ff8a3d", "#b07bff", "#2ee6d6", "#ff4d8d"],
};
