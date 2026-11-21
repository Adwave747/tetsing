import timings from "./timings.json";

export type LineKey = "title" | "step1" | "step2" | "knock" | "step3" | "step4" | "result" | "end";
export const L = Object.fromEntries(timings.lines.map((l) => [l.key, l])) as Record<LineKey, { key: string; text: string; start: number; end: number }>;
export const lines = timings.lines;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** 0..1 progress of t between a and b */
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const backOut = (x: number) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
