# Build one breakdown video's media from an edit list (EDL).
# Writes public/bd/<id>/{cam.mp4,top.mp4,audio.wav} and src/breakdown/data/<id>.json
import cv2, json, sys, subprocess, os, numpy as np, soundfile as sf

W = "/tmp/claude-0/work"
REPO = "/home/user/tetsing/video"
FPS, TW, TH = 30, 1080, 960
SR = 48000
CAMS = {  # working copies and where they start in the original camera file (for transcript lookup)
    "cam1": (f"{W}/cam/cam1_a.mov", "raw1", 0.0),
    "intro": (f"{W}/cam/cam3_intro.mov", "raw3", 255.0),
    "cta": (f"{W}/cam/cam3_cta.mov", "raw3", 500.0),
    "cam2": (f"{W}/cam/cam2.mov", "raw2", 0.0),
}
TX = {}
def words(raw):
    if raw not in TX:
        TX[raw] = [w for s in json.load(open(f"{W}/{raw}.json")) for w in s["words"]]
    return TX[raw]

def run(*a): subprocess.run(a, check=True)

class Ad:
    def __init__(self, path):
        cap = cv2.VideoCapture(path); self.fps = cap.get(5); self.frames = []
        while True:
            ok, f = cap.read()
            if not ok: break
            self.frames.append(f)
        self.dur = len(self.frames) / self.fps
        h, w = self.frames[0].shape[:2]
        fh = TH - 150; fw = int(round(fh * w / h)); fw -= fw % 2
        if fw > TW - 80: fw = TW - 80; fh = int(round(fw * h / w))
        self.fw, self.fh, self.x0, self.y0 = fw, fh, (TW - fw) // 2, 120 + (TH - 150 - fh) // 2
        m = np.zeros((fh, fw), np.uint8); r = 34
        cv2.rectangle(m, (r, 0), (fw - r, fh), 255, -1); cv2.rectangle(m, (0, r), (fw, fh - r), 255, -1)
        for cx, cy in [(r, r), (fw - r, r), (r, fh - r), (fw - r, fh - r)]: cv2.circle(m, (cx, cy), r, 255, -1, cv2.LINE_AA)
        self.mask = (m.astype(np.float32) / 255)[..., None]
        sh = np.zeros((TH, TW), np.float32); sh[self.y0 + 14:self.y0 + fh + 14, self.x0:self.x0 + fw] = self.mask[..., 0]
        self.shadow = cv2.GaussianBlur(sh, (0, 0), 22)[..., None] * 0.65
        tmp = f"{W}/tmp_ad.wav"; run("ffmpeg", "-v", "error", "-y", "-i", path, "-ac", "2", "-ar", str(SR), tmp)
        self.audio, _ = sf.read(tmp, dtype="float32")
    def render(self, t):
        f = self.frames[int(np.clip(round(t * self.fps), 0, len(self.frames) - 1))]
        h, w = f.shape[:2]
        bg = cv2.resize(f, (TW // 8, int(TW * h / w) // 8)); oy = max(0, (bg.shape[0] - TH // 8) // 2)
        bg = cv2.resize(bg[oy:oy + TH // 8], (TW // 8, TH // 8)); bg = cv2.GaussianBlur(bg, (0, 0), 3)
        bg = cv2.resize(bg, (TW, TH)).astype(np.float32) * 0.42 * (1 - self.shadow)
        fg = cv2.resize(f, (self.fw, self.fh), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
        roi = bg[self.y0:self.y0 + self.fh, self.x0:self.x0 + self.fw]
        bg[self.y0:self.y0 + self.fh, self.x0:self.x0 + self.fw] = roi * (1 - self.mask) + fg * self.mask
        return np.clip(bg, 0, 255).astype(np.uint8)

def loom_map(path):
    m = json.load(open(path)); ts = np.array([r["t"] for r in m]); at = np.array([r["ad_t"] for r in m]); sc = np.array([r["score"] for r in m])
    for i in range(1, len(at)):
        if sc[i] < 0.6: at[i] = at[i - 1]
    def f(t):
        i = int(np.clip(np.searchsorted(ts, t) - 1, 0, len(ts) - 2)); fr = (t - ts[i]) / (ts[i + 1] - ts[i]); d = at[i + 1] - at[i]
        if 0.08 <= d <= 0.5: return at[i] + fr * d, True
        return (at[i] if fr < 0.5 else at[i + 1]), False
    return f

def main(edl_path):
    E = json.load(open(edl_path)); vid = E["id"]
    out = f"{REPO}/public/bd/{vid}"; os.makedirs(out, exist_ok=True)
    ads = {}
    def ad(p):
        if p not in ads: ads[p] = Ad(p)
        return ads[p]
    # 1) camera track: trim + concat
    parts = []
    for i, c in enumerate(E["clips"]):
        src = CAMS[c["cam"]][0]; p = f"{W}/tmp_cam_{i}.mp4"; parts.append(p)
        vf = "scale=1080:1920:flags=lanczos"
        run("ffmpeg", "-v", "error", "-y", "-ss", str(c["in"]), "-t", str(c["out"] - c["in"]), "-i", src, "-an", "-vf", vf, "-r", str(FPS), "-c:v", "libx264", "-preset", "fast", "-crf", "17", "-pix_fmt", "yuv420p", p)
    with open(f"{W}/tmp_list.txt", "w") as fl: fl.writelines(f"file '{p}'\n" for p in parts)
    run("ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{W}/tmp_list.txt", "-c", "copy", f"{out}/cam.mp4")
    # 2) top track + ad audio + voice audio + captions
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{TW}x{TH}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", f"{out}/top.mp4"], stdin=subprocess.PIPE)
    voice, adtrack, words_out, layout, cuts = [], [], [], [], []
    starts = []
    T = 0.0; black = np.zeros((TH, TW, 3), np.uint8); last = black
    for c in E["clips"]:
        dur = c["out"] - c["in"]; n = int(round(dur * FPS)); spf = SR // FPS
        top = c.get("top"); A = ad(top["ad"]) if top else None
        fmap = loom_map(top["map"]) if top and top["kind"] == "map" else None
        va = np.zeros((n * spf, 2), np.float32); aa = np.zeros((n * spf, 2), np.float32); play = np.zeros(n * spf, np.float32)
        # voice from the camera working copy
        tmp = f"{W}/tmp_v.wav"; run("ffmpeg", "-v", "error", "-y", "-ss", str(c["in"]), "-t", str(dur), "-i", CAMS[c["cam"]][0], "-vn", "-ac", "2", "-ar", str(SR), tmp)
        v, _ = sf.read(tmp, dtype="float32"); va[:min(len(v), len(va))] = v[:len(va)] * c.get("voice_gain", 1.0)
        for k in range(n):
            t = c["in"] + k / FPS
            if not top: frame = last if c["mode"] == "full" else black
            else:
                if fmap: at, pl = fmap(t + top["offset"])
                elif top["kind"] == "play": at = (top["ad_in"] + (t - c["in"]) * top.get("speed", 1.0)) % A.dur; pl = True
                else: at, pl = top["ad_in"], False
                frame = A.render(at); last = frame
                if pl and c.get("ad_audio", True):
                    s = int(at * SR); seg = A.audio[s:s + spf]; aa[k * spf:k * spf + len(seg)] = seg; play[k * spf:k * spf + spf] = 1
            ff.stdin.write(frame.tobytes())
        env = np.convolve(play, np.ones(480) / 480, "same")
        adtrack.append(aa * env[:, None] * c.get("ad_gain", 0.9)); voice.append(va)
        if c.get("captions", True):
            raw, base = CAMS[c["cam"]][1], CAMS[c["cam"]][2]
            for w in words(raw):
                s, e = w["s"] - base, w["e"] - base
                if s >= c["in"] - 0.05 and e <= c["out"] + 0.1:
                    ww = w["w"].strip(); fx = E.get("fix", {})
                    if ww in fx: ww = fx[ww]
                    if not ww or ww == ".": continue
                    words_out.append({"w": ww, "s": round(T + max(0, s - c["in"]), 3), "e": round(T + min(dur, e - c["in"]), 3)})
        starts.append((c["cam"], c["in"], c["out"], T))
        layout.append({"s": round(T, 3), "e": round(T + dur, 3), "mode": c["mode"]})
        if T > 0: cuts.append(round(T, 3))
        T += n / FPS
    ff.stdin.close(); ff.wait()
    V, Aa = np.concatenate(voice), np.concatenate(adtrack)
    sf.write(f"{W}/tmp_voice.wav", V, SR); sf.write(f"{W}/tmp_adtrack.wav", Aa, SR)
    # voice: light cleanup + compression; ad audio ducked under voice; master to -14 LUFS
    run("ffmpeg", "-v", "error", "-y", "-i", f"{W}/tmp_voice.wav", "-i", f"{W}/tmp_adtrack.wav", "-filter_complex",
        "[0:a]highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-2,asplit=2[vo1][vo2];"
        "[1:a]loudnorm=I=-18:TP=-2[adn];[adn][vo1]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[duck];"
        "[vo2][duck]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), f"{out}/audio.wav")
    # merge contiguous identical layouts
    lay = []
    for s in layout:
        if lay and lay[-1]["mode"] == s["mode"]: lay[-1]["e"] = s["e"]
        else: lay.append(s)
    def conv(cam, t):
        for cm, a, b, t0 in starts:
            if cm == cam and a <= t < b: return round(t0 + t - a, 3)
        raise ValueError(f"time {cam}@{t} not in any clip")
    callouts = []
    for co in E.get("callouts", []):
        s0 = conv(*co["src"]); callouts.append({"s": s0, "e": round(s0 + co.get("dur", 2.6), 3), "text": co["text"], "kind": co.get("kind", "info")})
    if "score" in E: E["score"] = {"at": conv(*E["score"]["src"]), "value": E["score"]["value"]}
    E["callouts"] = callouts
    data = {"id": vid, "brand": E["brand"], "format": E["format"], "duration": round(T, 3), "layout": lay, "cuts": cuts, "words": words_out,
            "callouts": E.get("callouts", []), "camY": E.get("camY", 560), **({"score": E["score"]} if "score" in E else {})}
    json.dump(data, open(f"{REPO}/src/breakdown/data/{vid}.json", "w"), indent=1)
    print("built", vid, round(T, 1), "s")

if __name__ == "__main__":
    main(sys.argv[1])
