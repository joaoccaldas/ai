"""Bounded file checks, never approval of a competition entry or its contents."""
from pathlib import Path
import argparse
import hashlib
import json
import re
from PIL import Image


def sha256(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):
            h.update(chunk)
    return h.hexdigest()


def inspect(path, max_mb, dimensions=(594,841), participant_number=None):
    p=Path(path)
    issues=[]
    if not p.is_file(): return {'path':str(p),'issues':['missing file']}
    size=p.stat().st_size
    # Decimal MB avoids accepting files above the organizer's stated MB ceiling.
    if size>max_mb*1000000: issues.append(f'file exceeds {max_mb} MB')
    if p.suffix.lower() not in ('.jpg','.jpeg'): issues.append('must be JPEG/JPG')
    if not participant_number or not re.fullmatch(r'[0-9]+',str(participant_number)):
        issues.append('participant order number required for filename verification')
    elif p.stem!=str(participant_number):
        issues.append('filename must contain only the participant order number')
    meta={}
    try:
        with Image.open(p) as im:
            meta={'pixels':list(im.size),'mode':im.mode,'format':im.format,'exif_keys':list(im.getexif().keys())}
            if im.format!='JPEG': issues.append('actual file encoding must be JPEG')
            if im.mode not in ('RGB','L'): issues.append('review image colour mode')
            ratio=min(im.size)/max(im.size)
            target=min(dimensions)/max(dimensions)
            if abs(ratio/target-1)>.005: issues.append('aspect ratio does not match the required board dimensions')
            metadata=[k for k in im.info if k.lower() in {'exif','xmp','xml:com.adobe.xmp','comment','description','photoshop'}]
            if len(im.getexif()) or metadata: issues.append('embedded descriptive metadata present; review and remove identifying fields')
            meta['descriptive_metadata_keys']=metadata
            im.verify()
    except Exception:
        issues.append('image could not be verified')
    return {'path':str(p),'size_mb':round(size/1000000,3),'sha256':sha256(p),'metadata':meta,'issues':issues}


def audit(a1, a4=None, participant_number=None):
    boards={'A1':inspect(a1,15,(594,841),participant_number)}
    if a4: boards['A4']=inspect(a4,10,(210,297),participant_number)
    return {'boards':boards,'automatedChecksPassed':not any(v['issues'] for v in boards.values()),
            'submissionReady':False,
            'manualChecksRequired':['English and legibility','Visible bottom-right participant number and no identifying text',
                'One coherent approved model behind all drawings and views','Required programme, site and engineering evidence',
                'Complete asset/source/tool rights','Current official deadline, timezone and upload instructions',
                'Owner approval and actual upload receipt']}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('A1');parser.add_argument('A4',nargs='?')
    parser.add_argument('--participant-number')
    args=parser.parse_args()
    out=audit(args.A1,args.A4,args.participant_number)
    print(json.dumps(out,indent=2))
    raise SystemExit(0 if out['automatedChecksPassed'] else 1)
