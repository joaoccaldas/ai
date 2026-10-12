from pathlib import Path
import json, sys, hashlib
from PIL import Image

def sha256(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):
            h.update(chunk)
    return h.hexdigest()

def inspect(path,max_mb):
    p=Path(path)
    issues=[]
    if not p.exists(): return {'path':str(p),'issues':['missing file']}
    mb=p.stat().st_size/1024/1024
    if mb>max_mb: issues.append(f'file exceeds {max_mb} MB')
    if p.suffix.lower() not in ('.jpg','.jpeg'): issues.append('must be JPEG/JPG')
    meta={}
    try:
        im=Image.open(p)
        meta={'pixels':list(im.size),'mode':im.mode,'format':im.format,'exif_keys':list(im.getexif().keys())}
        if len(im.getexif()): issues.append('embedded EXIF metadata present')
    except Exception as e:
        issues.append(f'image open failed: {e}')
    return {'path':str(p),'size_mb':round(mb,3),'sha256':sha256(p),'metadata':meta,'issues':issues}

if __name__=='__main__':
    if len(sys.argv)<2:
        print('usage: python scripts/audit_submission.py A1.jpg [A4.jpg]')
        raise SystemExit(2)
    out={'A1':inspect(sys.argv[1],15)}
    if len(sys.argv)>2: out['A4']=inspect(sys.argv[2],10)
    print(json.dumps(out,indent=2))
    if any(v['issues'] for v in out.values()): raise SystemExit(1)
