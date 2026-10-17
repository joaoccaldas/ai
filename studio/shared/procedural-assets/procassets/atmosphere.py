"""Sky furniture: seeded, stylised cumulus clouds for distant sky layers. Z up, metres.

Stylised, not photoreal: realistic skies and clouds belong to shaders (see the
Norseman dawn sky in KONA). Use these as far silhouettes, scaled and instanced.

Clouds are overlapping displaced shells (no booleans), flattened at the base
like real fair-weather cumulus. Use far from the camera; they are not volumes.
"""
import math, random
import bmesh
from mathutils import Vector, noise

def cloud_cumulus(w=8.0, puffs=30, seed=3, detail=3):   # mat 0 cloud
    r = random.Random(seed); bm = bmesh.new(); base = 0.0
    for k in range(puffs):
        t = k / max(1, puffs - 1)
        x = (t - 0.5) * w * r.uniform(0.8, 1.0); spread = (1 - abs(t - 0.5) * 1.6)
        rad = w * r.uniform(0.09, 0.16) * (0.55 + spread)
        c = Vector((x, r.uniform(-0.18, 0.18) * w * 0.4, base + rad * r.uniform(0.35, 0.95) * (0.6 + spread)))
        g = bmesh.ops.create_icosphere(bm, subdivisions=detail, radius=rad)
        for v in g['verts']:
            p = v.co.copy(); n = noise.noise(p * (3.2 / rad) + Vector((seed, k, 0)))
            v.co = c + p * (1 + 0.07 * n)
            v.co.z = max(v.co.z, base + rad * 0.12)   # flat, slightly lifted base
        for f in {f for v in g['verts'] for f in v.link_faces}: f.material_index = 0; f.smooth = True
    return bm
