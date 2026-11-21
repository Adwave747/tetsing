"""Music bed (synthesized, 100 bpm) plus SFX for the Andromeda explainer, mixed under the narration."""
import json, sys, numpy as np, soundfile as sf
root = sys.argv[1]
voice, sr = sf.read(f"{root}/video/public/andromeda/voice.wav")
D = json.load(open(f"{root}/video/src/andromeda/timings.json"))
T = {l["key"]: l for l in D["lines"]}
DUR = D["total"]
n = int(DUR * sr); t = np.arange(n) / sr
music = np.zeros(n); sfx = np.zeros(n)
rng = np.random.default_rng(11)

def place(buf, sig, at, gain=1.0):
    i = int(at * sr)
    if i < 0: sig, i = sig[-i:], 0
    j = min(n, i + len(sig))
    if j > i: buf[i:j] += gain * sig[: j - i]

def env(length, a=0.005, d=0.15):
    x = np.arange(int(length * sr)) / sr
    return np.minimum(x / a, 1) * np.exp(-x / d)

note = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(f, length=0.45, bright=1.0):
    x = np.arange(int(length * sr)) / sr
    s = np.sin(2 * np.pi * f * x) + 0.5 * bright * np.sin(4 * np.pi * f * x) * np.exp(-x * 12) + 0.25 * np.sin(6 * np.pi * f * x) * np.exp(-x * 20)
    return s * env(length, 0.003, 0.22)
def pad(freqs, length):
    x = np.arange(int(length * sr)) / sr
    s = sum(np.sin(2 * np.pi * f * d * x) for f in freqs for d in (1, 1.003))
    a = np.minimum(x / 0.4, 1) * np.minimum((length - x) / 0.4, 1)
    return s * a / (2 * len(freqs))
def kick():
    x = np.arange(int(0.3 * sr)) / sr
    return np.sin(2 * np.pi * (45 + 90 * np.exp(-x * 30)) * x) * np.exp(-x * 9)
def hat():
    k = int(0.05 * sr)
    return np.diff(rng.normal(0, 1, k + 1)) * env(0.05, 0.001, 0.012)

bpm = 100; beat = 60 / bpm; bar = 4 * beat
# i - VI - III - VII in A minor: Am F C G
prog_ = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]
arp = [0, 1, 2, 1, 2, 0, 1, 2]
b = 0
while b * bar < DUR:
    t0 = b * bar
    ch = prog_[b % 4]
    intro = t0 < 4.4
    place(music, pad([note(m) for m in ch], bar), t0, 0.16)
    place(music, pluck(note(ch[0] - 24), bar * 0.9, 0.3), t0, 0.22 if not intro else 0.1)
    for i in range(8):
        place(music, pluck(note(ch[arp[i]] + 12)), t0 + i * beat / 2, 0.07)
    if not intro:
        for i in range(4):
            place(music, kick(), t0 + i * beat, 0.32 if i % 2 == 0 else 0.22)
            place(music, hat(), t0 + i * beat + beat / 2, 0.12)
    b += 1
# duck under the voice, fades
duck = np.ones(n)
for l in D["lines"]:
    duck[int(l["start"] * sr): int(l["end"] * sr)] = 0.42
duck = np.convolve(duck, np.ones(4800) / 4800, mode="same")
music *= duck * np.minimum(1, (DUR - t) / 2.0) * np.minimum(1, t / 0.3)

# ---- SFX
def whoosh(length=0.6, up=True):
    w = int(length * sr); x = np.arange(w) / sr
    s = np.convolve(rng.normal(0, 1, w), np.ones(25) / 25, "same")
    return s * np.sin(np.pi * x / length) ** 2
def popfx():
    k = int(0.09 * sr); x = np.arange(k) / sr
    return np.sin(2 * np.pi * (500 + 1800 * x / 0.09) * x) * env(0.09, 0.001, 0.025)
def ping(f=1400, length=1.4):
    x = np.arange(int(length * sr)) / sr
    return (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2.01 * x)) * np.exp(-x * 3.2)
def splash():
    k = int(1.0 * sr); x = np.arange(k) / sr
    s = rng.normal(0, 1, k) * np.exp(-x * 4) * np.minimum(x / 0.01, 1)
    return np.convolve(s, np.ones(6) / 6, "same")
def thud():
    x = np.arange(int(0.5 * sr)) / sr
    return np.sin(2 * np.pi * (40 + 60 * np.exp(-x * 20)) * x) * np.exp(-x * 6) + rng.normal(0, 0.3, len(x)) * np.exp(-x * 30)
def chime(base=1046):
    out = np.zeros(int(0.8 * sr))
    for i, m in enumerate([0, 4, 7, 12]):
        s = np.sin(2 * np.pi * base * 2 ** (m / 12) * np.arange(int(0.6 * sr)) / sr) * env(0.6, 0.002, 0.2)
        o = int(i * 0.06 * sr); out[o:o + len(s)] += s
    return out

place(sfx, thud(), 0.95, 0.9)                           # Andromeda logo cracks
place(sfx, chime(880), 1.2, 0.18)                       # 2.0 reveal
sections = [T["news1"]["start"] - 0.2, T["recap1"]["start"] - 0.3, T["new1"]["start"] - 0.3, T["mean1"]["start"] - 0.3,
            T["rate1"]["start"] - 0.3, T["ad1"]["start"] - 0.3, T["cta1"]["start"] - 0.3]
for s in sections:
    place(sfx, whoosh(0.6), s - 0.3, 0.35)
place(sfx, splash(), 17.9, 0.55)                        # camera dives under
for k in ["recap2", "recap3", "spec1", "spec2", "spec3", "spec4", "ad2", "ad3", "ad4", "ad5"]:
    place(sfx, popfx(), T[k]["start"], 0.35)
place(sfx, whoosh(0.9), T["new3"]["start"] + 0.3, 0.3)  # current splits into specialists
place(sfx, chime(), T["mean2"]["start"] + 1.5, 0.16)    # +2.4%
for i in range(10):
    place(sfx, popfx(), T["mean3"]["start"] + i * 0.06, 0.12)
place(sfx, ping(), T["rate1"]["start"] - 0.2, 0.25)     # fish finder
place(sfx, ping(1700, 1.0), T["rate2"]["start"] + 0.1, 0.12)
place(sfx, chime(784), T["ad1"]["start"] + 0.1, 0.18)   # Adwave
for i in range(4):
    place(sfx, popfx(), T["ad7"]["start"] + 0.4 + i * 0.15, 0.25)
place(sfx, chime(1175), T["cta2"]["start"] + 0.4, 0.2)

v = np.zeros(n); v[: min(n, len(voice))] = voice[:n]
out = v * 1.0 + music + sfx
out /= max(1.0, np.abs(out).max() / 0.95)
sf.write(f"{root}/video/public/andromeda/mix.wav", out.astype(np.float32), sr)
print("ok", round(n / sr, 2))
