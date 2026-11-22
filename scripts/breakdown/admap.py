# For a Loom time range, find which ad timestamp is visible each 0.25s (or None).
import cv2, numpy as np, sys, json
loom, ad, t0, t1, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
S = 0.25  # loom downscale
# player width in loom px is ~394 (atria) or ~427 (fb); estimate from aspect
cap = cv2.VideoCapture(ad); fps = cap.get(5); W = cap.get(3); H = cap.get(4)
pw = float(sys.argv[6]) if len(sys.argv) > 6 else 394
tw = int(round(pw * S)); th = int(round(pw * H / W * S))
tpl, ttimes = [], []
i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    if i % max(1, int(round(fps / 8))) == 0:
        g = cv2.cvtColor(cv2.resize(f, (tw, th), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        tpl.append(g); ttimes.append(i / fps)
    i += 1
# central crop of templates avoids player UI overlays
cy0, cy1 = int(th * .15), int(th * .80); cx0, cx1 = int(tw * .1), int(tw * .9)
lc = cv2.VideoCapture(loom); lfps = lc.get(5)
res = []
t = t0
while t < t1:
    lc.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, f = lc.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(f, None, fx=S, fy=S, interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    best = (-1, None, None)
    for k in range(0, len(tpl), 2):
        r = cv2.matchTemplate(g, tpl[k][cy0:cy1, cx0:cx1], cv2.TM_CCOEFF_NORMED)
        _, mv, _, ml = cv2.minMaxLoc(r)
        if mv > best[0]: best = (mv, k, ml)
    # refine around best k at fixed location
    mv, k, (x, y) = best
    for kk in range(max(0, k - 2), min(len(tpl), k + 3)):
        r = cv2.matchTemplate(g[max(0,y-3):y+cy1-cy0+3, max(0,x-3):x+cx1-cx0+3], tpl[kk][cy0:cy1, cx0:cx1], cv2.TM_CCOEFF_NORMED)
        v = r.max()
        if v > mv: mv, k = v, kk
    res.append({"t": round(t, 2), "score": round(float(mv), 3), "ad_t": round(ttimes[k], 3), "x": x / S, "y": y / S})
    print(res[-1], flush=True)
    t += 0.25
json.dump(res, open(out, "w"))
