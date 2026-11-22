# Find offset so that loom_time = cam_time + offset, via FFT cross-correlation of 2kHz-downsampled audio envelopes.
import sys, numpy as np, soundfile as sf
from scipy.signal import correlate, resample_poly
def load(p):
    a, sr = sf.read(p, dtype="float32"); a = a if a.ndim == 1 else a.mean(1)
    a = resample_poly(a, 1, sr // 2000)  # 2 kHz
    a = a - np.convolve(a, np.ones(40)/40, "same")   # high-pass-ish
    return a / (np.std(a) + 1e-9)
L, C = load(sys.argv[1]), load(sys.argv[2])
c = correlate(L, C, mode="full", method="fft")
lag = np.argmax(c) - (len(C) - 1)
peak = c.max() / np.sqrt(len(C)); second = np.sort(c)[-200] / np.sqrt(len(C))
print(f"offset_s={lag/2000:.3f} peak={peak:.1f} ref={second:.1f}")
