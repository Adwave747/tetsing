"""Generate the narration with Kokoro (ONNX) and write per-line timings for the video."""
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

root = sys.argv[1]
k = Kokoro(f"{root}/tts/kokoro-v1.0.onnx", f"{root}/tts/voices-v1.0.bin")
NARR, SOLDIER, SPEED = "bm_george", "am_onyx", 1.2

lines = [
    ("title",  NARR,    "How to hide from the Nazis in a wine barrel. A quick guide."),
    ("step1",  NARR,    "Step one. Empty the barrel. Drinking it is allowed. Encouraged, even."),
    ("step2",  NARR,    "Step two. Climb in. Become the wine."),
    ("knock",  SOLDIER, "Is anybody in there?"),
    ("step3",  NARR,    "Step three. Do not answer. Especially not with, non."),
    ("step4",  NARR,    "Step four. Wait. Nobody ever checks the Merlot."),
    ("result", NARR,    "The soldiers leave. You survive. And you smell like a fancy dinner party."),
    ("end",    NARR,    "Vive la résistance."),
]
sr, out, timings, t = 24000, [], [], 0.25
out.append(np.zeros(int(sr * 0.25), dtype=np.float32))
for key, voice, text in lines:
    audio, sr = k.create(text, voice=voice, speed=SPEED, lang="en-gb" if voice.startswith("b") else "en-us")
    dur = len(audio) / sr
    timings.append({"key": key, "text": text, "start": round(t, 3), "end": round(t + dur, 3)})
    gap = 0.2
    out += [audio.astype(np.float32), np.zeros(int(sr * gap), dtype=np.float32)]
    t += dur + gap
sf.write(f"{root}/video/public/voice.wav", np.concatenate(out), sr)
json.dump({"total": round(t, 3), "lines": timings}, open(f"{root}/video/src/timings.json", "w"), indent=2)
print(json.dumps(timings, indent=1), "\nTOTAL", round(t, 2))
