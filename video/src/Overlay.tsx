import React from "react";
import { AbsoluteFill } from "remotion";
import { L, backOut, clamp, easeOut, lines, prog } from "./timeline";

const font = "Inter, sans-serif";
const outline = "0 0 2px #000, 0 6px 0 rgba(0,0,0,.55), 0 0 30px rgba(0,0,0,.6)";

const pop = (t: number, at: number, d = 0.35) => backOut(prog(t, at, at + d));
const fade = (t: number, a: number, b: number) => clamp(Math.min(prog(t, a, a + 0.2), 1 - prog(t, b - 0.15, b)));

const Step = ({ t, n, title, sub, from, to, subAt }: { t: number; n: string; title: string; sub?: string; from: number; to: number; subAt?: number }) => {
  if (t < from || t > to) return null;
  const s = pop(t, from), o = fade(t, from, to);
  const ss = subAt ? pop(t, subAt) : 0;
  return (
    <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", opacity: o }}>
      <div style={{ display: "inline-block", transform: `scale(${s}) rotate(-3deg)`, background: "#f7d046", color: "#1a0f0a", fontFamily: font, fontWeight: 900, fontSize: 54, padding: "10px 34px", borderRadius: 18, letterSpacing: 3, boxShadow: "0 8px 0 #9a7413" }}>
        STEP {n}
      </div>
      <div style={{ marginTop: 30, transform: `scale(${s})`, color: "#fff", fontFamily: font, fontWeight: 900, fontSize: 104, lineHeight: 1.0, textShadow: outline, padding: "0 60px" }}>{title}</div>
      {sub && (
        <div style={{ marginTop: 26, transform: `scale(${ss}) rotate(2deg)`, display: "inline-block", background: "#7a0a1e", color: "#ffe9ef", fontFamily: font, fontWeight: 800, fontSize: 50, padding: "12px 30px", borderRadius: 14 }}>{sub}</div>
      )}
    </div>
  );
};

/** Karaoke captions: words timed proportionally to their length inside each spoken line. */
const Captions = ({ t }: { t: number }) => {
  const line = lines.find((l) => l.key !== "end" && t >= l.start - 0.05 && t <= l.end + 0.15);
  if (!line) return null;
  const words = line.text.split(" ");
  const weights = words.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const timed = words.map((w, i) => { const s = line.start + ((line.end - line.start) * acc) / total; acc += weights[i]; return { w, s, e: line.start + ((line.end - line.start) * acc) / total }; });
  const cur = Math.max(0, timed.findIndex((x) => t < x.e));
  const chunk = Math.floor((cur === -1 ? timed.length - 1 : cur) / 4);
  const shown = timed.slice(chunk * 4, chunk * 4 + 4);
  const soldier = line.key === "knock";
  return (
    <div style={{ position: "absolute", bottom: 250, left: 50, right: 50, textAlign: "center", fontFamily: font, fontWeight: 900, fontSize: 76, lineHeight: 1.15, textTransform: "uppercase" }}>
      {soldier && <div style={{ fontSize: 34, color: "#c9d1b0", letterSpacing: 4, marginBottom: 8 }}>SOLDIER</div>}
      {shown.map((x, i) => {
        const active = t >= x.s && t < x.e + 0.05;
        const k = easeOut(prog(t, x.s, x.s + 0.12));
        return (
          <span key={i} style={{ display: "inline-block", margin: "0 20px", color: active ? (soldier ? "#a9c46a" : "#f7d046") : "#fff", transform: `scale(${active ? 1 + 0.07 * k : 1}) translateY(${(1 - k) * 18}px)`, opacity: t >= x.s - 0.02 ? 1 : 0.35, textShadow: outline, WebkitTextStroke: "3px #000", paintOrder: "stroke fill" } as React.CSSProperties}>{x.w}</span>
        );
      })}
    </div>
  );
};

export const Overlay = ({ t }: { t: number }) => {
  const titleO = fade(t, 0.1, L.title.end + 0.15);
  const knockA = pop(t, 10.25, 0.25), knockB = pop(t, 10.5, 0.25);
  const knockO = fade(t, 10.2, L.knock.end + 0.1);
  const nonS = pop(t, L.step3.start + 1.9, 0.3), xS = pop(t, L.step3.start + 2.3, 0.25);
  const laterS = pop(t, L.step4.start + 0.9, 0.4);
  const checks = ["Soldiers: gone", "You: alive", "Aroma: oak, cherry, victory"];
  const vive = pop(t, L.end.start, 0.5);
  return (
    <AbsoluteFill>
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.65) 100%)" }} />

      {t < L.title.end + 0.2 && (
        <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center", opacity: titleO, fontFamily: font }}>
          <div style={{ transform: `scale(${pop(t, 0.15)})`, display: "inline-block", border: "4px solid #f7d046", color: "#f7d046", fontWeight: 800, fontSize: 40, letterSpacing: 6, padding: "8px 26px", borderRadius: 40 }}>A QUICK GUIDE</div>
          <div style={{ transform: `scale(${pop(t, 0.35, 0.45)})`, marginTop: 30, color: "#fff", fontWeight: 900, fontSize: 128, lineHeight: 0.95, textShadow: outline, padding: "0 50px" }}>HOW TO HIDE IN A WINE BARREL</div>
          <div style={{ transform: `scale(${pop(t, 1.4, 0.35)}) rotate(-4deg)`, marginTop: 34, display: "inline-block", background: "#c8102e", color: "#fff", fontWeight: 900, fontSize: 62, padding: "10px 32px", borderRadius: 12 }}>(from the Nazis)</div>
        </div>
      )}

      <Step t={t} n="1" title="Empty the barrel." sub="Drinking it: allowed" subAt={L.step1.start + 1.9} from={L.step1.start} to={L.step1.end + 0.15} />
      <Step t={t} n="2" title="Climb in." sub="Become the wine" subAt={L.step2.start + 1.1} from={L.step2.start} to={L.step2.end - 0.25} />

      {t > 10.2 && t < L.knock.end + 0.1 && (
        <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", opacity: knockO, fontFamily: font, fontWeight: 900, fontSize: 150, color: "#fff", textShadow: outline }}>
          <div style={{ transform: `scale(${knockA}) rotate(-8deg)` }}>KNOCK</div>
          <div style={{ transform: `scale(${knockB}) rotate(6deg)`, color: "#f7d046" }}>KNOCK</div>
        </div>
      )}

      <Step t={t} n="3" title="Do not answer." from={L.step3.start} to={L.step3.end + 0.15} />
      {t > L.step3.start + 1.8 && t < L.step3.end + 0.15 && (
        <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", opacity: fade(t, L.step3.start + 1.8, L.step3.end + 0.15) }}>
          <div style={{ position: "relative", display: "inline-block", transform: `scale(${nonS})`, background: "#fff", color: "#111", fontFamily: font, fontWeight: 900, fontSize: 96, padding: "18px 56px", borderRadius: 60 }}>
            “Non.”
            <div style={{ position: "absolute", inset: -30, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${xS})`, color: "#e01b38", fontSize: 260, fontWeight: 900, lineHeight: 1, textShadow: "0 0 0 #000" }}>✕</div>
          </div>
        </div>
      )}

      <Step t={t} n="4" title="Wait." sub="Nobody checks the Merlot" subAt={L.step4.start + 1.5} from={L.step4.start} to={L.step4.end + 0.15} />
      {t > L.step4.start + 0.9 && t < L.step4.end + 0.15 && (
        <div style={{ position: "absolute", top: 1180, left: 0, right: 0, textAlign: "center", opacity: fade(t, L.step4.start + 0.9, L.step4.end + 0.15) }}>
          <div style={{ display: "inline-block", transform: `scale(${laterS}) rotate(-2deg)`, background: "#1a0f0a", border: "5px solid #f7d046", color: "#f7d046", fontFamily: font, fontWeight: 900, fontSize: 56, padding: "10px 30px", letterSpacing: 2 }}>3 HOURS LATER…</div>
        </div>
      )}

      {t > L.result.start && t < L.result.end + 0.15 && (
        <div style={{ position: "absolute", top: 190, left: 90, right: 90, opacity: fade(t, L.result.start, L.result.end + 0.15), fontFamily: font }}>
          <div style={{ color: "#f7d046", fontWeight: 900, fontSize: 60, letterSpacing: 4, textShadow: outline, transform: `scale(${pop(t, L.result.start)})`, transformOrigin: "left" }}>RESULTS</div>
          {checks.map((c, i) => {
            const s = pop(t, L.result.start + 0.5 + i * 1.15);
            return (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 26, transform: `translateX(${(1 - Math.min(1, s)) * -80}px)`, opacity: Math.min(1, s * 1.5) }}>
                <div style={{ width: 78, height: 78, borderRadius: 16, background: "#2f9e44", color: "#fff", fontSize: 60, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${s})` }}>✓</div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 58, textShadow: outline }}>{c}</div>
              </div>
            );
          })}
        </div>
      )}

      {t > L.end.start && (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 200 }}>
          <div style={{ display: "flex", width: 900, height: 22, transform: `scaleX(${easeOut(prog(t, L.end.start, L.end.start + 0.5))})`, borderRadius: 11, overflow: "hidden" }}>
            <div style={{ flex: 1, background: "#0055a4" }} /><div style={{ flex: 1, background: "#fff" }} /><div style={{ flex: 1, background: "#ef4135" }} />
          </div>
          <div style={{ marginTop: 34, transform: `scale(${vive}) rotate(-3deg)`, color: "#fff", fontFamily: font, fontWeight: 900, fontSize: 132, lineHeight: 0.95, textAlign: "center", textShadow: outline }}>
            VIVE LA<br /><span style={{ color: "#f7d046" }}>RÉSISTANCE</span>
          </div>
        </AbsoluteFill>
      )}

      <Captions t={t} />
    </AbsoluteFill>
  );
};
