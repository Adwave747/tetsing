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

---

# Andromeda 2.0 Explainer (Adwave)

A 90 second vertical (1080x1920) info explainer on Meta's next-generation Andromeda (published October 28, 2026) and the Creative Diversity rating in Ads Manager, told with a lake and fishing analogy. Script and sources are in `andromeda-script.md`.

Final video is at `out/andromeda-2-explainer.mp4`. It uses the same stack as above, with the Kokoro voice `am_michael`.

## Rebuild

```bash
.venv/bin/python scripts/andromeda_voice.py "$PWD" am_michael 1.05   # narration + video/src/andromeda/timings.json
.venv/bin/python scripts/andromeda_mix.py "$PWD"                     # music bed, SFX, mix
cd video
npx remotion studio src/index.ts                                     # live preview, pick AndromedaVideo
npx remotion render src/index.ts AndromedaVideo ../out/andromeda-raw.mp4 --gl=swangle
ffmpeg -i ../out/andromeda-raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k ../out/andromeda-2-explainer.mp4
```

To change the voice, pass another Kokoro voice name (for example `af_heart` or `bm_george`) to `andromeda_voice.py`, then re-run the mix and render. All animation timing follows `timings.json`, so it re-syncs automatically.

The ending uses a plain "Adwave" text wordmark as a placeholder. Swap in the real logo and colours in `video/src/andromeda/Overlay.tsx` (the `Adwave` and `Cta` components) and the palette `C` in `video/src/andromeda/tl.ts`.

---

# Andromeda 2.0 Infographic Explainer (Adwave)

The same topic as above, told as a flat 2D motion infographic (funnel, timeline, stat tiles, architecture diagram, mock Ads Manager table) instead of an analogy. About 89 seconds, 1080x1920. Script and sources are in `andromeda-infographic-script.md`. No Three.js, so it renders without `--gl`.

Final video is at `out/andromeda-infographic.mp4`.

```bash
.venv/bin/python scripts/tts.py "$PWD" scripts/infographic_lines.json video/public/infographic/voice.wav video/src/infographic/timings.json am_michael 1.05
.venv/bin/python scripts/infographic_mix.py "$PWD"
cd video && npx remotion render src/index.ts InfographicVideo ../out/andromeda-infographic-raw.mp4
ffmpeg -i ../out/andromeda-infographic-raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k ../out/andromeda-infographic.mp4
```

The narration lines live in `scripts/infographic_lines.json` as `[key, spoken text, caption text, pause after]`. The placeholder Adwave wordmark is in the `Adwave` and `End` components of `video/src/infographic/Infographic.tsx`.
