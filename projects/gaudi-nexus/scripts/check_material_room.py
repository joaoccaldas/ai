"""Check portable room composition; no rendering or visual approval."""
import argparse
import hashlib
import json
import struct
from pathlib import Path


def read_glb(path):
    raw = path.read_bytes()
    assert struct.unpack_from('<III', raw) == (0x46546C67, 2, len(raw))
    length, kind = struct.unpack_from('<II', raw, 12)
    assert kind == 0x4E4F534A
    doc = json.loads(raw[20:20 + length])
    start = 20 + length
    size, kind = struct.unpack_from('<II', raw, start)
    assert kind == 0x004E4942
    return doc, raw[start + 8:start + 8 + size]


def geometry_identity(doc, binary):
    chunks = []
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            for accessor_id in [primitive['indices'], *primitive['attributes'].values()]:
                accessor = doc['accessors'][accessor_id]
                view = doc['bufferViews'][accessor['bufferView']]
                offset = view.get('byteOffset', 0)
                chunks.append(binary[offset:offset + view['byteLength']])
    return hashlib.sha256(b''.join(chunks)).hexdigest()


parser = argparse.ArgumentParser()
parser.add_argument('--directory', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
manifest = json.loads((root/'projects/gaudi-nexus/config/material-room-study-v1.json').read_text())
for entry in manifest['assets'].values():
    assert hashlib.sha256((root/entry['path']).read_bytes()).hexdigest() == entry['sha256']
results = []
for variant in manifest['variants']:
    path = args.directory/(variant+'.glb')
    doc, binary = read_glb(path)
    issues = json.loads(path.with_suffix('.glb.validation.json').read_text())['issues']
    assert issues['numErrors'] == issues['numWarnings'] == 0
    assert len(doc['meshes']) == 12
    assert len([n for n in doc['nodes'] if 'mesh' in n]) == 13
    assert {n['name'] for n in doc['nodes'] if 'camera' in n} == {'StudyArrival', 'StudyObjects', 'StudyOverview'}
    markers = [n for n in doc['nodes'] if n.get('extras', {}).get('caldas_room_study') == 1]
    assert len(markers) == 1 and markers[0]['extras']['study_id'] == 'material-room-study-'+variant
    for i, placement in enumerate(manifest['placements']):
        slot = next(n for n in doc['nodes'] if n['name'] == 'StudySlot_'+str(i)+'_'+placement['asset'])
        assert slot['extras']['reuse_source_sha256'] == manifest['assets'][placement['asset']]['sha256']
    lanterns = [n['mesh'] for n in doc['nodes'] if n.get('extras', {}).get('asset_id') == 'lantern_louvred']
    assert len(lanterns) == 2 and lanterns[0] == lanterns[1]
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            material = doc['materials'][primitive['material']]
            if material.get('normalTexture'):
                assert 'TEXCOORD_0' in primitive['attributes'] and 'TANGENT' in primitive['attributes']
    assert '/Users/' not in json.dumps(doc)
    assert all('uri' not in image for image in doc.get('images', []))
    results.append({'variant':variant, 'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                    'bytes':path.stat().st_size, 'geometrySha256':geometry_identity(doc,binary),
                    'errors':0, 'warnings':0, 'embeddedImages':len(doc.get('images',[]))})
assert results[0]['geometrySha256'] == results[1]['geometrySha256']
print(json.dumps({'passed':True,'checks':'source hashes, composition, shared lantern mesh, cameras, UV/tangent coverage, local-path/embedded-image checks, matching finish geometry',
                  'productionAccepted':False,'outputs':results},indent=2))
