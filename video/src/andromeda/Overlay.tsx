import React from "react";
import { AbsoluteFill } from "remotion";
import { C, L, S, clamp, easeOut, lines, pop, prog, win } from "./tl";

const font = "Inter, sans-serif";
const shadow = "0 0 2px #000, 0 5px 0 rgba(0,0,0,.45), 0 0 26px rgba(0,0,0,.55)";

const Box = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "rgba(6,24,42,0.82)", border: "3px solid rgba(255,255,255,0.14)", borderRadius: 34, padding: "34px 44px", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", ...style }}>{children}</div>
);

const Chip = ({ text, bg, fg = C.navy, size = 40, style }: { text: string; bg: string; fg?: string; size?: number; style?: React.CSSProperties }) => (
  <span style={{ display: "inline-block", background: bg, color: fg, fontFamily: font, fontWeight: 900, fontSize: size, letterSpacing: 2, padding: `${size * 0.28}px ${size * 0.7}px`, borderRadius: size, boxShadow: "0 6px 0 rgba(0,0,0,0.3)", ...style }}>{text}</span>
);

/** word timing helper: estimate when a word inside a narration line is spoken */
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

// ------------------------------------------------------------ section tag at the top
const TAGS: { from: number; to: number; text: string; color: string }[] = [
  { from: S.news, to: S.recap, text: "THE NEWS", color: C.yellow },
  { from: S.recap, to: S.whatsNew, text: "QUICK RECAP", color: C.white },
  { from: S.whatsNew, to: S.means, text: "WHAT'S NEW", color: C.aqua },
  { from: S.means, to: S.rating, text: "WHAT IT MEANS", color: C.amber },
  { from: S.rating, to: S.adwave, text: "YOUR FISH FINDER", color: C.green },
  { from: S.adwave, to: L.ad2.start - 0.1, text: "HOW ADWAVE FISHES", color: C.yellow },
  { from: L.ad7.start, to: S.cta, text: "HOW ADWAVE FISHES", color: C.yellow },
];
const SectionTag = ({ t }: { t: number }) => {
  const tag = TAGS.find((x) => t >= x.from && t < x.to);
  if (!tag) return null;
  const s = pop(t, tag.from, 0.35), o = win(t, tag.from, tag.to, 0.15, 0.2);
  return (
    <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", opacity: o }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 18, transform: `scale(${s})`, background: "rgba(6,24,42,0.85)", border: `4px solid ${tag.color}`, color: tag.color, fontFamily: font, fontWeight: 900, fontSize: 44, letterSpacing: 5, padding: "14px 36px", borderRadius: 60 }}>
        <span style={{ width: 18, height: 18, borderRadius: 9, background: tag.color, display: "inline-block" }} />
        {tag.text}
      </div>
    </div>
  );
};

// ------------------------------------------------------------ hook
const Hook = ({ t }: { t: number }) => {
  const o = win(t, 0, S.news + 0.2, 0.15, 0.35);
  if (o <= 0) return null;
  const crack = prog(t, 0.9, 1.15);
  const swap = easeOut(prog(t, 1.15, 1.5));
  const shake = t > 0.85 && t < 1.2 ? Math.sin(t * 90) * 8 : 0;
  const s2 = pop(t, L.hook2.start, 0.35);
  return (
    <AbsoluteFill style={{ background: `rgba(3,12,24,${0.7 * o})`, justifyContent: "center", alignItems: "center", opacity: o }}>
      <div style={{ position: "relative", textAlign: "center", transform: `translateX(${shake}px)`, marginTop: -200 }}>
        <div style={{ fontFamily: font, fontWeight: 900, fontSize: 92, color: "#8a9aa8", letterSpacing: 6, opacity: 1 - swap, position: swap > 0 ? "absolute" : "relative", left: 0, right: 0, clipPath: crack > 0 ? `polygon(0 0, ${50 + 30 * crack}% 0, ${50 - 10 * crack}% 100%, 0 100%)` : undefined }}>ANDROMEDA</div>
        {crack > 0 && swap < 1 && (
          <div style={{ fontFamily: font, fontWeight: 900, fontSize: 92, color: "#8a9aa8", letterSpacing: 6, position: "absolute", top: 0, left: 0, right: 0, opacity: 1 - swap, transform: `translate(${crack * 30}px, ${crack * 20}px) rotate(${crack * 6}deg)`, clipPath: `polygon(${50 + 30 * crack}% 0, 100% 0, 100% 100%, ${50 - 10 * crack}% 100%)` }}>ANDROMEDA</div>
        )}
        {swap > 0 && (
          <div style={{ transform: `scale(${0.6 + 0.4 * swap})`, opacity: swap }}>
            <div style={{ fontFamily: font, fontWeight: 900, fontSize: 120, letterSpacing: 4, lineHeight: 1, background: `linear-gradient(90deg, ${C.aqua}, #8fd6ff, ${C.yellow})`, WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 30px rgba(46,230,214,0.5))" }}>ANDROMEDA</div>
            <div style={{ fontFamily: font, fontWeight: 900, fontSize: 250, lineHeight: 1, color: "#fff", textShadow: `0 0 50px ${C.aqua}` }}>2.0</div>
          </div>
        )}
        <div style={{ marginTop: 50, transform: `scale(${s2}) rotate(-2deg)` }}>
          <Chip text="MOST ADVERTISERS MISSED IT" bg={C.red} fg="#fff" size={46} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ news cards
const News = ({ t }: { t: number }) => {
  const o1 = win(t, L.news1.start, L.news1.end + 0.25);
  const o2 = win(t, L.news2.start, L.news2.end + 0.25);
  const o3 = win(t, L.news3.start, S.recap + 0.1, 0.2, 0.3);
  const brain = pop(t, wordAt("news2", "brand"), 0.4);
  const count = easeOut(prog(t, L.news3.start + 0.3, L.news3.start + 2.0));
  const n = Math.round(1_000_000_000 * count);
  return (
    <>
      {o1 > 0 && (
        <div style={{ position: "absolute", top: 300, left: 70, right: 70, opacity: o1, transform: `scale(${pop(t, L.news1.start)})` }}>
          <Box style={{ textAlign: "center" }}>
            <div style={{ fontFamily: font, fontWeight: 800, fontSize: 40, color: C.aqua, letterSpacing: 6 }}>META ENGINEERING</div>
            <div style={{ fontFamily: font, fontWeight: 900, fontSize: 150, color: "#fff", lineHeight: 1.05, marginTop: 10 }}>28 OCT</div>
            <div style={{ fontFamily: font, fontWeight: 900, fontSize: 72, color: C.yellow, lineHeight: 1 }}>2026</div>
            <div style={{ fontFamily: font, fontWeight: 700, fontSize: 44, color: "#dbe7f0", marginTop: 26 }}>Next generation of Andromeda released</div>
          </Box>
        </div>
      )}
      {o2 > 0 && (
        <div style={{ position: "absolute", top: 300, left: 70, right: 70, opacity: o2 }}>
          <Box style={{ transform: `scale(${pop(t, L.news2.start)})` }}>
            <Chip text="SAME JOB" bg="#ffffff" size={40} />
            <div style={{ fontFamily: font, fontWeight: 800, fontSize: 62, color: "#fff", lineHeight: 1.15, marginTop: 22 }}>Decides which ad each person sees</div>
          </Box>
          <div style={{ marginTop: 34, textAlign: "center", transform: `scale(${brain}) rotate(-2deg)` }}>
            <Chip text="BRAND NEW BRAIN" bg={C.aqua} size={60} />
          </div>
        </div>
      )}
      {o3 > 0 && (
        <div style={{ position: "absolute", top: 300, left: 70, right: 70, opacity: o3, transform: `scale(${pop(t, L.news3.start)})` }}>
          <Box style={{ textAlign: "center" }}>
            <div style={{ fontFamily: font, fontWeight: 900, fontSize: 112, color: C.yellow, fontVariantNumeric: "tabular-nums", letterSpacing: -2 }}>{n.toLocaleString("en-US")}{count >= 1 ? "+" : ""}</div>
            <div style={{ fontFamily: font, fontWeight: 800, fontSize: 54, color: "#fff", marginTop: 6 }}>ads checked per second</div>
            <div style={{ fontFamily: font, fontWeight: 600, fontSize: 32, color: "#9fb3c4", marginTop: 16 }}>Meta's figure</div>
          </Box>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------ what's new: the specialists list
const SPECS = ["Recent bites", "Its school", "What your ad means", "Facebook + Instagram"];
const SPEC_SUB = ["What each person engaged with lately", "The group they belong to", "What your creative is actually about", "Activity across both apps"];
const WhatsNew = ({ t }: { t: number }) => {
  const oBefore = win(t, L.new2.start, L.new3.start + 0.1, 0.25, 0.25);
  const oNow = win(t, L.new3.start, S.means, 0.25, 0.3);
  return (
    <>
      {oBefore > 0 && (
        <div style={{ position: "absolute", top: 270, left: 0, right: 0, textAlign: "center", opacity: oBefore, transform: `scale(${pop(t, L.new2.start)})` }}>
          <Box style={{ display: "inline-block", padding: "26px 40px" }}>
            <div style={{ fontFamily: font, fontWeight: 900, fontSize: 36, color: "#9fb3c4", letterSpacing: 5 }}>BEFORE</div>
            <div style={{ fontFamily: font, fontWeight: 900, fontSize: 58, color: "#fff" }}>One model. Same view of everyone.</div>
          </Box>
        </div>
      )}
      {oNow > 0 && (
        <div style={{ position: "absolute", top: 250, left: 40, right: 400, opacity: oNow }}>
          <div style={{ transform: `scale(${pop(t, L.new3.start)})`, transformOrigin: "left center", marginBottom: 18 }}>
            <Chip text="NOW: SPECIALISTS" bg={C.aqua} size={38} />
          </div>
          {SPECS.map((s, i) => {
            const ln = L[`spec${i + 1}`];
            const k = easeOut(prog(t, ln.start - 0.1, ln.start + 0.35));
            const active = t >= ln.start - 0.1 && t < ln.end + 0.2;
            if (k <= 0) return null;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, margin: "10px 0", padding: "12px 20px", borderRadius: 22, background: active ? "rgba(6,24,42,0.92)" : "rgba(6,24,42,0.7)", border: `3px solid ${active ? C.specs[i] : "rgba(255,255,255,0.1)"}`, transform: `translateX(${(1 - k) * -80}px) scale(${active ? 1.03 : 0.97})`, opacity: k }}>
                <div style={{ width: 46, height: 46, borderRadius: 23, background: C.specs[i], boxShadow: `0 0 24px ${C.specs[i]}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontWeight: 900, fontSize: 30, color: C.navy }}>{i + 1}</div>
                <div>
                  <div style={{ fontFamily: font, fontWeight: 900, fontSize: 38, color: "#fff", lineHeight: 1.1 }}>{s}</div>
                  {active && <div style={{ fontFamily: font, fontWeight: 600, fontSize: 26, color: "#b8c8d6" }}>{SPEC_SUB[i]}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------ what it means
const Means = ({ t }: { t: number }) => {
  const o1 = win(t, L.mean1.start, L.mean1.end + 0.2);
  const o2 = win(t, L.mean2.start, L.mean2.end + 0.25);
  const num = easeOut(prog(t, L.mean2.start + 0.4, L.mean2.start + 1.6));
  return (
    <>
      {o1 > 0 && (
        <div style={{ position: "absolute", top: 280, left: 0, right: 0, textAlign: "center", opacity: o1, transform: `scale(${pop(t, L.mean1.start)})` }}>
          <Chip text="SHARPER GROUPS OF PEOPLE" bg={C.amber} size={48} />
        </div>
      )}
      {o2 > 0 && (
        <div style={{ position: "absolute", top: 270, left: 110, right: 110, opacity: o2, transform: `scale(${pop(t, L.mean2.start)})` }}>
          <Box style={{ textAlign: "center" }}>
            <div style={{ fontFamily: font, fontWeight: 900, fontSize: 180, color: C.green, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>+{(2.4 * num).toFixed(1)}%</div>
            <div style={{ fontFamily: font, fontWeight: 800, fontSize: 48, color: "#fff", marginTop: 10 }}>Facebook conversions since 2025</div>
            <div style={{ fontFamily: font, fontWeight: 600, fontSize: 32, color: "#9fb3c4", marginTop: 12 }}>Source: Meta</div>
          </Box>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------ the fish finder (Creative Diversity rating)
const Rating = ({ t }: { t: number }) => {
  const o = win(t, S.rating, S.adwave + 0.1, 0.3, 0.35);
  if (o <= 0) return null;
  const sweep = (t * 140) % 360;
  const badges = [
    { text: "LOW", c: C.red, at: wordAt("rate2", "low") },
    { text: "MEDIUM", c: C.amber, at: wordAt("rate2", "medium") },
    { text: "HIGH", c: C.green, at: wordAt("rate2", "high") },
  ];
  return (
    <AbsoluteFill style={{ background: `rgba(3,12,24,${0.55 * o})`, opacity: o }}>
      <div style={{ position: "absolute", top: 260, left: 90, right: 90, transform: `scale(${pop(t, S.rating, 0.45)})` }}>
        <div style={{ background: "#0d1f17", border: "10px solid #2c3a44", borderRadius: 46, padding: 40, boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 0 60px rgba(61,220,132,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font, fontWeight: 800, fontSize: 30, color: "#7fdca4", letterSpacing: 4 }}>
            <span>FISH FINDER</span><span>ADS MANAGER</span>
          </div>
          <div style={{ position: "relative", height: 330, margin: "26px auto", width: 330 }}>
            {[1, 0.66, 0.33].map((r, i) => (
              <div key={i} style={{ position: "absolute", inset: `${(1 - r) * 50}%`, borderRadius: "50%", border: "3px solid rgba(61,220,132,0.4)" }} />
            ))}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(from ${sweep}deg, rgba(61,220,132,0.55), rgba(61,220,132,0) 70deg, rgba(61,220,132,0) 360deg)` }} />
            {[[0.3, 0.35], [0.62, 0.28], [0.7, 0.66], [0.38, 0.72]].map(([x, y], i) => (
              <div key={i} style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, width: 22, height: 22, borderRadius: 11, background: C.schools[i], boxShadow: `0 0 18px ${C.schools[i]}`, opacity: 0.6 + 0.4 * Math.sin(t * 4 + i) }} />
            ))}
          </div>
          <div style={{ fontFamily: font, fontWeight: 900, fontSize: 56, color: "#fff", textAlign: "center", letterSpacing: 2 }}>CREATIVE DIVERSITY</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 28 }}>
            {badges.map((b) => (
              <span key={b.text} style={{ transform: `scale(${pop(t, b.at, 0.3)})`, display: "inline-block" }}>
                <Chip text={b.text} bg={b.c} fg={b.text === "LOW" ? "#fff" : C.navy} size={44} />
              </span>
            ))}
          </div>
          <div style={{ fontFamily: font, fontWeight: 600, fontSize: 30, color: "#8fb3a0", textAlign: "center", marginTop: 30 }}>Columns › Customize columns › Creative diversity</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ Adwave
const PILLARS = [
  { text: "ANGLES", key: "ad2", c: C.yellow },
  { text: "ICPs", key: "ad3", c: C.schools[0] },
  { text: "AWARENESS", key: "ad4", c: C.aqua },
  { text: "FORMATS", key: "ad5", c: C.schools[3] },
];
const Adwave = ({ t }: { t: number }) => {
  const o1 = win(t, L.ad1.start - 0.1, L.ad2.start + 0.1, 0.2, 0.25);
  const oP = win(t, L.ad2.start, L.ad7.start, 0.2, 0.3);
  const oB = win(t, L.ad7.start, S.cta, 0.25, 0.3);
  const loopAt = L.ad8.start + 0.2;
  const steps = ["MAKE", "MEASURE", "ITERATE"];
  const activeStep = t < L.ad7.start ? 0 : t < L.ad8.start ? 1 : 2;
  return (
    <>
      {o1 > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: o1, background: `rgba(3,12,24,${0.45 * o1})` }}>
          <div style={{ transform: `scale(${pop(t, L.ad1.start, 0.4)})`, textAlign: "center", marginTop: -220 }}>
            <div style={{ fontFamily: font, fontWeight: 800, fontSize: 48, color: "#cfe3f0", letterSpacing: 4 }}>ENTER</div>
            <div style={{ fontFamily: font, fontWeight: 900, fontSize: 170, color: "#fff", letterSpacing: -2, lineHeight: 1, textShadow: shadow }}>Adwave</div>
            <div style={{ width: 360, height: 14, margin: "20px auto 0", borderRadius: 7, background: `linear-gradient(90deg, ${C.aqua}, ${C.yellow})` }} />
          </div>
        </AbsoluteFill>
      )}
      {oP > 0 && (
        <div style={{ position: "absolute", top: 110, left: 40, right: 40, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, opacity: oP }}>
          {PILLARS.map((p) => {
            const at = L[p.key].start;
            const s = pop(t, at, 0.35);
            const lit = t >= at && t < L[p.key].end + 0.3;
            return (
              <span key={p.text} style={{ transform: `scale(${s * (lit ? 1.08 : 0.92)})`, display: "inline-block", opacity: s > 0 ? (lit || t > L.ad5.end ? 1 : 0.6) : 0 }}>
                <Chip text={p.text} bg={p.c} size={40} />
              </span>
            );
          })}
        </div>
      )}
      {oB > 0 && (
        <div style={{ position: "absolute", top: 240, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 12, opacity: oB, transform: `scale(${pop(t, L.ad7.start, 0.4)})` }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <span style={{ transform: `scale(${i === activeStep ? 1.08 : 0.9})`, display: "inline-block" }}>
                <Chip text={s} bg={i === activeStep ? C.yellow : "rgba(6,24,42,0.85)"} fg={i === activeStep ? C.navy : "#fff"} size={36} />
              </span>
              {i < 2 && <span style={{ fontFamily: font, fontWeight: 900, fontSize: 44, color: "#fff", textShadow: shadow }}>›</span>}
            </React.Fragment>
          ))}
          <span style={{ fontFamily: font, fontWeight: 900, fontSize: 50, color: C.yellow, transform: `rotate(${(t - loopAt) * 200}deg)`, display: "inline-block", opacity: t > loopAt ? 1 : 0 }}>↻</span>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------ call to action
const Cta = ({ t }: { t: number }) => {
  const o = win(t, S.cta + 0.1, S.end + 1, 0.4, 0.01);
  if (o <= 0) return null;
  const s2 = pop(t, L.cta2.start + 0.4, 0.45);
  return (
    <div style={{ position: "absolute", top: 300, left: 70, right: 70, textAlign: "center", opacity: o }}>
      <div style={{ transform: `scale(${pop(t, S.cta + 0.1, 0.4)})` }}>
        <Box>
          <div style={{ fontFamily: font, fontWeight: 800, fontSize: 40, color: C.aqua, letterSpacing: 5 }}>TODAY</div>
          <div style={{ fontFamily: font, fontWeight: 900, fontSize: 70, color: "#fff", lineHeight: 1.1, marginTop: 8 }}>Check your Creative Diversity rating</div>
        </Box>
      </div>
      <div style={{ marginTop: 50, transform: `scale(${s2})` }}>
        <div style={{ fontFamily: font, fontWeight: 900, fontSize: 150, color: "#fff", letterSpacing: -2, lineHeight: 1, textShadow: shadow }}>Adwave</div>
        <div style={{ width: 320, height: 12, margin: "18px auto 22px", borderRadius: 6, background: `linear-gradient(90deg, ${C.aqua}, ${C.yellow})` }} />
        <Chip text="CONCEPTS, NOT COPIES" bg={C.yellow} size={44} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------ karaoke captions
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
    <div style={{ position: "absolute", bottom: 210, left: 50, right: 50, textAlign: "center", fontFamily: font, fontWeight: 900, fontSize: 70, lineHeight: 1.15, textTransform: "uppercase" }}>
      {shown.map((x, i) => {
        const active = t >= x.s && t < x.e + 0.05;
        const k = easeOut(prog(t, x.s, x.s + 0.12));
        return (
          <span key={i} style={{ display: "inline-block", margin: "0 16px", color: active ? C.yellow : "#fff", transform: `scale(${active ? 1 + 0.07 * k : 1}) translateY(${(1 - k) * 16}px)`, opacity: t >= x.s - 0.02 ? 1 : 0.35, textShadow: shadow, WebkitTextStroke: "3px #000", paintOrder: "stroke fill" } as React.CSSProperties}>{x.w}</span>
        );
      })}
    </div>
  );
};

export const Overlay = ({ t }: { t: number }) => (
  <AbsoluteFill>
    {/* soft vignette keeps text readable over the 3D */}
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,12,24,0.55) 0%, rgba(3,12,24,0) 22%, rgba(3,12,24,0) 68%, rgba(3,12,24,0.7) 100%)" }} />
    <Hook t={t} />
    <SectionTag t={t} />
    <News t={t} />
    <WhatsNew t={t} />
    <Means t={t} />
    <Rating t={t} />
    <Adwave t={t} />
    <Cta t={t} />
    <Captions t={t} />
  </AbsoluteFill>
);
