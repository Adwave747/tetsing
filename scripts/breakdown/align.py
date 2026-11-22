# Find spans where the camera transcript contains the ad's own words; report cam->ad offset per span.
import json, sys, re
cam, ad, a, b = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
cw = [w for s in json.load(open(cam)) for w in s["words"] if a <= w["s"] < b]
aw = [w for s in json.load(open(ad)) for w in s["words"]]
A = [norm(w["w"]) for w in aw]; hits = []
for i in range(len(cw) - 2):
    tri = [norm(cw[i + k]["w"]) for k in range(3)]
    for j in range(len(A) - 2):
        if A[j:j + 3] == tri: hits.append((cw[i]["s"], aw[j]["s"], cw[i + 2]["e"]))
spans = []
for cs, as_, ce in hits:
    off = cs - as_
    if spans and abs(spans[-1][2] - off) < 0.6 and cs - spans[-1][1] < 3: spans[-1][1] = ce
    else: spans.append([cs, ce, off])
for s in spans: print(f"cam {s[0]:7.2f}-{s[1]:7.2f}  ad {s[0]-s[2]:6.2f}-{s[1]-s[2]:6.2f}  offset {s[2]:.2f}")
