"""Procedural surfaces: metre-scaled box UVs and tileable textures from code.

Opt-in per registry entry with "surfaces": {"<CatalogMaterial>": "<kind>"}.
Textures are generated with NumPy (no renderer, no scans, no third-party
images), so rights stay with the repository owner. Each kind yields a colour
map and a tangent-space normal map from the same height field; both tile.

Kinds: stone (honed limestone), oak (quarter-sawn grain), gilt (worn gold
leaf over bole), water (wind ripples; normal only, colour stays flat).
"""
import bpy
import bmesh
import numpy as np

SIZE = 1024


def _octave_noise(size, seed, octaves=6, base=4, persistence=0.55):
    """Tileable value noise: random lattices, wrapped bilinear upsampling."""
    rng = np.random.default_rng(seed)
    out = np.zeros((size, size), np.float32); amp = 1.0; total = 0.0
    for o in range(octaves):
        n = base * 2 ** o
        if n >= size: break
        lattice = rng.random((n, n), dtype=np.float32)
        # Wrapped bilinear interpolation keeps the result periodic.
        x = np.arange(size, dtype=np.float32) * n / size
        i0 = np.floor(x).astype(int) % n; i1 = (i0 + 1) % n; t = x - np.floor(x)
        t = t * t * (3 - 2 * t)
        rows = lattice[i0][:, i0] * (1 - t)[None, :] + lattice[i0][:, i1] * t[None, :]
        rows2 = lattice[i1][:, i0] * (1 - t)[None, :] + lattice[i1][:, i1] * t[None, :]
        out += (rows * (1 - t)[:, None] + rows2 * t[:, None]) * amp
        total += amp; amp *= persistence
    return out / total


def _normal_from_height(h, strength):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    n = np.stack([-dx, -dy, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n * 0.5 + 0.5


def _mix(a, b, t):
    t = np.clip(t, 0, 1)[..., None]
    return np.array(a, np.float32) * (1 - t) + np.array(b, np.float32) * t


def generate(kind, seed=1, size=SIZE):
    """Return (colour RGB float array or None, normal RGB float array)."""
    if kind == 'stone':
        body = _octave_noise(size, seed, 7, 3)
        speck = (_octave_noise(size, seed + 1, 3, 96, 0.4) > 0.66).astype(np.float32)
        vein = np.abs(np.sin((_octave_noise(size, seed + 2, 5, 2) * 9.0) * np.pi))
        vein = np.clip(1 - vein * 7.0, 0, 1) * 0.55
        col = _mix((0.70, 0.66, 0.59), (0.82, 0.79, 0.72), body)
        col = col * (1 - 0.10 * speck[..., None]) - 0.12 * vein[..., None]
        height = body * 0.6 + vein * 0.25 - speck * 0.15
        return np.clip(col, 0, 1), _normal_from_height(height, 2.4)
    if kind == 'oak':
        warp = _octave_noise(size, seed, 5, 2)
        y = np.linspace(0, 1, size, endpoint=False, dtype=np.float32)[:, None]
        grain = 0.5 + 0.5 * np.sin((y * 46 + warp * 3.2) * 2 * np.pi)
        fleck = (_octave_noise(size, seed + 3, 3, 64, 0.5) > 0.7).astype(np.float32)
        col = _mix((0.36, 0.22, 0.11), (0.55, 0.37, 0.2), grain * 0.7 + warp * 0.3)
        col = col + 0.06 * fleck[..., None]
        return np.clip(col, 0, 1), _normal_from_height(grain * 0.5 + fleck * 0.2, 1.6)
    if kind == 'gilt':
        wear = _octave_noise(size, seed, 6, 16, 0.6)
        bole = np.clip((wear - 0.70) * 9, 0, 1) * 0.8   # fine, rare wear: red clay ground through the leaf
        leaf = _octave_noise(size, seed + 5, 4, 48, 0.5)
        col = _mix((0.66, 0.50, 0.22), (0.78, 0.62, 0.30), leaf)
        col = col * (1 - bole[..., None]) + np.array((0.42, 0.17, 0.08), np.float32) * bole[..., None]
        return np.clip(col, 0, 1), _normal_from_height(leaf * 0.3 - bole * 0.4, 1.4)
    if kind == 'water':
        ripple = _octave_noise(size, seed, 6, 6, 0.6)
        return None, _normal_from_height(ripple, 3.0)
    raise ValueError(f'unknown surface kind {kind!r}')


def _image(name, rgb, colorspace):
    h, w, _ = rgb.shape
    img = bpy.data.images.new(name, w, h, alpha=False)
    rgba = np.concatenate([rgb, np.ones((h, w, 1), np.float32)], -1)
    # Colour space first: changing it on a generated image regenerates (blanks) it.
    img.colorspace_settings.name = colorspace
    img.pixels.foreach_set(rgba.astype(np.float32).ravel()); img.update()
    # A generated image packs its blank original unless it is first saved as a
    # real PNG; save to a private temp file, pack the bytes, drop the path.
    import os, tempfile
    path = os.path.join(tempfile.mkdtemp(prefix='procassets-'), name + '.png')
    img.filepath_raw = path; img.file_format = 'PNG'; img.save(); img.pack()
    return img


def box_uv(obj, metres=0.5):
    """Cube-project UVs in object space: one texture tile per `metres`."""
    bm = bmesh.new(); bm.from_mesh(obj.data)
    # Normal maps need exported tangents, which Blender cannot compute on n-gons.
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal; ax = max(range(3), key=lambda k: abs(n[k]))
        for loop in f.loops:
            co = loop.vert.co
            u, v = [(co.y, co.z), (co.x, co.z), (co.x, co.y)][ax]
            loop[uv].uv = (u / metres, v / metres)
    bm.to_mesh(obj.data); bm.free()


def apply(material, kind, seed=1, size=SIZE):
    """Wire generated maps into a Principled material (glTF-exportable)."""
    col, nrm = generate(kind, seed, size)
    nt = material.node_tree; p = nt.nodes['Principled BSDF']
    if col is not None:
        tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = _image(f'{material.name}_{kind}_colour', col, 'sRGB')
        nt.links.new(tex.outputs['Color'], p.inputs['Base Color'])
    ntex = nt.nodes.new('ShaderNodeTexImage'); ntex.image = _image(f'{material.name}_{kind}_normal', nrm, 'Non-Color')
    nmap = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(ntex.outputs['Color'], nmap.inputs['Color'])
    nt.links.new(nmap.outputs['Normal'], p.inputs['Normal'])
