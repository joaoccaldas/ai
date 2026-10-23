"""Download the CC0 PBR textures listed in textures.json into _tex/ (not committed) and record provenance.

  python3 fetch_textures.py
"""
import json, os, hashlib, urllib.request, datetime, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
p=argparse.ArgumentParser();p.add_argument('--ids',nargs='+');p.add_argument('--output',default=os.path.join(HERE,'_tex'))
p.add_argument('--lock',help='Verify every selected map against the reviewed SHA-256 lock')
args=p.parse_args();OUT=args.output;os.makedirs(OUT,exist_ok=True)
H = {'User-Agent': 'Caldas-Gaudi-material-study/1.0'}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=20) as response:
        raw=response.read(32*1024*1024+1)
    if len(raw)>32*1024*1024:raise ValueError('Texture/metadata exceeds bounded download')
    return raw
cfg = json.load(open(os.path.join(HERE, 'textures.json'))); prov = []
known={t['id'] for t in cfg['textures']}
if args.ids and not set(args.ids)<=known:p.error('Unknown texture ID')
lock=json.load(open(args.lock)) if args.lock else None
pins={(f['id'],f['map']):f for f in lock['files']} if lock else {}
for t in cfg['textures']:
    if args.ids and t['id'] not in args.ids:continue
    tid = t['id']; d = os.path.join(OUT, tid); os.makedirs(d, exist_ok=True)
    files = json.loads(get(f'https://api.polyhaven.com/files/{tid}')); info = json.loads(get(f'https://api.polyhaven.com/info/{tid}'))
    for m in cfg['maps']:
        url = files[m][cfg['resolution']]['jpg']['url']; path = os.path.join(d, m + '.jpg')
        pin=pins.get((tid,m))
        if lock and (not pin or pin['url']!=url):raise ValueError('Reviewed texture URL changed: '+tid+'/'+m)
        raw=open(path,'rb').read() if os.path.exists(path) else get(url)
        sha=hashlib.sha256(raw).hexdigest()
        if pin and (pin['sha256']!=sha or pin['bytes']!=len(raw)):raise ValueError('Texture identity changed: '+tid+'/'+m)
        if not os.path.exists(path):open(path,'wb').write(raw)
        prov.append({'id': tid, 'role': t['role'], 'map': m, 'url': url, 'sha256': sha, 'bytes': os.path.getsize(path),
                     'licence': 'CC0-1.0', 'authors': list(info.get('authors', {}).keys()), 'size_m': t['size_m']})
    print('fetched', tid)
json.dump({'retrieved': datetime.date.today().isoformat(), 'source': cfg['source'], 'files': prov}, open(os.path.join(OUT, 'provenance.json'), 'w'), indent=1)
print('provenance ->', os.path.join(OUT, 'provenance.json'))
