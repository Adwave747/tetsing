"""Andromeda 2.0 explainer narration (Kokoro ONNX). Writes voice.wav and per-line timings.

Each line is (key, spoken text, caption text, gap after in seconds).
Spoken text spells out numbers and names so the TTS pronounces them correctly.
"""
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

root = sys.argv[1]
VOICE = sys.argv[2] if len(sys.argv) > 2 else "am_michael"
SPEED = float(sys.argv[3]) if len(sys.argv) > 3 else 1.05
k = Kokoro(f"{root}/tts/kokoro-v1.0.onnx", f"{root}/tts/voices-v1.0.bin")

lines = [
    ("hook",   "Meta just rebuilt Andromeda.", "Meta just rebuilt Andromeda.", 0.15),
    ("hook2",  "And most advertisers missed it.", "And most advertisers missed it.", 0.5),
    ("news1",  "On October twenty eighth, Meta released the next generation of Andromeda.", "On October 28th, Meta released the next generation of Andromeda.", 0.25),
    ("news2",  "Same job, deciding which ad each person sees, with a brand new brain.", "Same job, deciding which ad each person sees, with a brand new brain.", 0.25),
    ("news3",  "Meta says it can check over a billion ads a second.", "Meta says it can check over a billion ads a second.", 0.5),
    ("recap1", "Quick recap.", "Quick recap.", 0.2),
    ("recap2", "People are the fish,", "People are the fish,", 0.1),
    ("recap3", "your ads are the bait,", "your ads are the bait,", 0.1),
    ("recap4", "and Andromeda is the current that carries each bait to the right fish.", "and Andromeda is the current that carries each bait to the right fish.", 0.5),
    ("new1",   "Here's what changed.", "Here's what changed.", 0.2),
    ("new2",   "The old Andromeda was one current that read every fish the same way.", "The old Andromeda was one current that read every fish the same way.", 0.3),
    ("new3",   "The new one is a team of specialists.", "The new one is a team of specialists.", 0.3),
    ("spec1",  "One tracks what each fish has been biting lately.", "One tracks what each fish has been biting lately.", 0.2),
    ("spec2",  "One knows which school it swims with.", "One knows which school it swims with.", 0.2),
    ("spec3",  "One understands what your bait actually means.", "One understands what your bait actually means.", 0.2),
    ("spec4",  "And one follows the fish across Facebook and Instagram.", "And one follows the fish across Facebook and Instagram.", 0.5),
    ("mean1",  "Together they tell the fish apart far better than before.", "Together they tell the fish apart far better than before.", 0.2),
    ("mean2",  "Meta says Facebook conversions are up two point four percent since twenty twenty five.", "Meta says Facebook conversions are up 2.4% since 2025.", 0.3),
    ("mean3",  "But ten copies of the same worm still end up at the same school.", "But ten copies of the same worm still end up at the same school.", 0.5),
    ("rate1",  "That's why your creative diversity rating matters.", "That's why your creative diversity rating matters.", 0.2),
    ("rate2",  "Low, medium or high, it's your fish finder.", "Low, medium or high, it's your fish finder.", 0.5),
    ("ad1",    "That's where Ad wave comes in.", "That's where Adwave comes in.", 0.25),
    ("ad2",    "We make creative across different angles,", "We make creative across different angles,", 0.1),
    ("ad3",    "for different ideal customers,", "for different ideal customers,", 0.1),
    ("ad4",    "at every awareness level,", "at every awareness level,", 0.1),
    ("ad5",    "and in every format.", "and in every format.", 0.3),
    ("ad6",    "In lake terms, the right bait for every fish, at every depth.", "In lake terms, the right bait for every fish, at every depth.", 0.4),
    ("ad7",    "Then we measure what's biting, and we iterate.", "Then we measure what's biting, and we iterate.", 0.25),
    ("ad8",    "Cut what isn't working, and double down on what is.", "Cut what isn't working, and double down on what is.", 0.5),
    ("cta1",   "Check your rating today.", "Check your rating today.", 0.2),
    ("cta2",   "If it says low, Ad wave builds the tackle box.", "If it says low, Adwave builds the tackle box.", 0.2),
]
sr, t = 24000, 0.4
out = [np.zeros(int(sr * t), dtype=np.float32)]
timings = []
for key, spoken, caption, gap in lines:
    audio, sr = k.create(spoken, voice=VOICE, speed=SPEED, lang="en-us")
    # trim leading/trailing near-silence so timings hug the words
    nz = np.where(np.abs(audio) > 0.01)[0]
    audio = audio[max(0, nz[0] - 240): nz[-1] + 1200] if len(nz) else audio
    dur = len(audio) / sr
    timings.append({"key": key, "text": caption, "start": round(t, 3), "end": round(t + dur, 3)})
    out += [audio.astype(np.float32), np.zeros(int(sr * gap), dtype=np.float32)]
    t += dur + gap
t += 1.2
out.append(np.zeros(int(sr * 1.2), dtype=np.float32))
sf.write(f"{root}/video/public/andromeda/voice.wav", np.concatenate(out), sr)
json.dump({"total": round(t, 3), "lines": timings}, open(f"{root}/video/src/andromeda/timings.json", "w"), indent=2)
print("TOTAL", round(t, 2))
