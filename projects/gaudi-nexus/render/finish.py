"""Photographic finishing pass for rendered frames (post only; geometry and lighting untouched).

  python3 finish.py in.png out.png [--seed N]

Steps: highlight bloom + warm halation, radial vignette, slight lateral chromatic aberration,
filmic tone curve with lifted blacks, shadow-weighted film grain. Parameters below are the
declared look; disclose "photographic finishing applied" in captions if required.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

P = dict(bloom_thresh=0.72, bloom_radius=22, bloom_gain=0.20, halation_tint=(1.0, 0.82, 0.62), halation_gain=0.07,
         vignette=0.20, ca_px=1.1, black_lift=0.012, contrast=1.10, saturation=0.96, grain=0.011)

def finish(src, dst, seed=7):
    rng = np.random.default_rng(seed)
    im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.float32) / 255.0; h, w, _ = a.shape
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])
    hi = np.clip((lum - P['bloom_thresh']) / (1 - P['bloom_thresh']), 0, 1)[..., None] * a
    hi_img = Image.fromarray((np.clip(hi, 0, 1) * 255).astype(np.uint8))
    bl = np.asarray(hi_img.filter(ImageFilter.GaussianBlur(P['bloom_radius']))).astype(np.float32) / 255.0
    bl2 = np.asarray(hi_img.filter(ImageFilter.GaussianBlur(P['bloom_radius'] * 2.6))).astype(np.float32) / 255.0
    a = a + P['bloom_gain'] * bl + P['halation_gain'] * bl2 * np.array(P['halation_tint'], np.float32)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32); r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    a *= (1 - P['vignette'] * np.clip(r - 0.35, 0, None) ** 1.6)[..., None]
    # lateral chromatic aberration: every channel is scaled UP (R most, B none) and centre-cropped, so no gaps appear at the edges
    out = a.copy(); e = P['ca_px'] / w
    for ch, s in ((0, 1 + 2 * e), (1, 1 + e), (2, 1.0)):
        c = Image.fromarray((np.clip(a[..., ch], 0, 1) * 255).astype(np.uint8))
        if s > 1.0:
            nw, nh = int(round(w * s)), int(round(h * s)); c = c.resize((nw, nh), Image.BICUBIC); l, t = (nw - w) // 2, (nh - h) // 2; c = c.crop((l, t, l + w, t + h))
        out[..., ch] = np.asarray(c).astype(np.float32) / 255.0
    a = out
    a = np.clip(a, 0, 1)
    a = P['black_lift'] + (1 - P['black_lift']) * a                                   # lifted blacks
    a = 0.5 + (a - 0.5) * P['contrast']; a = np.clip(a, 0, 1)
    a = a * a * (3 - 2 * a) * 0.35 + a * 0.65                                          # gentle S-curve
    g = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    a = g + (a - g) * P['saturation']
    shadow_w = (1.0 - np.clip(g, 0, 1)) * 0.8 + 0.2
    n = rng.normal(0, 1, (h, w, 1)).astype(np.float32); nc = rng.normal(0, 0.35, (h, w, 3)).astype(np.float32)
    a = a + (n + nc) * P['grain'] * shadow_w
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).save(dst)

if __name__ == '__main__':
    seed = int(sys.argv[sys.argv.index('--seed') + 1]) if '--seed' in sys.argv else 7
    finish(sys.argv[1], sys.argv[2], seed); print('FINISHED', sys.argv[2])
