"""Synthesize a little musette waltz bed plus SFX (knocks, whoosh, cork pop) and mix with the voice."""
import json, sys, numpy as np, soundfile as sf
root = sys.argv[1]
voice, sr = sf.read(f"{root}/video/public/voice.wav")
T = {l["key"]: l for l in json.load(open(f"{root}/video/src/timings.json"))["lines"]}
DUR = 25.0
n = int(DUR * sr); t = np.arange(n) / sr
mix = np.zeros(n)

def place(sig, at, gain=1.0):
    i = int(at * sr); j = min(n, i + len(sig))
    if j > i: mix[i:j] += gain * sig[: j - i]

def env(length, a=0.005, d=0.15):
    x = np.arange(int(length * sr)) / sr
    return np.minimum(x / a, 1) * np.exp(-x / d)

# Accordion-ish waltz: detuned saws with tremolo, 3/4 at 138 bpm
def accordion(freq, length):
    x = np.arange(int(length * sr)) / sr
    s = sum(((x * f * d) % 1 * 2 - 1) for f, d in [(freq, 1), (freq, 1.004), (freq * 2, 0.997)])
    s *= 0.6 + 0.4 * np.sin(2 * np.pi * 6 * x)
    a = np.minimum(x / 0.03, 1) * np.minimum((length - x) / 0.05, 1)
    return s * a / 3
note = lambda m: 440 * 2 ** ((m - 69) / 12)
beat = 60 / 138
melody = [76, 74, 72, 71, 72, 74, 76, 79, 77, 76, 74, 72, 71, 69, 71, 72, 74, 72, 71, 69, 68, 69, 71, 72]
chords = [(57, 64, 69), (52, 59, 64), (57, 64, 69), (53, 60, 65), (50, 57, 62), (52, 59, 64), (57, 64, 69), (52, 56, 59)]
bar, k = 0, 0
while bar * 3 * beat < DUR:
    t0 = bar * 3 * beat
    c = chords[bar % len(chords)]
    place(accordion(note(c[0] - 12), beat * 0.9), t0, 0.10)          # oom
    for b in (1, 2):                                                    # pah pah
        for m in c[1:]:
            place(accordion(note(m), beat * 0.5), t0 + b * beat, 0.045)
    for b in range(3):
        place(accordion(note(melody[k % len(melody)]), beat * 0.95), t0 + b * beat, 0.07); k += 1
    bar += 1
# duck music under the voice, fade out at the end
ducker = np.ones(n)
for l in T.values():
    ducker[int(l["start"] * sr): int(l["end"] * sr)] = 0.55
ducker = np.convolve(ducker, np.ones(2400) / 2400, mode="same")
mix *= ducker * np.minimum(1, (DUR - t) / 1.2) * np.minimum(1, t / 0.4)

rng = np.random.default_rng(3)
knock = lambda: (np.sin(2 * np.pi * 110 * np.arange(int(.18 * sr)) / sr) * 0.8 + rng.normal(0, .5, int(.18 * sr))) * env(.18, .001, .03)
for at in (10.25, 10.45, 10.62):
    place(knock(), at, 0.9)
w = int(0.5 * sr); x = np.arange(w) / sr
whoosh = np.convolve(rng.normal(0, 1, w), np.ones(30) / 30, "same") * np.sin(np.pi * x / 0.5) ** 2
place(whoosh, T["step2"]["start"] + 0.55, 0.6)
p = int(.12 * sr); x = np.arange(p) / sr
pop = np.sin(2 * np.pi * (900 - 4000 * x) * x) * env(.12, .001, .025) + rng.normal(0, .3, p) * env(.12, .001, .01)
place(pop, T["result"]["start"] + 1.9, 0.9)
for i, f in enumerate([1568, 2093, 2637]):  # sparkle
    place(np.sin(2 * np.pi * f * np.arange(int(.4 * sr)) / sr) * env(.4, .002, .15), T["result"]["start"] + 2.0 + i * 0.07, 0.12)

v = np.zeros(n); v[: min(n, len(voice))] = voice[:n]
out = v * 1.0 + mix
out /= max(1.0, np.abs(out).max() / 0.95)
sf.write(f"{root}/video/public/mix.wav", out.astype(np.float32), sr)
print("ok", out.shape[0] / sr)
