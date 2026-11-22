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

# Ad Breakdown Reels

Vertical (1080x1920) split-screen ad breakdowns in the style of a creator reaction reel. The ad plays on top, Nick is on the bottom, and word-by-word captions sit on the seam. Finished videos are in `out/breakdowns/`.

| Video | Ad source | Camera source |
| --- | --- | --- |
| `recreation-beauty.mp4` | Atria `m864824709540191` | camera file 1 |
| `moonbird.mp4` | Atria `m1192567819411666` | camera file 1 |
| `hears.mp4` | Atria `m4639843856295938` | camera file 1 |

## Pipeline (`scripts/breakdown/`)

1. `atria_find_video.js` opens each Atria ad page in headless Chromium, presses play and records the ad's video URL.
2. `transcribe.py` runs faster-whisper (word timestamps) on the camera audio, the Loom and each ad.
3. `admap.py` maps every moment of the Loom screen recording to the matching frame of the original ad (OpenCV template matching), so pauses and replays line up. `align.py` does the same from transcripts when the ad audio was picked up by the mic.
4. `edl/*.json` are the hand-made edit lists: camera in and out points, split or full screen, what the ad does, callouts and ratings.
5. `assemble.py` cuts the camera track, renders the ad track on a blurred backdrop, mixes voice and clean ad audio (ducked, -14 LUFS) and writes caption data.
6. `video/src/breakdown/AdBreakdown.tsx` is the Remotion composition. Render with
   `npx remotion render src/index.ts <id> ../out/breakdowns/<id>.mp4 --browser-executable=<chrome> --gl=swangle`.
