import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image

SCRIPT=Path(__file__).resolve().parents[1]/'scripts/build_visual_review.py'
spec=importlib.util.spec_from_file_location('visual_review',SCRIPT)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)


class VisualComparison(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        self.current=self.root/'candidate';self.base=self.root/'baseline'
        for folder in (self.current,self.base):
            folder.mkdir()
            for name in ('arrival','market','plaza','method'):
                if folder==self.base and name=='method':continue
                file=folder/(name+'.png');Image.new('RGB',(32,24)).save(file)
                record=dict(camera=name,position_m=[1,2,1.56],lens_mm=32,width=32,height=24,
                    max_samples=32,hour_CEST=18.5,date='2026-09-21',view_transform='AgX',
                    source_sha256='source',blender_version='5.2.2 LTS',postprocess='none',
                    seconds_render=1,render_sha256=hashlib.sha256(file.read_bytes()).hexdigest())
                (folder/(name+'.png.receipt.json')).write_text(json.dumps(record))

    def tearDown(self):self.temp.cleanup()

    def test_matched_views_and_new_detail_have_distinct_labels(self):
        module.comparison(self.current,self.base)
        text=(self.current/'review.html').read_text()
        self.assertEqual(text.count('Before · preserved V6'),3)
        self.assertIn('No prior matching view.',text)

    def test_changed_camera_cannot_be_presented_as_matched(self):
        file=self.current/'market.png.receipt.json';r=json.loads(file.read_text());r['lens_mm']=50;file.write_text(json.dumps(r))
        with self.assertRaisesRegex(ValueError,'Unmatched baseline profile'):
            module.comparison(self.current,self.base)

    def test_changed_pixels_cannot_reuse_old_receipt(self):
        Image.new('RGB',(32,24),'red').save(self.current/'market.png')
        with self.assertRaisesRegex(ValueError,'Render identity mismatch'):
            module.comparison(self.current,self.base)
