# Wine Barrel Explainer

A 25 second vertical (1080x1920) 3D explainer video, "How to hide in a wine barrel (from the Nazis)", built entirely from code.

Final video is at `out/wine-barrel-explainer.mp4`.

## Stack

| Job | Tool |
| --- | --- |
| Video engine | [Remotion](https://github.com/remotion-dev/remotion) (React, frame-accurate rendering) |
| 3D | [Three.js](https://github.com/mrdoob/three.js) + [React Three Fiber](https://github.com/pmndrs/react-three-fiber) + [drei](https://github.com/pmndrs/drei) via `@remotion/three` |
| Voice | [Kokoro 82M](https://github.com/thewh1teagle/kokoro-onnx) (ONNX, CPU), voices `bm_george` and `am_onyx` |
| Extra voice option | [Piper TTS](https://github.com/OHF-Voice/piper1-gpl) (installed, not used in the final cut) |
| Python editing | [MoviePy](https://github.com/Zulko/moviepy) (installed), NumPy for the synthesized music and SFX |
| Encoding | FFmpeg (loudness normalized to -14 LUFS) |

## Rebuild

```bash
python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile moviepy piper-tts
# download kokoro-v1.0.onnx and voices-v1.0.bin from the kokoro-onnx GitHub release into tts/
.venv/bin/python scripts/make_voice.py "$PWD"       # narration + timings.json
.venv/bin/python scripts/make_audio_mix.py "$PWD"   # music bed, knocks, cork pop, mix
cd video && npm install
npx remotion studio src/index.ts                     # live preview
npx remotion render src/index.ts BarrelVideo ../out/wine-barrel-explainer.mp4 --gl=swangle
```

All scene timing is driven by `video/src/timings.json`, so editing the script lines in `make_voice.py` and re-running the steps re-syncs the animation automatically.
