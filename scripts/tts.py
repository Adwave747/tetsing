"""Generic Kokoro narration builder.

usage: tts.py <root> <lines.json> <out.wav> <out_timings.json> [voice] [speed]
lines.json is a list of [key, spoken text, caption text, gap seconds].
"""
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

root, lines_path, out_wav, out_json = sys.argv[1:5]
VOICE = sys.argv[5] if len(sys.argv) > 5 else "am_michael"
SPEED = float(sys.argv[6]) if len(sys.argv) > 6 else 1.05
k = Kokoro(f"{root}/tts/kokoro-v1.0.onnx", f"{root}/tts/voices-v1.0.bin")
sr, t = 24000, 0.4
out = [np.zeros(int(sr * t), dtype=np.float32)]
timings = []
for key, spoken, caption, gap in json.load(open(lines_path)):
    audio, sr = k.create(spoken, voice=VOICE, speed=SPEED, lang="en-us")
    nz = np.where(np.abs(audio) > 0.01)[0]
    audio = audio[max(0, nz[0] - 240): nz[-1] + 1200] if len(nz) else audio
    dur = len(audio) / sr
    timings.append({"key": key, "text": caption, "start": round(t, 3), "end": round(t + dur, 3)})
    out += [audio.astype(np.float32), np.zeros(int(sr * gap), dtype=np.float32)]
    t += dur + gap
t += 1.4
out.append(np.zeros(int(sr * 1.4), dtype=np.float32))
sf.write(out_wav, np.concatenate(out), sr)
json.dump({"total": round(t, 3), "lines": timings}, open(out_json, "w"), indent=2)
print("TOTAL", round(t, 2))
