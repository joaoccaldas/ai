"""Synthetic contract tests. Does NOT claim real site-truth or renderer acceptance."""
import json
import tempfile
import unittest
from pathlib import Path
from gaudi_release_gate import audit, REQUIRED, APPROVALS

class GaudiReleaseGateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for relative in REQUIRED:
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("placeholder", encoding="utf-8")

    def put(self, value):
        (self.root / REQUIRED[0]).write_text(json.dumps(value), encoding="utf-8")

    def test_missing_site_truth_fails_closed(self):
        self.put({"current_3d": {"revision": 16}})
        result = audit(self.root)
        self.assertFalse(result["ready"])
        self.assertIn("SITE_TRUTH_NOT_APPROVED", {f["id"] for f in result["findings"]})

    def test_invalid_json_fails_closed(self):
        result = audit(self.root)
        self.assertIn("INVALID_WORLD_JSON", {f["id"] for f in result["findings"]})

    def test_explicit_complete_acceptance(self):
        self.put({"current_3d": {"revision": 17, "status": "SITE_TRUTH_V1_APPROVED", "binary_identity_verified_utc": "2026-10-20", "new_hero_candidate": {"status": "VISUAL_APPROVED"}, "promotion_blockers": []}, "release_approvals": {key: {"approved": True, "reviewer": "fixture", "evidence_sha256": "a"*64} for key in APPROVALS}})
        self.assertTrue(audit(self.root)["ready"])

    def test_recorded_blockers_override_signoff(self):
        self.put({"current_3d": {"status": "SITE_TRUTH_V1_APPROVED", "binary_identity_verified_utc": "2026-10-20", "new_hero_candidate": {"status": "VISUAL_APPROVED"}, "promotion_blockers": ["context missing"]}, "release_approvals": {key: {"approved": True, "reviewer": "fixture", "evidence_sha256": "a"*64} for key in APPROVALS}})
        self.assertFalse(audit(self.root)["ready"])

if __name__ == "__main__":
    unittest.main()
