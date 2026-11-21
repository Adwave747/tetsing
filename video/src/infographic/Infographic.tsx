import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, L, TOTAL, clamp, easeInOut, easeOut, lines, mix, pop, prog, rng, win } from "./tl";

const font = "Inter, sans-serif";
const W = 1080;
const shadow = "0 0 2px #000, 0 5px 0 rgba(0,0,0,.45), 0 0 26px rgba(0,0,0,.55)";
const panel: React.CSSProperties = { background: "rgba(13,38,62,0.85)", border: "3px solid rgba(255,255,255,0.10)", borderRadius: 30, boxShadow: "0 20px 50px rgba(0,0,0,0.35)" };

const Chip = ({ text, bg, fg = C.navy, size = 36, style }: { text: string; bg: string; fg?: string; size?: number; style?: React.CSSProperties }) => (
  <span style={{ display: "inline-block", background: bg, color: fg, fontFamily: font, fontWeight: 900, fontSize: size, letterSpacing: 1.5, padding: `${size * 0.28}px ${size * 0.65}px`, borderRadius: size, whiteSpace: "nowrap", ...style }}>{text}</span>
);
const Txt = ({ s = 40, w = 800, c = "#fff", style, children }: { s?: number; w?: number; c?: string; style?: React.CSSProperties; children: React.ReactNode }) => (
  <div style={{ fontFamily: font, fontSize: s, fontWeight: w, color: c, lineHeight: 1.15, ...style }}>{children}</div>
);
const Abs = ({ x = 0, y, w = W, h, style, children }: { x?: number; y: number; w?: number; h?: number; style?: React.CSSProperties; children?: React.ReactNode }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, ...style }}>{children}</div>
);
/** element appears at `at` with a slide-up and fade */
const rise = (t: number, at: number, d = 0.45): React.CSSProperties => {
  const k = easeOut(prog(t, at, at + d));
  return { opacity: k, transform: `translateY(${(1 - k) * 40}px)` };
};
const wordAt = (key: string, word: string) => {
  const l = L[key];
  const words = l.text.split(" ");
  const w = words.map((x) => x.length + 2);
  const tot = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < words.length; i++) {
    if (words[i].toLowerCase().replace(/[^a-z0-9.%]/g, "").startsWith(word.toLowerCase())) return l.start + ((l.end - l.start) * acc) / tot;
    acc += w[i];
  }
  return l.start;
};

// ------------------------------------------------------------------ sections
const SEC = [
  { key: "hook", from: 0, to: L.w1.start - 0.3, n: "", title: "" },
  { key: "funnel", from: L.w1.start - 0.3, to: L.u1.start - 0.3, n: "01", title: "WHERE ANDROMEDA SITS" },
  { key: "update", from: L.u1.start - 0.3, to: L.c1.start - 0.3, n: "02", title: "THE UPDATE" },
  { key: "arch", from: L.c1.start - 0.3, to: L.r1.start - 0.3, n: "03", title: "WHAT CHANGED" },
  { key: "result", from: L.r1.start - 0.3, to: L.m1.start - 0.3, n: "04", title: "THE RESULT" },
  { key: "creative", from: L.m1.start - 0.3, to: L.d1.start - 0.3, n: "05", title: "WHAT IT MEANS FOR CREATIVE" },
  { key: "rating", from: L.d1.start - 0.3, to: L.a1.start - 0.3, n: "06", title: "THE NEW RATING" },
  { key: "adwave", from: L.a1.start - 0.3, to: L.e1.start + 0.1, n: "07", title: "HOW ADWAVE BUILDS FOR IT" },
  { key: "end", from: L.e1.start - 0.1, to: TOTAL + 1, n: "", title: "" },
];
const sec = (k: string) => SEC.find((s) => s.key === k)!;

const Scene = ({ t, k, children }: { t: number; k: string; children: React.ReactNode }) => {
  const s = sec(k);
  const o = win(t, s.from, s.to, 0.35, 0.3);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${(1 - easeOut(prog(t, s.from, s.from + 0.5))) * 30}px)` }}>{children}</AbsoluteFill>;
};

const Background = ({ t }: { t: number }) => (
  <AbsoluteFill style={{ background: C.navy }}>
    <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.035) 2px, transparent 2px)", backgroundSize: "60px 60px", backgroundPosition: `0 ${(t * 12) % 60}px` }} />
    <div style={{ position: "absolute", left: 540 + 380 * Math.sin(t * 0.21) - 600, top: 300 + 200 * Math.cos(t * 0.17) - 600, width: 1200, height: 1200, borderRadius: 600, background: "radial-gradient(circle, rgba(46,230,214,0.13), rgba(46,230,214,0) 65%)" }} />
    <div style={{ position: "absolute", left: 540 + 380 * Math.cos(t * 0.15) - 600, top: 1300 + 200 * Math.sin(t * 0.19) - 600, width: 1200, height: 1200, borderRadius: 600, background: "radial-gradient(circle, rgba(77,163,255,0.12), rgba(77,163,255,0) 65%)" }} />
  </AbsoluteFill>
);

const Header = ({ t }: { t: number }) => {
  const s = SEC.find((x) => t >= x.from && t < x.to);
  const numbered = SEC.filter((x) => x.n);
  const show = win(t, sec("funnel").from, sec("end").from + 0.2, 0.3, 0.3);
  if (!s || show <= 0) return null;
  const k = easeOut(prog(t, s.from, s.from + 0.4));
  return (
    <Abs y={90} style={{ opacity: show }}>
      <div style={{ display: "flex", gap: 8, padding: "0 60px" }}>
        {numbered.map((x) => {
          const p = prog(t, x.from, x.to);
          return (
            <div key={x.key} style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
              <div style={{ width: `${p * 100}%`, height: "100%", background: C.aqua }} />
            </div>
          );
        })}
      </div>
      {s.n && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 22, padding: "30px 60px 0", opacity: k, transform: `translateX(${(1 - k) * -30}px)` }}>
          <Txt s={64} w={900} c={C.aqua}>{s.n}</Txt>
          <Txt s={46} w={900} style={{ letterSpacing: 3 }}>{s.title}</Txt>
        </div>
      )}
    </Abs>
  );
};

// ------------------------------------------------------------------ 00 hook
const Hook = ({ t }: { t: number }) => {
  const dots = React.useMemo(() => { const r = rng(3); return Array.from({ length: 140 }, () => [r(), r(), r()]); }, []);
  const conv = easeInOut(prog(t, 0.2, 1.6));
  const reveal = easeOut(prog(t, 1.0, 1.9));
  return (
    <Scene t={t} k="hook">
      {dots.map(([a, b, c], i) => {
        const x0 = a * W, y0 = b * 1920;
        const ang = (i / dots.length) * Math.PI * 2;
        const x1 = 540 + Math.cos(ang) * (300 + c * 140), y1 = 820 + Math.sin(ang) * (300 + c * 140) * 0.55;
        return <div key={i} style={{ position: "absolute", left: mix(x0, x1, conv), top: mix(y0, y1, conv), width: 10, height: 10, borderRadius: 5, background: [C.aqua, C.schools[0], C.yellow][i % 3], opacity: 0.25 + 0.5 * conv * (0.5 + 0.5 * Math.sin(t * 3 + i)) }} />;
      })}
      <Abs y={620} style={{ textAlign: "center" }}>
        <div style={{ display: "inline-block", ...rise(t, 0.3) }}><Chip text="META UPDATE · OCT 2026" bg={C.yellow} size={36} /></div>
        <div style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`, marginTop: 30 }}>
          <Txt s={118} w={900} style={{ letterSpacing: 4, background: `linear-gradient(90deg, ${C.aqua}, #8fd6ff, ${C.yellow})`, WebkitBackgroundClip: "text", color: "transparent" }}>ANDROMEDA</Txt>
          <Txt s={230} w={900} style={{ lineHeight: 1, textShadow: `0 0 50px ${C.aqua}` }}>2.0</Txt>
        </div>
        <div style={{ marginTop: 40, display: "inline-block", transform: `scale(${pop(t, L.h2.start)})` }}><Chip text="HERE'S WHAT CHANGED" bg="#ffffff" size={42} /></div>
      </Abs>
    </Scene>
  );
};

// ------------------------------------------------------------------ 01 funnel
const Stage = ({ y, w, n, title, sub, color, t, at, glow = 0 }: { y: number; w: number; n: string; title: string; sub: string; color: string; t: number; at: number; glow?: number }) => (
  <Abs x={(W - w) / 2} y={y} w={w} style={{ ...rise(t, at) }}>
    <div style={{ ...panel, padding: "22px 30px", display: "flex", alignItems: "center", gap: 24, border: `4px solid ${color}`, boxShadow: `0 0 ${40 * glow}px ${color}` }}>
      <div style={{ width: 64, height: 64, borderRadius: 32, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontWeight: 900, fontSize: 34, color: C.navy, flexShrink: 0 }}>{n}</div>
      <div>
        <Txt s={44} w={900}>{title}</Txt>
        <Txt s={28} w={600} c="#a9bccb">{sub}</Txt>
      </div>
    </div>
  </Abs>
);

const DotGrid = ({ cols, rows, size, gap, t, at, seed, dim = 0 }: { cols: number; rows: number; size: number; gap: number; t: number; at: number; seed: number; dim?: number }) => {
  const r = rng(seed);
  const pal = [C.aqua, C.schools[0], C.yellow, C.schools[3], C.green, "#ffffff"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap, justifyContent: "center" }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const d = r() * 0.8;
        const c = pal[Math.floor(r() * pal.length)];
        const k = easeOut(prog(t, at + d, at + d + 0.3));
        return <div key={i} style={{ width: size, height: size, borderRadius: 3, background: c, opacity: k * (0.75 - dim * 0.5), transform: `scale(${k})` }} />;
      })}
    </div>
  );
};

const Funnel = ({ t }: { t: number }) => {
  const filt = prog(t, L.w3.start - 0.2, L.w4.start + 0.4);
  const parts = React.useMemo(() => { const r = rng(17); return Array.from({ length: 60 }, () => [r(), r(), r()]); }, []);
  const final = pop(t, L.w4.end - 0.6, 0.45);
  return (
    <Scene t={t} k="funnel">
      <Abs x={90} y={290} w={900} style={{ ...rise(t, L.w1.start) }}>
        <div style={{ ...panel, padding: "22px 20px 26px" }}>
          <Txt s={34} w={900} c={C.yellow} style={{ textAlign: "center", letterSpacing: 2, marginBottom: 16 }}>TENS OF MILLIONS OF ADS</Txt>
          <DotGrid cols={34} rows={7} size={16} gap={6} t={t} at={L.w1.start + 0.2} seed={4} dim={filt} />
        </div>
      </Abs>
      {/* particles filtering through Andromeda */}
      {parts.map(([a, b, c], i) => {
        const p = (t - L.w3.start + 0.2 + a * 1.6) % 1.6 / 1.6;
        if (t < L.w3.start - 0.2 || t > L.w4.end + 0.6) return null;
        const keep = c < 0.15;
        const y = mix(560, keep ? 860 : 700, p);
        const x = 540 + (b - 0.5) * mix(800, keep ? 400 : 600, p);
        const o = keep ? Math.sin(Math.PI * p) : (1 - p) * 0.8;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 12, height: 12, borderRadius: 6, background: keep ? C.aqua : "#ffffff", opacity: o }} />;
      })}
      <Stage y={620} w={820} n="1" title="Andromeda" sub="Retrieval: picks the candidates" color={C.aqua} t={t} at={L.w2.start} glow={win(t, L.w2.start, L.w3.end, 0.3, 0.5)} />
      <Abs x={240} y={810} w={600} style={{ ...rise(t, L.w3.start) }}>
        <div style={{ ...panel, padding: "16px 20px 20px" }}>
          <Txt s={30} w={900} c={C.aqua} style={{ textAlign: "center", letterSpacing: 2, marginBottom: 10 }}>A FEW THOUSAND</Txt>
          <DotGrid cols={20} rows={2} size={14} gap={6} t={t} at={L.w3.start + 0.3} seed={8} />
        </div>
      </Abs>
      <Stage y={990} w={640} n="2" title="Ranking" sub="Scores each candidate" color={C.schools[0]} t={t} at={wordAt("w4", "ranking")} />
      <Stage y={1150} w={560} n="3" title="Auction" sub="Picks the winner" color={C.amber} t={t} at={wordAt("w4", "auction")} />
      <Abs x={340} y={1320} w={400} style={{ textAlign: "center", transform: `scale(${final})`, opacity: clamp(final) }}>
        <div style={{ ...panel, padding: "20px 0", border: `4px solid ${C.green}`, boxShadow: `0 0 40px ${C.green}` }}>
          <Txt s={50} w={900} c={C.green}>1 AD SHOWN</Txt>
        </div>
      </Abs>
      {/* connectors */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={W} height={1920}>
        {[[790, 810], [970, 990], [1130, 1150], [1290, 1320]].map(([a, b], i) => (
          <line key={i} x1={540} y1={a} x2={540} y2={b} stroke="rgba(255,255,255,0.35)" strokeWidth={4} strokeDasharray="8 8" />
        ))}
      </svg>
    </Scene>
  );
};

// ------------------------------------------------------------------ 02 the update
const StatTile = ({ y, t, at, value, label, color }: { y: number; t: number; at: number; value: string; label: string; color: string }) => (
  <Abs x={80} y={y} w={920} style={{ ...rise(t, at) }}>
    <div style={{ ...panel, padding: "34px 44px", borderLeft: `14px solid ${color}` }}>
      <Txt s={150} w={900} c={color} style={{ fontVariantNumeric: "tabular-nums", letterSpacing: -3, lineHeight: 1 }}>{value}</Txt>
      <Txt s={44} w={800} style={{ marginTop: 12 }}>{label}</Txt>
    </div>
  </Abs>
);

const Update = ({ t }: { t: number }) => {
  const line = easeInOut(prog(t, L.u1.start + 0.3, L.u1.start + 1.6));
  const n1 = easeOut(prog(t, L.u2.start, L.u2.start + 1.5));
  const n2 = easeOut(prog(t, L.u3.start, L.u3.start + 1.5));
  const x1 = 200, x2 = 880;
  return (
    <Scene t={t} k="update">
      <Abs y={310} h={300} style={{ ...rise(t, L.u1.start - 0.2) }}>
        <svg width={W} height={300} style={{ position: "absolute" }}>
          <line x1={x1} y1={150} x2={x2} y2={150} stroke="rgba(255,255,255,0.15)" strokeWidth={8} strokeLinecap="round" />
          <line x1={x1} y1={150} x2={mix(x1, x2, line)} y2={150} stroke={C.aqua} strokeWidth={8} strokeLinecap="round" />
          <circle cx={x1} cy={150} r={22} fill="#8a9aa8" />
          <circle cx={x2} cy={150} r={22 + 6 * pop(t, L.u1.start + 1.6)} fill={line >= 1 ? C.aqua : "rgba(255,255,255,0.2)"} />
          {line >= 1 && <circle cx={x2} cy={150} r={40 + 10 * Math.sin(t * 5)} fill="none" stroke={C.aqua} strokeWidth={3} opacity={0.6} />}
        </svg>
        <Abs x={x1 - 160} y={20} w={320} style={{ textAlign: "center" }}><Txt s={40} w={900} c="#a9bccb">DEC 2024</Txt></Abs>
        <Abs x={x1 - 160} y={200} w={320} style={{ textAlign: "center" }}><Txt s={30} w={700} c="#a9bccb">Andromeda launches</Txt></Abs>
        <Abs x={x2 - 200} y={20} w={400} style={{ textAlign: "center", opacity: clamp(line * 2 - 1) }}><Txt s={40} w={900} c={C.aqua}>OCT 28, 2026</Txt></Abs>
        <Abs x={x2 - 200} y={200} w={400} style={{ textAlign: "center", opacity: clamp(line * 2 - 1) }}><Txt s={30} w={800}>Next generation</Txt></Abs>
      </Abs>
      <StatTile y={680} t={t} at={L.u2.start - 0.1} value={`${Math.round(1000 * n1).toLocaleString("en-US")}M+`.replace("1,000M+", "1B+")} label="ads checked per second" color={C.yellow} />
      <StatTile y={1010} t={t} at={L.u3.start - 0.1} value={`${Math.round(300 * n2)}×`} label="less compute per prediction than the 2024 version" color={C.green} />
      <Abs y={1365} style={{ textAlign: "center", ...rise(t, L.u3.start + 0.6) }}><Txt s={28} w={600} c="#7f93a3">Source: Meta Engineering, Oct 28, 2026</Txt></Abs>
    </Scene>
  );
};

// ------------------------------------------------------------------ 03 architecture
const Icon = ({ i }: { i: number }) => {
  const st = { stroke: C.navy, strokeWidth: 6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={50} height={50} viewBox="0 0 50 50">
      {i === 0 && <polyline points="4,28 14,28 19,14 27,38 32,24 46,24" {...st} />}
      {i === 1 && (<><circle cx={15} cy={18} r={7} {...st} /><circle cx={35} cy={18} r={7} {...st} /><path d="M4 42c2-8 8-11 11-11s9 3 11 11M24 42c2-8 8-11 11-11s9 3 11 11" {...st} /></>)}
      {i === 2 && (<><rect x={6} y={8} width={38} height={30} rx={5} {...st} /><path d="M14 30l7-9 6 6 4-4 6 7" {...st} /></>)}
      {i === 3 && (<><rect x={4} y={10} width={20} height={30} rx={5} {...st} /><rect x={26} y={10} width={20} height={30} rx={5} {...st} /><path d="M18 25h14" {...st} /></>)}
    </svg>
  );
};
const SIGNALS = [
  { t: "Recent engagement", d: "What each person interacted with lately" },
  { t: "Groups they belong to", d: "People who behave alike" },
  { t: "What an ad means", d: "AI reads what the creative is about" },
  { t: "Facebook + Instagram", d: "Activity across both apps" },
];
const Arch = ({ t }: { t: number }) => {
  const before = rise(t, L.c2.start - 0.1);
  const dimBefore = 1 - 0.55 * easeOut(prog(t, L.c3.start, L.c3.start + 0.6));
  const now = L.c3.start;
  const nodeK = pop(t, L.s4.end - 0.2, 0.45);
  const boxY = (i: number) => 760 + i * 165;
  return (
    <Scene t={t} k="arch">
      <Abs y={300} style={{ textAlign: "center", ...rise(t, L.c1.start) }}><Txt s={56} w={900}>How it reads <span style={{ color: C.aqua }}>people</span></Txt></Abs>
      <Abs x={60} y={410} w={960} style={{ ...before, opacity: Number(before.opacity) * dimBefore }}>
        <div style={{ ...panel, padding: "22px 30px", display: "flex", alignItems: "center", gap: 26 }}>
          <Chip text="BEFORE" bg="#8a9aa8" size={30} />
          <div style={{ flex: 1, ...panel, background: "rgba(255,255,255,0.06)", padding: "16px 24px", borderRadius: 20 }}>
            <Txt s={40} w={900}>1 user model</Txt>
            <Txt s={28} w={600} c="#a9bccb">Same view of everyone</Txt>
          </div>
        </div>
      </Abs>
      <Abs x={60} y={650} w={960} style={{ ...rise(t, now) }}><Chip text="NOW · A TEAM OF SPECIALISTS" bg={C.aqua} size={34} /></Abs>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={W} height={1920}>
        {SIGNALS.map((_, i) => {
          const k = easeOut(prog(t, L[`s${i + 1}`].start + 0.2, L[`s${i + 1}`].start + 0.8));
          const y = boxY(i) + 70;
          const x1 = 690, x2 = 820, y2 = 1080;
          return <path key={i} d={`M${x1} ${y} C ${x1 + 80} ${y}, ${x2 - 60} ${y2}, ${x2} ${y2}`} stroke={C.specs[i]} strokeWidth={6} fill="none" strokeDasharray={400} strokeDashoffset={400 * (1 - k)} opacity={0.9} />;
        })}
      </svg>
      {SIGNALS.map((s, i) => {
        const ln = L[`s${i + 1}`];
        const ghost = rise(t, now + 0.2 + i * 0.08);
        const lit = easeOut(prog(t, ln.start - 0.1, ln.start + 0.3));
        const active = t >= ln.start - 0.1 && t < ln.end + 0.25;
        return (
          <Abs key={i} x={60} y={boxY(i)} w={630} style={{ ...ghost }}>
            <div style={{ ...panel, height: 140, boxSizing: "border-box", padding: "0 24px", display: "flex", alignItems: "center", gap: 22, border: `4px solid ${lit > 0 ? C.specs[i] : "rgba(255,255,255,0.1)"}`, opacity: 0.35 + 0.65 * lit, transform: `scale(${active ? 1.03 : 1})`, boxShadow: active ? `0 0 34px ${C.specs[i]}` : undefined }}>
              <div style={{ width: 82, height: 82, borderRadius: 41, background: lit > 0 ? C.specs[i] : "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon i={i} /></div>
              <div>
                <Txt s={40} w={900}>{s.t}</Txt>
                <Txt s={26} w={600} c="#a9bccb">{s.d}</Txt>
              </div>
            </div>
          </Abs>
        );
      })}
      <Abs x={790} y={1000} w={240} style={{ transform: `scale(${nodeK})`, opacity: clamp(nodeK), textAlign: "center" }}>
        <div style={{ width: 170, height: 170, margin: "0 auto", borderRadius: 85, background: C.green, boxShadow: `0 0 50px ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Txt s={36} w={900} c={C.navy} style={{ textAlign: "center" }}>BETTER<br />MATCH</Txt>
        </div>
      </Abs>
    </Scene>
  );
};

// ------------------------------------------------------------------ 04 result
const Result = ({ t }: { t: number }) => {
  const n = easeOut(prog(t, L.r1.start + 0.6, L.r1.start + 2.6));
  const ring = 2 * Math.PI * 230;
  return (
    <Scene t={t} k="result">
      <Abs y={330} style={{ display: "flex", justifyContent: "center", ...rise(t, L.r1.start - 0.1) }}>
        <div style={{ position: "relative", width: 560, height: 560 }}>
          <svg width={560} height={560} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
            <circle cx={280} cy={280} r={230} stroke="rgba(255,255,255,0.1)" strokeWidth={36} fill="none" />
            <circle cx={280} cy={280} r={230} stroke={C.green} strokeWidth={36} fill="none" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - 0.75 * n)} />
          </svg>
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <Txt s={130} w={900} c={C.green} style={{ fontVariantNumeric: "tabular-nums", letterSpacing: -3 }}>+{(2.4 * n).toFixed(1)}%</Txt>
          </AbsoluteFill>
        </div>
      </Abs>
      <Abs y={940} style={{ textAlign: "center", ...rise(t, L.r1.start + 1.0) }}>
        <Txt s={56} w={900}>Facebook conversions</Txt>
        <Txt s={42} w={700} c="#a9bccb" style={{ marginTop: 8 }}>since 2025</Txt>
      </Abs>
      <Abs x={140} y={1150} w={800} style={{ ...rise(t, L.r1.start + 2.4) }}>
        <div style={{ ...panel, padding: "22px 30px", textAlign: "center" }}>
          <Txt s={30} w={700} c="#a9bccb">Source: Meta. Meta has not published the baseline or method.</Txt>
        </div>
      </Abs>
    </Scene>
  );
};

// ------------------------------------------------------------------ 05 creative
const AdCard = ({ color, w = 150, variant = 0, headline = 0 }: { color: string; w?: number; variant?: number; headline?: number }) => {
  const h = w * 1.25;
  return (
    <div style={{ width: w, height: h, borderRadius: w * 0.1, background: "#f4f7fa", overflow: "hidden", boxShadow: "0 8px 20px rgba(0,0,0,0.35)", position: "relative" }}>
      <div style={{ height: h * 0.62, background: color, position: "relative" }}>
        {variant === 0 && <div style={{ position: "absolute", left: "30%", top: "22%", width: "40%", height: "56%", borderRadius: "50%", background: "rgba(255,255,255,0.75)" }} />}
        {variant === 1 && <div style={{ position: "absolute", left: "18%", top: "20%", width: "64%", height: "60%", background: "rgba(6,24,42,0.45)", transform: "rotate(12deg)" }} />}
        {variant === 2 && <div style={{ position: "absolute", left: "10%", bottom: 0, width: "35%", height: "75%", borderRadius: "40% 40% 0 0", background: "rgba(6,24,42,0.5)" }} />}
        {variant === 3 && <div style={{ position: "absolute", inset: "18%", border: `${w * 0.05}px solid rgba(255,255,255,0.85)`, borderRadius: 8 }} />}
      </div>
      <div style={{ margin: `${h * 0.06}px ${w * 0.1}px 0`, height: h * 0.07, width: `${55 + ((headline * 37) % 35)}%`, background: "#06182a", borderRadius: 4 }} />
      <div style={{ margin: `${h * 0.04}px ${w * 0.1}px 0`, height: h * 0.05, width: `${40 + ((headline * 53) % 40)}%`, background: "#9fb0bf", borderRadius: 4 }} />
    </div>
  );
};

const Creative = ({ t }: { t: number }) => {
  const top = win(t, L.m1.start - 0.3, L.m3.start + 0.3, 0.3, 0.4);
  const scan = prog(t, L.m2.start, L.m2.end);
  const tags = ["Visual", "Message", "Offer", "Who it's for"];
  const plotO = easeOut(prog(t, L.m3.start, L.m3.start + 0.5));
  const collapse = easeInOut(prog(t, L.m3.start + 1.4, L.m3.start + 2.4));
  const spread = easeInOut(prog(t, L.m3.start + 2.6, L.m3.start + 3.6));
  const rightIn = prog(t, L.m3.start + 2.2, L.m3.start + 2.6);
  return (
    <Scene t={t} k="creative">
      {top > 0 && (
        <AbsoluteFill style={{ opacity: top }}>
          <Abs y={310} style={{ textAlign: "center", transform: `scale(${pop(t, L.m1.start)})` }}><Chip text="THE CREATIVE IS THE TARGETING" bg={C.yellow} size={44} /></Abs>
          <Abs y={470} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
            <div style={{ ...rise(t, L.m1.start + 0.4), position: "relative" }}>
              <AdCard color={C.schools[0]} w={220} />
              {scan > 0 && scan < 1 && <div style={{ position: "absolute", left: -10, right: -10, top: `${scan * 100}%`, height: 6, background: C.aqua, boxShadow: `0 0 20px ${C.aqua}` }} />}
              <Txt s={30} w={800} c="#a9bccb" style={{ textAlign: "center", marginTop: 14 }}>Your ad</Txt>
            </div>
            <Txt s={70} w={900} c={C.aqua} style={{ ...rise(t, L.m1.start + 0.8) }}>›</Txt>
            <div style={{ ...rise(t, L.m1.start + 0.9), ...panel, padding: "26px 26px", border: `4px solid ${C.aqua}`, textAlign: "center" }}>
              <Txt s={34} w={900} c={C.aqua}>ANDROMEDA</Txt>
              <Txt s={26} w={700} c="#a9bccb">reads it</Txt>
            </div>
            <Txt s={70} w={900} c={C.aqua} style={{ ...rise(t, L.m1.start + 1.2) }}>›</Txt>
            <div style={{ ...rise(t, L.m1.start + 1.3), textAlign: "center" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 34px)", gap: 10 }}>
                {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ width: 34, height: 34, borderRadius: 17, background: i % 4 === 0 ? C.green : "rgba(255,255,255,0.25)" }} />)}
              </div>
              <Txt s={30} w={800} c="#a9bccb" style={{ marginTop: 14 }}>Who sees it</Txt>
            </div>
          </Abs>
          <Abs y={860} style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", padding: "0 60px" }}>
            {tags.map((g, i) => (
              <span key={g} style={{ display: "inline-block", transform: `scale(${pop(t, L.m2.start + 0.5 + i * 0.4)})` }}><Chip text={g.toUpperCase()} bg="rgba(46,230,214,0.18)" fg={C.aqua} size={34} style={{ border: `3px solid ${C.aqua}` }} /></span>
            ))}
          </Abs>
        </AbsoluteFill>
      )}
      {plotO > 0 && (
        <AbsoluteFill style={{ opacity: plotO }}>
          <Abs y={300} style={{ textAlign: "center" }}><Txt s={48} w={900}>How Andromeda groups your ads</Txt></Abs>
          {/* left: 10 look-alikes collapse into one */}
          <Abs x={50} y={400} w={470} h={1000}>
            <div style={{ ...panel, position: "absolute", inset: 0, border: `4px solid ${C.red}` }} />
            <Abs y={30} w={470} style={{ textAlign: "center" }}><Chip text="10 SIMILAR ADS" bg={C.red} fg="#fff" size={32} /></Abs>
            {Array.from({ length: 10 }, (_, i) => {
              const gx = 35 + (i % 3) * 140, gy = 130 + Math.floor(i / 3) * 190;
              const x = mix(gx + (i === 9 ? 140 : 0), 170, collapse), y = mix(gy, 380, collapse);
              const k = easeOut(prog(t, L.m3.start + i * 0.06, L.m3.start + 0.4 + i * 0.06));
              return <div key={i} style={{ position: "absolute", left: x, top: y, opacity: k * (i === 0 ? 1 : 1 - collapse * 0.9), transform: `scale(${0.8 * k})` }}><AdCard color={C.schools[0]} w={130} headline={i} /></div>;
            })}
            <Abs y={720} w={470} style={{ textAlign: "center", opacity: collapse }}>
              <div style={{ width: 70, height: 70, borderRadius: 35, background: C.red, margin: "0 auto", boxShadow: `0 0 30px ${C.red}` }} />
              <Txt s={54} w={900} c={C.red} style={{ marginTop: 16 }}>= 1 concept</Txt>
              <Txt s={28} w={700} c="#a9bccb" style={{ marginTop: 6 }}>Same visual, new headline</Txt>
            </Abs>
          </Abs>
          {/* right: 4 genuinely different ads stay apart */}
          <Abs x={560} y={400} w={470} h={1000} style={{ opacity: rightIn }}>
            <div style={{ ...panel, position: "absolute", inset: 0, border: `4px solid ${C.green}` }} />
            <Abs y={30} w={470} style={{ textAlign: "center" }}><Chip text="4 DIFFERENT ADS" bg={C.green} size={32} /></Abs>
            {[C.schools[0], C.yellow, C.schools[3], C.green].map((c, i) => {
              const gx = 70 + (i % 2) * 190, gy = 150 + Math.floor(i / 2) * 260;
              const sx = [40, 300, 40, 300][i], sy = [120, 160, 470, 430][i];
              return (
                <div key={i} style={{ position: "absolute", left: mix(gx, sx, spread), top: mix(gy, sy, spread), transform: `scale(${mix(0.95, 0.75, spread)})` }}>
                  <AdCard color={c} w={140} variant={i} headline={i + 3} />
                  <div style={{ width: 26, height: 26, borderRadius: 13, background: C.green, margin: "10px auto 0", opacity: spread, boxShadow: `0 0 16px ${C.green}` }} />
                </div>
              );
            })}
            <Abs y={720} w={470} style={{ textAlign: "center", opacity: spread }}>
              <Txt s={54} w={900} c={C.green} style={{ marginTop: 86 }}>= 4 concepts</Txt>
              <Txt s={28} w={700} c="#a9bccb" style={{ marginTop: 6 }}>Each reaches new people</Txt>
            </Abs>
          </Abs>
        </AbsoluteFill>
      )}
    </Scene>
  );
};

// ------------------------------------------------------------------ 06 rating
const ROWS = [
  { name: "Prospecting · Broad", res: "214", r: "LOW" },
  { name: "Retargeting · 30 days", res: "96", r: "LOW" },
  { name: "New offer · Video", res: "151", r: "MEDIUM" },
  { name: "Spring launch · Mixed", res: "238", r: "HIGH" },
];
const RC: Record<string, string> = { LOW: C.red, MEDIUM: C.amber, HIGH: C.green };
const Rating = ({ t }: { t: number }) => {
  const colHi = win(t, L.d2.start + 0.5, L.a1.start, 0.4, 0.3);
  const at: Record<string, number> = { LOW: wordAt("d3", "low"), MEDIUM: wordAt("d3", "medium"), HIGH: wordAt("d3", "high") };
  return (
    <Scene t={t} k="rating">
      <Abs x={50} y={320} w={980} style={{ ...rise(t, L.d1.start) }}>
        <div style={{ ...panel, background: "#f4f7fa", padding: 0, overflow: "hidden", border: "none" }}>
          <div style={{ background: "#1c2b39", padding: "18px 28px", display: "flex", alignItems: "center", gap: 14 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />)}
            <Txt s={30} w={800} c="#dfe8ef" style={{ marginLeft: 12 }}>Ads Manager · Ad sets</Txt>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.6fr 1.4fr", position: "relative" }}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${(1.4 / 3.5) * 100}%`, background: `rgba(46,230,214,${0.2 * colHi})`, borderLeft: `4px solid rgba(46,230,214,${colHi})` }} />
            {["Ad set", "Results", "Creative diversity"].map((h, i) => (
              <div key={h} style={{ padding: "20px 24px", borderBottom: "2px solid #d5dee6", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Txt s={28} w={900} c="#5b6f80">{h}</Txt>
                {i === 2 && <span style={{ transform: `scale(${pop(t, L.d2.start + 0.5)})`, display: "inline-block" }}><Chip text="NEW" bg={C.aqua} size={22} /></span>}
              </div>
            ))}
            {ROWS.map((r) => (
              <React.Fragment key={r.name}>
                <div style={{ padding: "26px 24px", borderBottom: "2px solid #e3e9ee" }}><Txt s={30} w={700} c="#1c2b39">{r.name}</Txt></div>
                <div style={{ padding: "26px 24px", borderBottom: "2px solid #e3e9ee" }}><Txt s={30} w={700} c="#1c2b39">{r.res}</Txt></div>
                <div style={{ padding: "20px 24px", borderBottom: "2px solid #e3e9ee", position: "relative" }}>
                  <span style={{ display: "inline-block", transform: `scale(${pop(t, at[r.r], 0.3)})` }}><Chip text={r.r} bg={RC[r.r]} fg={r.r === "LOW" ? "#fff" : C.navy} size={30} /></span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </Abs>
      <Abs x={50} y={1010} w={980} style={{ ...rise(t, L.d2.start + 1.2) }}>
        <div style={{ ...panel, padding: "24px 32px" }}>
          <Txt s={28} w={900} c={C.aqua} style={{ letterSpacing: 2 }}>WHERE TO FIND IT</Txt>
          <Txt s={36} w={800} style={{ marginTop: 6 }}>Columns › Customize columns › Creative diversity</Txt>
        </div>
      </Abs>
      <Abs x={50} y={1200} w={980} style={{ display: "flex", gap: 16, flexWrap: "wrap", ...rise(t, L.d2.start + 2.0) }}>
        <Chip text="LIVE SINCE AUG 26, 2026" bg="rgba(255,255,255,0.12)" fg="#fff" size={28} />
        <Chip text="META: ESTIMATED, IN DEVELOPMENT" bg="rgba(255,255,255,0.12)" fg="#fff" size={28} />
      </Abs>
      <Abs x={50} y={1290} w={980} style={{ ...rise(t, L.d2.start + 2.2) }}><Txt s={24} w={600} c="#7f93a3">Example ad sets for illustration.</Txt></Abs>
    </Scene>
  );
};

// ------------------------------------------------------------------ 07 adwave
const AXES = [
  { k: "a2", label: "ANGLES", c: C.yellow, items: ["Pain point", "Social proof", "Offer", "Story"] },
  { k: "a3", label: "IDEAL CUSTOMERS", c: C.schools[0], items: ["Parents", "Athletes", "Gift buyers", "Pros"] },
  { k: "a4", label: "AWARENESS LEVELS", c: C.aqua, items: ["Unaware", "Problem", "Solution", "Ready"] },
  { k: "a5", label: "FORMATS", c: C.schools[3], items: ["Video", "Static", "Carousel", "UGC"] },
];
const TILES = [0.82, 0.35, 0.7, 0.9, 0.25, 0.6, 0.78, 0.3, 0.66, 0.2, 0.86, 0.55];
const Adwave = ({ t }: { t: number }) => {
  const axesO = win(t, L.a2.start - 0.2, L.a6.start + 0.1, 0.3, 0.35);
  const gridO = easeOut(prog(t, L.a6.start - 0.1, L.a6.start + 0.3));
  const meas = easeOut(prog(t, L.a6.start + 0.1, L.a6.end));
  const cut = easeOut(prog(t, L.a7.start, L.a7.start + 0.5));
  const fresh = easeOut(prog(t, L.a8.start, L.a8.start + 0.5));
  const steps = ["BUILD", "MEASURE", "CUT", "ITERATE"];
  const active = t < L.a6.start ? 0 : t < L.a7.start ? 1 : t < L.a8.start ? 2 : 3;
  const pal = [C.schools[0], C.yellow, C.schools[3], C.green, C.aqua, C.amber];
  return (
    <Scene t={t} k="adwave">
      <Abs y={300} style={{ textAlign: "center", transform: `scale(${pop(t, L.a1.start, 0.4)})` }}>
        <Txt s={110} w={900} style={{ letterSpacing: -2, lineHeight: 1 }}>Adwave</Txt>
        <div style={{ width: 300, height: 12, margin: "14px auto 0", borderRadius: 6, background: `linear-gradient(90deg, ${C.aqua}, ${C.yellow})` }} />
      </Abs>
      {axesO > 0 && (
        <AbsoluteFill style={{ opacity: axesO }}>
          {AXES.map((a, i) => (
            <Abs key={a.k} x={60} y={520 + i * 205} w={960} style={{ ...rise(t, L[a.k].start - 0.1, 0.35) }}>
              <div style={{ ...panel, padding: "20px 26px", borderLeft: `12px solid ${a.c}` }}>
                <Txt s={30} w={900} c={a.c} style={{ letterSpacing: 2 }}>{a.label}</Txt>
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "nowrap" }}>
                  {a.items.map((it, j) => (
                    <span key={it} style={{ display: "inline-block", transform: `scale(${pop(t, L[a.k].start + 0.15 + j * 0.1, 0.3)})` }}><Chip text={it} bg="rgba(255,255,255,0.1)" fg="#fff" size={28} /></span>
                  ))}
                </div>
              </div>
            </Abs>
          ))}
        </AbsoluteFill>
      )}
      {gridO > 0 && (
        <AbsoluteFill style={{ opacity: gridO }}>
          <Abs x={90} y={520} w={900} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {TILES.map((score, i) => {
              const loser = score < 0.4;
              const gone = loser ? cut : 0;
              const k = easeOut(prog(t, L.a6.start - 0.1 + i * 0.03, L.a6.start + 0.3 + i * 0.03));
              return (
                <div key={i} style={{ position: "relative", height: 260, opacity: k }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 1 - gone * 0.85, transform: `scale(${1 - gone * 0.15})` }}>
                    <div style={{ display: "flex", justifyContent: "center" }}><AdCard color={pal[i % pal.length]} w={150} variant={i % 4} headline={i} /></div>
                    <div style={{ height: 16, margin: "14px 18px 0", borderRadius: 8, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                      <div style={{ width: `${score * meas * 100}%`, height: "100%", background: loser ? C.red : C.green }} />
                    </div>
                  </div>
                  {loser && cut > 0 && (
                    <div style={{ position: "absolute", left: 0, right: 0, top: 50, textAlign: "center", transform: `scale(${pop(t, L.a7.start, 0.3)})`, opacity: 1 - fresh }}>
                      <Txt s={120} w={900} c={C.red}>×</Txt>
                    </div>
                  )}
                  {loser && fresh > 0 && (
                    <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - fresh) * -80}px)`, opacity: fresh }}>
                      <div style={{ display: "flex", justifyContent: "center" }}><AdCard color={pal[(i + 3) % pal.length]} w={150} variant={(i + 2) % 4} headline={i + 7} /></div>
                      <div style={{ textAlign: "center", marginTop: 10 }}><Chip text="NEW" bg={C.aqua} size={22} /></div>
                    </div>
                  )}
                </div>
              );
            })}
          </Abs>
        </AbsoluteFill>
      )}
      <Abs y={1360} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, ...rise(t, L.a2.start) }}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <span style={{ display: "inline-block", transform: `scale(${i === active ? 1.08 : 0.92})` }}>
              <Chip text={s} bg={i === active ? C.yellow : "rgba(255,255,255,0.12)"} fg={i === active ? C.navy : "#fff"} size={32} />
            </span>
            {i < 3 && <Txt s={40} w={900}>›</Txt>}
          </React.Fragment>
        ))}
      </Abs>
    </Scene>
  );
};

// ------------------------------------------------------------------ end card
const End = ({ t }: { t: number }) => (
  <Scene t={t} k="end">
    <Abs x={70} y={430} w={940} style={{ transform: `scale(${pop(t, L.e1.start - 0.2, 0.4)})` }}>
      <div style={{ ...panel, padding: "40px 46px", textAlign: "center" }}>
        <Txt s={36} w={900} c={C.aqua} style={{ letterSpacing: 4 }}>TODAY</Txt>
        <Txt s={72} w={900} style={{ marginTop: 10 }}>Check your Creative Diversity rating</Txt>
      </div>
    </Abs>
    <Abs y={860} style={{ textAlign: "center", transform: `scale(${pop(t, L.e2.start + 0.3, 0.45)})` }}>
      <Txt s={170} w={900} style={{ letterSpacing: -3, lineHeight: 1 }}>Adwave</Txt>
      <div style={{ width: 340, height: 14, margin: "20px auto 30px", borderRadius: 7, background: `linear-gradient(90deg, ${C.aqua}, ${C.yellow})` }} />
      <Chip text="CONCEPTS, NOT COPIES" bg={C.yellow} size={46} />
    </Abs>
  </Scene>
);

// ------------------------------------------------------------------ captions
const Captions = ({ t }: { t: number }) => {
  const line = lines.find((l) => t >= l.start - 0.05 && t <= l.end + 0.15);
  if (!line) return null;
  const words = line.text.split(" ");
  const weights = words.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const timed = words.map((w, i) => { const s = line.start + ((line.end - line.start) * acc) / total; acc += weights[i]; return { w, s, e: line.start + ((line.end - line.start) * acc) / total }; });
  let cur = timed.findIndex((x) => t < x.e);
  if (cur === -1) cur = timed.length - 1;
  const chunk = Math.floor(cur / 4);
  const shown = timed.slice(chunk * 4, chunk * 4 + 4);
  return (
    <div style={{ position: "absolute", bottom: 190, left: 50, right: 50, textAlign: "center", fontFamily: font, fontWeight: 900, fontSize: 66, lineHeight: 1.15, textTransform: "uppercase" }}>
      {shown.map((x, i) => {
        const active = t >= x.s && t < x.e + 0.05;
        const k = easeOut(prog(t, x.s, x.s + 0.12));
        return (
          <span key={i} style={{ display: "inline-block", margin: "0 14px", color: active ? C.yellow : "#fff", transform: `scale(${active ? 1 + 0.07 * k : 1}) translateY(${(1 - k) * 16}px)`, opacity: t >= x.s - 0.02 ? 1 : 0.35, textShadow: shadow, WebkitTextStroke: "3px #000", paintOrder: "stroke fill" } as React.CSSProperties}>{x.w}</span>
        );
      })}
    </div>
  );
};

export const InfographicVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill>
      <Background t={t} />
      <Header t={t} />
      <Hook t={t} />
      <Funnel t={t} />
      <Update t={t} />
      <Arch t={t} />
      <Result t={t} />
      <Creative t={t} />
      <Rating t={t} />
      <Adwave t={t} />
      <End t={t} />
      <Captions t={t} />
      <Audio src={staticFile("infographic/mix.wav")} />
    </AbsoluteFill>
  );
};
