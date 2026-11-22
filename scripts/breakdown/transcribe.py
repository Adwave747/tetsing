import sys, json
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[3] if len(sys.argv)>3 else "small.en", device="cpu", compute_type="int8")
import soundfile as sf
audio,_sr = sf.read(sys.argv[1], dtype="float32")
segs, _ = m.transcribe(audio, word_timestamps=True, vad_filter=True)
out=[]
for s in segs:
    out.append({"start":s.start,"end":s.end,"text":s.text,"words":[{"w":w.word,"s":w.start,"e":w.end} for w in s.words]})
    print(f"[{s.start:7.1f}] {s.text}", flush=True)
json.dump(out, open(sys.argv[2],"w"))
