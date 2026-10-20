#!/usr/bin/env python3
"""Synthetic-only pixel regression for STRIDE's actual browser Canvas PNG export.

Run: python tests/browser_privacy.py
Dependencies: pip install playwright pillow && python -m playwright install chromium
Optional: STRIDE_CHROMIUM_PATH=/usr/bin/chromium

This harness executes unmodified app/core module bodies inside about:blank,
rewriting only the relative core import to a data: URI. This enables authentic
Canvas 2D raster tests in environments that block file:// and localhost.
All locations in fixtures are deliberately fictional. No network access needed.
"""
import base64
from datetime import datetime, timezone, timedelta
from io import BytesIO
import math
import os
from pathlib import Path
import unittest

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
R = 6371008.8
TRIM = 700


def distance(a, b):
    phi1, phi2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = math.radians(b[0] - a[0]), math.radians(b[1] - a[1])
    q = math.sin(dp / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(min(1, math.sqrt(q)))


def route():
    # (east_m, north_m): a return near home occurs between separate branches.
    xy = [(0,0),(0,300),(0,600),(0,900),(0,1200),(0,1500),
          (0,1800),(-300,1800),(-600,1800),(-900,1500),(-900,1200),
          (-900,900),(-700,500),(-350,150),(0,0),
          (300,0),(600,0),(900,0),(1200,0),(1500,0),
          (1800,0),(1800,300),(1800,600),(1500,900),
          (1200,1200),(900,900),(600,600),(300,300),(0,0)]
    return [(north/111320, east/111320) for east,north in xy]


def expected_segments(pts):
    # Independent geodesic implementation of the published 700 m contract.
    traveled = [0.0]
    for a,b in zip(pts,pts[1:]):
        traveled.append(traveled[-1] + distance(a,b))
    total = traveled[-1]
    segments, current = [], []
    for i,p in enumerate(pts):
        safe = (i > 0 and i < len(pts)-1
                and traveled[i] >= TRIM and total-traveled[i] >= TRIM
                and distance(p,pts[0]) >= TRIM and distance(p,pts[-1]) >= TRIM)
        if safe:
            current.append(i)
        elif current:
            if len(current) >= 2:
                segments.append(current)
            current = []
    if len(current) >= 2:
        segments.append(current)
    return segments


def gpx(pts):
    t0 = datetime(2026,1,1,tzinfo=timezone.utc)
    data = ['<gpx version="1.1"><trk><trkseg>']
    for i,(lat,lon) in enumerate(pts):
        ts = (t0 + timedelta(seconds=i*90)).isoformat().replace('+00:00','Z')
        data.append(f'<trkpt lat="{lat:.9f}" lon="{lon:.9f}"><ele>25</ele><time>{ts}</time></trkpt>')
    return ''.join(data) + '</trkseg></trk></gpx>'


def projected(pts,w,h):
    # Independent projection matches public v0.1 fallback camera defaults.
    lat0 = sum(p[0] for p in pts)/len(pts)
    lon0 = sum(p[1] for p in pts)/len(pts)
    coslat = math.cos(math.radians(lat0))
    local = [((lon-lon0)*111320*coslat,(lat-lat0)*111320) for lat,lon in pts]
    span = max(500,*(max(abs(x),abs(z)) for x,z in local))
    yaw,pitch = .73,.85
    cy,sy,cp,sp = math.cos(yaw),math.sin(yaw),math.cos(pitch),math.sin(pitch)
    result = []
    for x,z in local:
        x,z = x/span*13,z/span*13
        y = .75
        rx,rz = x*cy-z*sy,x*sy+z*cy
        ry,depth = y*cp-rz*sp,y*sp+rz*cp
        scale = min(w,h)*.037*(48/(48+depth))
        result.append((w*.5+rx*scale,h*.58-ry*scale))
    return result


def pixel_line_distance(x,y,a,b):
    ax,ay = a
    bx,by = b
    dx,dy = bx-ax,by-ay
    denominator = dx*dx+dy*dy
    t = max(0,min(1,((x-ax)*dx+(y-ay)*dy)/denominator)) if denominator else 0
    return math.hypot(x-ax-t*dx,y-ay-t*dy)


def bright_route_pixels(image):
    rgb = image.convert('RGB').load()
    for y in range(image.height):
        for x in range(image.width):
            r,g,b = rgb[x,y]
            # Route color #dafa94; no terrain preset uses this green.
            if r>=170 and g>=208 and 105<=b<=198 and g-r>9:
                yield x,y


class PrivacyRaster(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        opts = {'headless':True,'args':['--no-sandbox']}
        browser = os.environ.get('STRIDE_CHROMIUM_PATH')
        if browser:
            opts['executable_path'] = browser
        elif Path('/usr/bin/chromium').exists():
            opts['executable_path'] = '/usr/bin/chromium'
        cls.browser = cls.pw.chromium.launch(**opts)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def page(self,viewport):
        page = self.browser.new_page(viewport=viewport,device_scale_factor=1,accept_downloads=True)
        errors,requests = [],[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:requests.append(r.url))
        html = (ROOT/'index.html').read_text()
        css = (ROOT/'style.css').read_text()
        html = html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
        html = html.replace('<script type="module" src="app.mjs"></script>','')
        core = (ROOT/'core.mjs').read_bytes()
        module = 'data:text/javascript;base64,'+base64.b64encode(core).decode()
        app = (ROOT/'app.mjs').read_text()
        self.assertIn("from './core.mjs'",app)
        page.set_content(html)
        page.add_script_tag(type='module',content=app.replace("from './core.mjs'",f"from '{module}'"))
        page.wait_for_function("document.getElementById('sourceState').textContent.includes('Fictional sample')")
        self.assertFalse(errors)
        self.assertFalse(requests)
        page.evaluate("""() => {
          window.__stride_png=[];
          const original=HTMLCanvasElement.prototype.toDataURL;
          HTMLCanvasElement.prototype.toDataURL=function(...args){
            const value=original.apply(this,args);
            window.__stride_png.push(value);
            return value;
          };
          HTMLAnchorElement.prototype.click=function(){};
        }""")
        return page,errors,requests

    def load(self,page,pts):
        page.locator('#activityFile').set_input_files(files={
            'name':'fictional-privacy.gpx',
            'mimeType':'application/gpx+xml',
            'buffer':gpx(pts).encode()})
        page.wait_for_function("document.getElementById('sourceState').textContent.includes('Opened')")
        page.locator('#play').click()
        page.wait_for_timeout(75)

    def test_real_export_pixels_match_independently_permitted_subpaths(self):
        pts = route()
        allowed = expected_segments(pts)
        self.assertGreaterEqual(len(allowed),2,'fixture requires disjoint segments')
        for viewport in ({'width':1600,'height':1024},{'width':390,'height':844},
                         {'width':844,'height':390}):
            with self.subTest(viewport=viewport):
                page,errors,requests = self.page(viewport)
                try:
                    self.load(page,pts)
                    dims = page.locator('#scene').evaluate('(c)=>({w:c.clientWidth,h:c.clientHeight})')
                    page.locator('#shareBtn').click()
                    url = page.evaluate('window.__stride_png.at(-1)')
                    self.assertTrue(url.startswith('data:image/png;base64,'))
                    image = Image.open(BytesIO(base64.b64decode(url.split(',',1)[1])))
                    self.assertEqual(image.size,(dims['w'],dims['h']))
                    xy = projected(pts,dims['w'],dims['h'])
                    edges = [(xy[a],xy[b]) for segment in allowed for a,b in zip(segment,segment[1:])]
                    pixels = list(bright_route_pixels(image))
                    self.assertGreater(len(pixels),40,'must actually render visible route')
                    leaked = [(x,y) for x,y in pixels if
                              min(pixel_line_distance(x,y,a,b) for a,b in edges)>11]
                    self.assertLessEqual(len(leaked),2,
                        f'{len(leaked)} route-colored PNG pixels outside safe subpaths: {leaked[:8]}')
                    self.assertFalse(errors)
                    self.assertFalse(requests,'no network requests during file import/export')
                    print(f"PNG privacy {viewport['width']}x{viewport['height']}: "
                          f"visible_pixels={len(pixels)}, outliers={len(leaked)}")
                finally:
                    page.close()

    def test_closed_local_circuit_must_not_export_a_png(self):
        pts = [(300*math.sin(i*2*math.pi/29)/111320,
                300*math.cos(i*2*math.pi/29)/111320) for i in range(30)]
        page,errors,requests = self.page({'width':900,'height':800})
        try:
            self.load(page,pts)
            page.locator('#shareBtn').click()
            self.assertEqual(0,len(page.evaluate('window.__stride_png')))
            self.assertIn('blocked',page.locator('#sourceState').inner_text().lower())
            self.assertFalse(errors)
            self.assertFalse(requests)
        finally:
            page.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
