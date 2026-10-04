import json, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class Contracts(unittest.TestCase):
    def test_rubric_is_100(self):
        r=json.loads((ROOT/'config/rubric.json').read_text())
        self.assertEqual(sum(x['points'] for x in r['criteria']),100)
    def test_site_template_is_not_authoritative(self):
        s=json.loads((ROOT/'data/site/site_template.json').read_text())
        self.assertIn('PROVISIONAL',s['status'])
    def test_origin_has_crs(self):
        o=json.loads((ROOT/'config/site_origin.json').read_text())
        self.assertEqual(o['crs_geographic'],'EPSG:4326')
        self.assertEqual(o['crs_projected_target'],'EPSG:25831')
if __name__=='__main__': unittest.main()
