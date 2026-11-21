import * as THREE from "three";

const cache = new Map<string, { tex: THREE.CanvasTexture; aspect: number }>();

/** Rounded pill label drawn on a canvas, used as a camera-facing sprite in 3D. */
export const labelTex = (text: string, bg: string, fg = "#06182a", outline = "rgba(0,0,0,0.35)") => {
  const key = `${text}|${bg}|${fg}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const font = "900 84px Inter, sans-serif";
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 90;
  const h = 140;
  c.width = w; c.height = h;
  ctx.font = font;
  const r = 44;
  ctx.fillStyle = outline;
  ctx.beginPath(); ctx.roundRect(0, 8, w, h - 8, r); ctx.fill();
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(0, 0, w, h - 14, r); ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, (h - 14) / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const out = { tex, aspect: w / h };
  cache.set(key, out);
  return out;
};

/** Vertical gradient for the sky dome. */
export const skyTex = () => {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#0b1d3a");
  g.addColorStop(0.45, "#3a3f78");
  g.addColorStop(0.62, "#c2618a");
  g.addColorStop(0.72, "#ffb36b");
  g.addColorStop(1, "#ffd9a0");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/** Soft round glow sprite. */
let glow: THREE.CanvasTexture | null = null;
export const glowTex = () => {
  if (glow) return glow;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  glow = new THREE.CanvasTexture(c);
  return glow;
};
