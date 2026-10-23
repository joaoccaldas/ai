"""Geometry-only checks for the optional backed garden; never renders.

Run in factory Blender, with an optional NEW JSON output after --.
Checks deliberately separate geometry from ergonomics/visual acceptance.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from studio.scene_kit.landscape import planted_island
from studio.scene_kit.materials import surface


def fingerprint(obj):
    return hashlib.sha256(repr((
        [tuple(v.co) for v in obj.data.vertices],
        [(tuple(p.vertices), p.material_index) for p in obj.data.polygons]
    )).encode()).hexdigest()


def run():
    coll = bpy.data.collections.new('GardenGeometryChecks')
    bpy.context.scene.collection.children.link(coll)
    mats = [surface('CheckGarden_' + str(i), (.3, .3, .3), .8)[0]
            for i in range(7)]
    params = dict(seed=1200, length=18, width=7, seat_slats=110,
                  tufts=0, grounded=True)
    # Compare the opt-out against the pinned, committed owning implementation.
    code = subprocess.check_output(['git', '-C', str(ROOT), 'show',
                                   '074d33d:studio/scene_kit/landscape.py'], text=True)
    namespace = {'__package__': 'studio.scene_kit'}
    exec(compile(code, '<pinned-landscape-074d33d>', 'exec'), namespace)
    legacy = namespace['planted_island']('Legacy', coll, mats, **params)
    current = planted_island('Default', coll, mats, **params)
    assert fingerprint(legacy) == fingerprint(current), 'Default geometry drift'
    detail = planted_island('Detail', coll, mats, backed=True, **params)
    bpy.context.view_layer.update()
    assert all(p.area > 1e-10 for p in detail.data.polygons)
    assert all(all(abs(x) < 100 for x in v.co) for v in detail.data.vertices)
    wood = [p for p in detail.data.polygons if p.material_index == 2]
    assert len(wood) == (110 + 3 * 109) * 6
    # Every seat slat / back rail has six outward faces. Format validation alone
    # cannot detect a consistently inside-out cuboid.
    minimum_dot = float('inf')
    for start in range(0, len(wood), 6):
        faces = wood[start:start + 6]
        center = sum((p.center for p in faces), Vector()) / 6
        for p in faces:
            dot = p.normal.dot(p.center - center)
            assert dot > 1e-7, ('Inward timber face', start, p.index, dot)
            minimum_dot = min(minimum_dot, dot)
    centers = [wood[i * 6].center for i in range(110)]
    distances = [(a - b).length for a, b in zip(centers, centers[1:])]
    spacing_ratio = max(distances) / min(distances)
    assert spacing_ratio < 1.005, spacing_ratio
    assert abs(max(v.co.z for v in detail.data.vertices) - .92) < 1e-6
    assert abs(min(v.co.z for v in detail.data.vertices)) < 1e-6
    repeated = planted_island('Repeat', coll, mats, backed=True, **params)
    assert fingerprint(detail) == fingerprint(repeated), 'Non-deterministic detail'
    for bad in ({'length': 0}, {'seat_slats': 1}, {'tufts': -1}):
        try:
            planted_island('Invalid', coll, mats, **(params | bad))
        except ValueError:
            pass
        else:
            raise AssertionError('Invalid dimensions accepted')
    report = {'status': 'PASS', 'render_invocations': 0,
              'legacy_geometry_unchanged': True,
              'timber_solids_checked': len(wood) // 6,
              'minimum_outward_face_dot_m': minimum_dot,
              'seat_center_spacing_max_over_min': spacing_ratio,
              'post_top_m': .92, 'repeat_geometry_sha256': fingerprint(detail),
              'limits': ['Geometry only; no ergonomic, structural, accessibility, '
                         'visual, independent or physical-device approval.']}
    if '--' in sys.argv:
        out = Path(sys.argv[sys.argv.index('--') + 1])
        out.parent.mkdir(parents=True, exist_ok=True)
        with out.open('x') as f:
            f.write(json.dumps(report, indent=2) + '\n')
    print('GARDEN_GEOMETRY_CHECKS ' + json.dumps(report))


if __name__ == '__main__':
    run()
