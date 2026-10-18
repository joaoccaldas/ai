"""Non-render geometry checks for the three 18 October detail candidates."""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from procassets.interiors import wall_mirror_gallery
from procassets.public_realm import reflecting_basin
from procassets.props import vase_fluted, planter_ribbed, lantern_louvred

checks = []
def finite(bm):
    assert all(math.isfinite(c) for v in bm.verts for c in v.co)
    assert all(f.calc_area() > 1e-12 for f in bm.faces)

plain = wall_mirror_gallery(beads=0)
detail = wall_mirror_gallery(beads=360)
finite(plain); finite(detail)
assert len(detail.verts) > len(plain.verts) + 1000
for axis in (0, 2):
    # Catmull-Rom moulding has its authored slight overshoot. Detail must stay
    # inside that actual plain-frame footprint, not an idealized rectangle.
    assert min(v.co[axis] for v in detail.verts) >= min(v.co[axis] for v in plain.verts) - 1e-6
    assert max(v.co[axis] for v in detail.verts) <= max(v.co[axis] for v in plain.verts) + 1e-6
checks.append('mirror_beads_inside_wall_attachment_bounds')
plain.free(); detail.free()

plain = reflecting_basin(seg=288, flutes=0)
detail = reflecting_basin(seg=288, flutes=48)
finite(plain); finite(detail)
water = [f for f in detail.faces if f.material_index == 1]
assert water and all(abs(v.co.z - .4) < 1e-5 for f in water for v in f.verts)
detail.normal_update()
assert all(f.normal.z > .99 for f in water)
assert len(plain.verts) == len(detail.verts)
assert any((a.co-b.co).length > .001 for a,b in zip(plain.verts,detail.verts))
checks.append('basin_flutes_change_wall_not_upward_water_surface')
plain.free(); detail.free()

plain = vase_fluted(flutes=0)
detail = vase_fluted(flutes=48)
again = vase_fluted(flutes=48)
finite(plain); finite(detail)
assert min(v.co.z for v in detail.verts) >= -1e-6
assert max(v.co.z for v in detail.verts) <= .52301
assert len(plain.verts) == len(detail.verts)
assert any((a.co-b.co).length > .001 for a,b in zip(plain.verts,detail.verts))
assert all((a.co-b.co).length < 1e-8 for a,b in zip(detail.verts,again.verts))
assert {f.material_index for f in detail.faces} == {0,1}
checks.append('vase_fluting_deterministic_base_contact_and_separate_lip')
plain.free(); detail.free(); again.free()
for call in [lambda: reflecting_basin(seg=72,flutes=48), lambda: vase_fluted(flutes=64,segments=48),lambda: wall_mirror_gallery(beads=999)]:
    try: call()
    except ValueError: pass
    else: raise AssertionError('Detail bounds not enforced')
checks.append('invalid_detail_density_rejected')

plain = planter_ribbed(ribs=0)
detail = planter_ribbed()
finite(plain); finite(detail)
assert min(v.co.z for v in detail.verts) >= -1e-6
assert max(v.co.z for v in detail.verts) <= .48001
assert any((a.co-b.co).length > .001 for a,b in zip(plain.verts,detail.verts))
assert all((a.co-b.co).length < 1e-8 for a,b in zip(plain.verts,detail.verts) if a.co.z >= .86*.48)
checks.append('planter_ribbing_preserves_rim_and_floor_contact')
plain.free(); detail.free()

lantern = lantern_louvred()
finite(lantern)
assert {f.material_index for f in lantern.faces} == {0,1,2}
assert min(v.co.z for v in lantern.verts) >= -1e-6
assert .60 < max(v.co.z for v in lantern.verts) < .62
assert max(abs(v.co.x) for v in lantern.verts) <= .151
checks.append('lantern_parts_inside_authored_envelope')
lantern.free()

hero = vase_fluted()
display = vase_fluted(flutes=32, segments=192, profile_steps=2)
finite(display)
assert len(display.faces) < len(hero.faces)*.4
for axis in range(3):
    assert abs(min(v.co[axis] for v in hero.verts)-min(v.co[axis] for v in display.verts)) < .002
    assert abs(max(v.co[axis] for v in hero.verts)-max(v.co[axis] for v in display.verts)) < .002
checks.append('display_vessel_keeps_bounds_with_fewer_faces')
hero.free(); display.free()

for call in [lambda: planter_ribbed(h=float('nan')),lambda: planter_ribbed(ribs=80),lambda: lantern_louvred(slats=2),lambda: lantern_louvred(d=float('inf'))]:
    try: call()
    except ValueError: pass
    else: raise AssertionError('Decoration bounds not enforced')
checks.append('invalid_decoration_parameters_rejected')
print(json.dumps({'checks':checks,'rendered':False,'productionAccepted':False}))
