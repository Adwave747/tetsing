import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import "@fontsource/inter/600.css";

export type Word = { w: string; s: number; e: number };
export type Seg = { s: number; e: number; mode: "split" | "full" };
export type Callout = { s: number; e: number; text: string; kind?: "good" | "bad" | "info" };
export type BreakdownProps = {
  id: string;
  brand: string;
  format: string;
  duration: number;
  score?: { at: number; value: string };
  layout: Seg[];
  cuts: number[];
  words: Word[];
  callouts: Callout[];
  camY?: number;
};

const ACCENT = "#FFD43B";
const font = "Montserrat, Inter, sans-serif";
const HALF = 960;

/** Group words into short punchy chunks (max 3 words / 16 chars, break on pauses and sentence ends). */
const chunk = (words: Word[], cuts: number[]) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const len = cur.map((x) => x.w).join(" ").length + w.w.length;
    const brk = cur.length >= 3 || len > 16 || (prev && w.s - prev.e > 0.35) || (prev && /[.?!,]$/.test(prev.w)) || (prev && cuts.some((c) => c > prev.s && c <= w.s + 0.01));
    if (cur.length && brk) { out.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) out.push(cur);
  return out;
};

const Captions: React.FC<{ t: number; words: Word[]; full: boolean; cuts: number[] }> = ({ t, words, full, cuts }) => {
  const { fps } = useVideoConfig();
  const groups = React.useMemo(() => chunk(words, cuts), [words, cuts]);
  const gi = groups.findIndex((g, i) => t >= g[0].s - 0.03 && t < Math.min(groups[i + 1]?.[0].s ?? Infinity, g[g.length - 1].e + 0.45));
  if (gi < 0) return null;
  const g = groups[gi];
  const pop = spring({ frame: Math.round((t - g[0].s) * fps), fps, config: { damping: 13, stiffness: 260, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: full ? 1250 : HALF - 70, height: 140, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ transform: `scale(${0.82 + 0.18 * pop})`, textAlign: "center", lineHeight: 1.05 }}>
        {g.map((w, i) => {
          const active = t >= w.s - 0.02 && t < (g[i + 1]?.s ?? w.e + 0.45);
          const clean = w.w.replace(/^[,.]+/, "");
          return (
            <span key={i} style={{
              display: "inline-block", margin: "0 20px", fontFamily: font, fontWeight: 900, fontSize: full ? 92 : 84,
              letterSpacing: -1,
              color: active ? ACCENT : "#fff",
              WebkitTextStroke: "14px #000", paintOrder: "stroke fill",
              textShadow: "0 8px 18px rgba(0,0,0,.55)",
              transform: `translateY(${active ? -4 : 0}px) scale(${active ? 1.08 : 1})`,
            } as React.CSSProperties}>{clean}</span>
          );
        })}
      </div>
    </div>
  );
};

const Header: React.FC<{ brand: string; format: string; t: number }> = ({ brand, format, t }) => {
  const { fps } = useVideoConfig();
  const k = spring({ frame: Math.round(t * fps), fps, config: { damping: 15 } });
  return (
    <div style={{ position: "absolute", top: 34, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${(1 - k) * -120}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(10,10,12,.78)", border: "2px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "12px 26px 12px 14px", boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
        <div style={{ background: ACCENT, color: "#111", fontFamily: font, fontWeight: 900, fontSize: 24, letterSpacing: 2, borderRadius: 999, padding: "7px 16px" }}>AD BREAKDOWN</div>
        <div style={{ color: "#fff", fontFamily: font, fontWeight: 800, fontSize: 30 }}>{brand}</div>
        <div style={{ color: "rgba(255,255,255,.6)", fontFamily: font, fontWeight: 700, fontSize: 26 }}>· {format}</div>
      </div>
    </div>
  );
};

const CalloutChip: React.FC<{ c: Callout; t: number; full: boolean }> = ({ c, t, full }) => {
  const { fps } = useVideoConfig();
  if (t < c.s || t > c.e) return null;
  const k = spring({ frame: Math.round((t - c.s) * fps), fps, config: { damping: 14, stiffness: 180 } });
  const out = interpolate(t, [c.e - 0.25, c.e], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const col = c.kind === "bad" ? "#FF5A5F" : c.kind === "good" ? "#3DDC84" : ACCENT;
  return (
    <div style={{ position: "absolute", top: full ? 260 : HALF + 590, right: 36, opacity: out, transform: `translateX(${(1 - k) * 520}px) rotate(${(1 - k) * 6}deg)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 22, padding: "16px 26px", boxShadow: "0 14px 34px rgba(0,0,0,.4)", borderLeft: `14px solid ${col}` }}>
        <div style={{ fontFamily: font, fontWeight: 900, fontSize: 38, color: "#111", textTransform: "uppercase", letterSpacing: -0.5, maxWidth: 620 }}>{c.text}</div>
      </div>
    </div>
  );
};

const Score: React.FC<{ t: number; at: number; value: string }> = ({ t, at, value }) => {
  const { fps } = useVideoConfig();
  if (t < at || t > at + 3.2) return null;
  const k = spring({ frame: Math.round((t - at) * fps), fps, config: { damping: 9, stiffness: 200 } });
  const o = interpolate(t, [at + 2.9, at + 3.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: HALF - 330, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ transform: `scale(${k}) rotate(-6deg)`, background: ACCENT, borderRadius: 36, padding: "18px 44px", border: "8px solid #111", boxShadow: "0 18px 40px rgba(0,0,0,.45)", textAlign: "center" }}>
        <div style={{ fontFamily: font, fontWeight: 800, fontSize: 30, color: "#111", letterSpacing: 3 }}>MY RATING</div>
        <div style={{ fontFamily: font, fontWeight: 900, fontSize: 120, color: "#111", lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );
};

const Cta: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const { fps } = useVideoConfig();
  if (t < s) return null;
  const k = spring({ frame: Math.round((t - s) * fps), fps, config: { damping: 12 } });
  const bob = Math.sin((t - s) * 5) * 8;
  return (
    <div style={{ position: "absolute", top: 1500, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${k}) translateY(${bob}px)` }}>
      <div style={{ background: ACCENT, color: "#111", fontFamily: font, fontWeight: 900, fontSize: 46, padding: "22px 46px", borderRadius: 999, boxShadow: "0 16px 40px rgba(0,0,0,.45)", border: "6px solid #111" }}>
        FREE AD AUDIT · LINK BELOW ↓
      </div>
    </div>
  );
};

export const AdBreakdown: React.FC<BreakdownProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const seg = p.layout.find((s) => t >= s.s && t < s.e) ?? p.layout[p.layout.length - 1];
  const full = seg.mode === "full";
  // alternate a subtle punch-in on every jump cut so cuts feel intentional
  const ci = p.cuts.filter((c) => c <= t).length;
  const zoom = full ? (ci % 2 ? 1.1 : 1.0) : (ci % 2 ? 1.12 : 1.0);
  const lastSplitEnd = Math.max(...p.layout.filter((s) => s.mode === "split").map((s) => s.e));
  const ctaStart = p.layout.find((s) => s.mode === "full" && s.s >= lastSplitEnd - 0.01)?.s;
  const progress = t / p.duration;
  return (
    <AbsoluteFill style={{ background: "#0b0b0d" }}>
      {/* bottom: Nick (or full screen for intro and outro) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: full ? 0 : HALF, height: full ? 1920 : HALF, overflow: "hidden" }}>
        <OffthreadVideo muted src={staticFile(`bd/${p.id}/cam.mp4`)} style={{ position: "absolute", width: 1080, height: 1920, left: 0, top: full ? 0 : -(p.camY ?? 560), transform: `scale(${zoom})`, transformOrigin: full ? "50% 40%" : "50% 42%" }} />
      </div>
      {/* top: the ad */}
      {!full && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: HALF, overflow: "hidden" }}>
          <OffthreadVideo muted src={staticFile(`bd/${p.id}/top.mp4`)} style={{ width: 1080, height: HALF }} />
        </div>
      )}
      {!full && <div style={{ position: "absolute", left: 0, right: 0, top: HALF - 2, height: 4, background: "rgba(0,0,0,.6)" }} />}
      {!full && <Header brand={p.brand} format={p.format} t={t - (p.layout.find((s) => s.mode === "split")?.s ?? 0)} />}
      {p.callouts.map((c, i) => <CalloutChip key={i} c={c} t={t} full={full} />)}
      {p.score && !full && <Score t={t} at={p.score.at} value={p.score.value} />}
      <Captions t={t} words={p.words} full={full} cuts={p.cuts} />
      {ctaStart !== undefined && <Cta t={t} s={ctaStart + 0.6} />}
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${progress * 100}%`, background: ACCENT }} />
      <Audio src={staticFile(`bd/${p.id}/audio.wav`)} />
    </AbsoluteFill>
  );
};
