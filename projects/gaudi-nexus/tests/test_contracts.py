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

    def test_official_brief_is_locked(self):
        req=json.loads((ROOT/'config/requirements.json').read_text())
        self.assertTrue(req['status'].startswith('OFFICIAL_BRIEF_AUDITED'))
        self.assertEqual(req['site']['block_side_m'],113.3)
        self.assertEqual(req['program']['target_area_m2'],[1500,2000])
        self.assertEqual(sum(req['jury_rubric_points'].values()),100)
        self.assertEqual(req['submission']['main_board']['max_file_mb'],15)
        self.assertEqual(req['submission']['optional_design_board']['max_file_mb'],10)
        self.assertTrue(req['submission']['anonymous'])

    def test_municipal_context_checksum_is_pinned(self):
        src=json.loads((ROOT/'config/authoritative_sources_v0_1.json').read_text())
        sf=next(x for x in src['sources'] if x['id']=='BCN-3D-SF')
        self.assertEqual(sf['status'],'DOWNLOADED_AND_CHECKSUM_VERIFIED')
        self.assertEqual(sf['crs'],'EPSG:25831')
        self.assertEqual(sf['units'],'metres')
        self.assertEqual(sf['archive_sha256'],'186ed46321b9ec3baf7f6dc14235a32a8dd7a3fa54d32e815cddc4d0a91d9ef9')

    def test_final_10_scorecard_is_complete(self):
        s=json.loads((ROOT/'config/WIN_SCORECARD.json').read_text())
        self.assertEqual(len(s['steps']),10)
        self.assertEqual(sum(x['weight_pct'] for x in s['steps']),100)
        self.assertEqual([x['id'] for x in s['steps']],list(range(1,11)))

    def test_program_audit_matches_official_split(self):
        p=json.loads((ROOT/'config/program_audit_v1.json').read_text())
        self.assertEqual(sum(p['official_split_pct'].values()),100)
        self.assertGreaterEqual(p['target_gfa_m2'],p['official_range_m2'][0])
        self.assertLessEqual(p['target_gfa_m2'],p['official_range_m2'][1])

    def test_release_gate_matches_official_a1(self):
        r=json.loads((ROOT/'config/release_manifest_template.json').read_text())
        a1=next(x for x in r['final_artifacts'] if x['id']=='A1_MAIN')
        self.assertEqual(a1['dimensions_mm'],[594,841])
        self.assertEqual(a1['max_mb'],15)

if __name__=='__main__':
    unittest.main()
