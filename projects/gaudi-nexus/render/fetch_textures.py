"""Download the CC0 PBR textures listed in textures.json into _tex/ (not committed) and record provenance.

  python3 fetch_textures.py
"""
import json, os, hashlib, urllib.request, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '_tex'); os.makedirs(OUT, exist_ok=True)
H = {'User-Agent': 'Mozilla/5.0'}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=120).read()
cfg = json.load(open(os.path.join(HERE, 'textures.json'))); prov = []
for t in cfg['textures']:
    tid = t['id']; d = os.path.join(OUT, tid); os.makedirs(d, exist_ok=True)
    files = json.loads(get(f'https://api.polyhaven.com/files/{tid}')); info = json.loads(get(f'https://api.polyhaven.com/info/{tid}'))
    for m in cfg['maps']:
        url = files[m][cfg['resolution']]['jpg']['url']; path = os.path.join(d, m + '.jpg')
        if not os.path.exists(path): open(path, 'wb').write(get(url))
        prov.append({'id': tid, 'role': t['role'], 'map': m, 'url': url, 'sha256': hashlib.sha256(open(path, 'rb').read()).hexdigest(), 'bytes': os.path.getsize(path),
                     'licence': 'CC0-1.0', 'authors': list(info.get('authors', {}).keys()), 'size_m': t['size_m']})
    print('fetched', tid)
json.dump({'retrieved': datetime.date.today().isoformat(), 'source': cfg['source'], 'files': prov}, open(os.path.join(OUT, 'provenance.json'), 'w'), indent=1)
print('provenance ->', os.path.join(OUT, 'provenance.json'))
