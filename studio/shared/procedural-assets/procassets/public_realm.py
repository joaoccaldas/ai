"""Public-realm and service assets (Gaudí asset-library contract IDs). Each returns a bmesh; face.material_index indexes the registry material list."""
import math, random
import bmesh
from mathutils import Vector
from .geom import box, cyl, lathe, arc_tube

def public_bin(h=0.95, d=0.42):   # mats: 0 cast iron, 1 steel
    bm = bmesh.new(); lathe(bm, [(d/2, 0.0), (d/2, h*0.85), (d/2*1.06, h*0.88), (d/2*1.06, h*0.93), (d/2*0.5, h*1.0), (0.0, h*1.0)], 28, 0)
    cyl(bm, (0, 0, h*0.35), (0, 0, h*0.37), d/2*1.03, d/2*1.03, 28, 1); cyl(bm, (0, 0, h*0.62), (0, 0, h*0.64), d/2*1.03, d/2*1.03, 28, 1)
    box(bm, (0, d/2*0.98, h*0.72), (0.2, 0.01, 0.1), 0, 1); return bm
def bike_rack_5(n=5, pitch=0.7, h=0.85, w=0.5):  # mat 0 steel
    bm = bmesh.new()
    for i in range(n):
        x = (i - (n - 1) / 2) * pitch; r = w / 2
        cyl(bm, (x - r, 0, 0), (x - r, 0, h - r), 0.021, 0.021, 10); cyl(bm, (x + r, 0, 0), (x + r, 0, h - r), 0.021, 0.021, 10)
        arc_tube(bm, (x, 0, h - r), r, 0, math.pi, 0.021, 12)
        for s in (-1, 1): box(bm, (x + s * r, 0, 0.005), (0.1, 0.1, 0.01))
    return bm
def bollard(h=0.9, d=0.16):    # mats: 0 iron, 1 reflective band
    bm = bmesh.new(); lathe(bm, [(d/2, 0), (d/2, h*0.9), (d/2*0.8, h*0.97), (d/2*0.4, h), (0, h)], 20, 0); cyl(bm, (0, 0, h*0.7), (0, 0, h*0.76), d/2*1.01, d/2*1.01, 20, 1); return bm
def drinking_fountain(h=0.95):   # mats: 0 concrete, 1 steel
    bm = bmesh.new(); box(bm, (0, 0, h*0.4), (0.3, 0.3, h*0.8), 0, 0); lathe(bm, [(0.17, h*0.8), (0.19, h*0.84), (0.16, h*0.9), (0.0, h*0.88)], 24, 1)
    cyl(bm, (0, -0.06, h*0.9), (0, -0.06, h*1.05), 0.012, 0.012, 8, 1); cyl(bm, (0, -0.06, h*1.05), (0, 0.04, h*1.04), 0.012, 0.012, 8, 1); return bm
def tree_grate_small(s=1.0):     # mat 0 cast iron
    bm = bmesh.new()
    for ring_r in (0.18, 0.3, 0.42):
        arc_tube(bm, (0, 0, 0.015), ring_r, 0, 2 * math.pi, 0.012, 28, 'XY')
    for k in range(8):
        a = k * math.pi / 4; box(bm, (math.cos(a)*0.3, math.sin(a)*0.3, 0.015), (0.5, 0.025, 0.03), a)
    for sx in (-1, 1): box(bm, (sx*(s/2-0.015), 0, 0.015), (0.03, s, 0.03)); box(bm, (0, sx*(s/2-0.015), 0.015), (s, 0.03, 0.03))
    return bm
def low_planter(w=1.2, d=0.6, h=0.45):   # mats: 0 concrete, 1 soil, 2 foliage
    bm = bmesh.new(); t = 0.06
    box(bm, (0, d/2-t/2, h/2), (w, t, h), 0, 0); box(bm, (0, -d/2+t/2, h/2), (w, t, h), 0, 0); box(bm, (w/2-t/2, 0, h/2), (t, d-2*t, h), 0, 0); box(bm, (-w/2+t/2, 0, h/2), (t, d-2*t, h), 0, 0)
    box(bm, (0, 0, h*0.82), (w-2*t, d-2*t, 0.04), 0, 1)
    r = random.Random(3)
    for i in range(46):
        x = r.uniform(-w/2+0.1, w/2-0.1); y = r.uniform(-d/2+0.1, d/2-0.1); L = r.uniform(0.12, 0.3); a = r.uniform(0, 6.28)
        cyl(bm, (x, y, h*0.84), (x+math.cos(a)*L*0.35, y+math.sin(a)*L*0.35, h*0.84+L), 0.008, 0.002, 4, 2)
    return bm
def community_table(L=4.8, d=1.0, h=0.8):  # mats: 0 timber, 1 steel
    bm = bmesh.new(); box(bm, (0, 0, h-0.05), (L, d, 0.1), 0, 0)
    for sx in (-L/2+0.4, L/2-0.4):
        for sy in (-d/2+0.1, d/2-0.1): cyl(bm, (sx, sy, 0), (sx, sy, h-0.1), 0.04, 0.035, 8, 1)
        box(bm, (sx, 0, h-0.12), (0.06, d-0.1, 0.05), 0, 1)
    return bm
def queue_rail(L=2.6, h=1.0):   # mat 0 steel
    bm = bmesh.new()
    for x in (-L/2, L/2): cyl(bm, (x, 0, 0.012), (x, 0, h), 0.025, 0.02, 10); lathe(bm, [(0.17, 0), (0.17, 0.015), (0.04, 0.03), (0, 0.03)], 16, 0, center=(x, 0, 0))
    for z in (h*0.95, h*0.55): cyl(bm, (-L/2, 0, z), (L/2, 0, z), 0.012, 0.012, 8, 0)
    return bm
def tactile_tile(s=0.3, n=6):   # mat 0 ceramic
    bm = bmesh.new(); box(bm, (0, 0, 0.01), (s, s, 0.02), 0, 0); pitch = s / n
    for i in range(n):
        for j in range(n): x = (i + 0.5) * pitch - s/2; y = (j + 0.5) * pitch - s/2; cyl(bm, (x, y, 0.02), (x, y, 0.027), 0.0125, 0.008, 10, 0)
    return bm
def floor_drain_channel(L=1.0, w=0.12):  # mats: 0 steel grate, 1 dark channel
    bm = bmesh.new(); box(bm, (0, 0, -0.01), (L, w, 0.02), 0, 1)
    for k in range(int(L / 0.035)): box(bm, (-L/2 + 0.02 + k * 0.035, 0, 0.005), (0.012, w * 0.9, 0.02), 0, 0)
    for sy in (-1, 1): box(bm, (0, sy * (w/2 - 0.006), 0.005), (L, 0.012, 0.022), 0, 0)
    return bm
def wayfinding_totem(h=2.4, w=0.5, d=0.18):  # mats: 0 concrete body, 1 steel, 2 sign panel
    bm = bmesh.new(); box(bm, (0, 0, h/2), (w, d, h), 0, 0); box(bm, (0, d/2+0.004, h*0.82), (w*0.8, 0.008, 0.5), 0, 2); box(bm, (0, d/2+0.004, h*0.55), (w*0.8, 0.008, 0.25), 0, 2); box(bm, (0, 0, 0.02), (w+0.06, d+0.06, 0.04), 0, 1); return bm
def market_sign_blade(w=0.7, h=0.55):   # mats: 0 steel bracket, 1 panel
    bm = bmesh.new(); box(bm, (0.35, 0, 0), (w, 0.04, h), 0, 1); cyl(bm, (-0.05, 0, h*0.35), (0.45, 0, h*0.35), 0.012, 0.012, 8, 0); cyl(bm, (-0.05, 0, -h*0.35), (0.45, 0, h*0.35), 0.01, 0.01, 8, 0)
    box(bm, (-0.06, 0, 0), (0.04, 0.08, h*1.1), 0, 0)
    for z in (-h/2-0.04, h/2+0.04): cyl(bm, (0.35, 0, z), (0.35, 0, z + (0.04 if z < 0 else -0.04)), 0.006, 0.006, 6, 0)
    return bm
def handwash_station(h=0.9):    # mats: 0 ceramic, 1 steel
    bm = bmesh.new(); cyl(bm, (0, 0, 0), (0, 0, h*0.78), 0.06, 0.05, 14, 0); lathe(bm, [(0.14, h*0.78), (0.24, h*0.82), (0.22, h*0.9), (0.18, h*0.88), (0.0, h*0.84)], 28, 0)
    cyl(bm, (0, 0.14, h*0.9), (0, 0.14, h*1.1), 0.012, 0.012, 8, 1); cyl(bm, (0, 0.14, h*1.1), (0, 0.04, h*1.1), 0.012, 0.012, 8, 1); box(bm, (0, 0.06, h*0.95), (0.04, 0.04, 0.04), 0, 1); return bm
def waste_sorting_station(w=1.5, d=0.6, h=1.1):  # mats: 0 steel frame, 1 green, 2 blue, 3 yellow
    bm = bmesh.new()
    for i, mi in enumerate((1, 2, 3)):
        x = (i - 1) * (w / 3); box(bm, (x, 0, h*0.38), (w/3-0.05, d-0.1, h*0.76), 0, mi); box(bm, (x, 0, h*0.78), (w/3-0.03, d-0.07, 0.04), 0, 0); box(bm, (x, d/2-0.04, h*0.7), (0.18, 0.02, 0.08), 0, 0)
    for sx in (-w/2, w/2): box(bm, (sx, 0, h*0.4), (0.04, d, h*0.8), 0, 0)
    return bm
