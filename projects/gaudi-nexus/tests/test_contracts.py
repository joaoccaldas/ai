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

    def test_current_world_has_single_authority(self):
        w=json.loads((ROOT/'config/current_world.json').read_text())
        self.assertEqual(w['authority']['repository'],'joaoccaldas/ai')
        self.assertEqual(w['authority']['branch'],'gaudi-nexus')
        self.assertEqual(w['authority']['project_path'],'projects/gaudi-nexus/')
        self.assertEqual(w['current_3d']['revision'],14)
        self.assertEqual(w['current_3d']['status'],'EXTERNAL_PROVISIONAL_CURRENT')

    def test_municipal_context_checksum_is_pinned(self):
        src=json.loads((ROOT/'config/authoritative_sources_v0_1.json').read_text())
        sf=next(x for x in src['sources'] if x['id']=='BCN-3D-SF')
        self.assertEqual(sf['status'],'DOWNLOADED_AND_CHECKSUM_VERIFIED')
        self.assertEqual(sf['crs'],'EPSG:25831')
        self.assertEqual(sf['units'],'metres')
        self.assertEqual(sf['archive_sha256'],'186ed46321b9ec3baf7f6dc14235a32a8dd7a3fa54d32e815cddc4d0a91d9ef9')

if __name__=='__main__':
    unittest.main()
