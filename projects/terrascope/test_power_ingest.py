import io
import json
import tempfile
import unittest
from pathlib import Path
from power_ingest import ingest, normalize, url_for

class FakeResponse:
    def __init__(self, body): self.body = body
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self, n): return self.body

class PowerTests(unittest.TestCase):
    def test_rejects_invalid_location(self):
        with self.assertRaises(ValueError): url_for(91, 0, "20240101", "20240102", ["T2M"])

    def test_rejects_parameter_injection(self):
        with self.assertRaises(ValueError): url_for(0, 0, "20240101", "20240102", ["NOT_A_POWER_FIELD"])

    def test_rejects_missing_timeseries(self):
        with self.assertRaises(ValueError): normalize({"properties": {"parameter": {}}}, ["T2M"])

    def test_preserves_missing_and_units(self):
        payload = {"properties": {"parameter": {"T2M": {"20240101": 12.5, "20240102": -999}}},
                   "parameters": {"T2M": {"units": "C"}}}
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "daily.json"
            result = ingest("https://power.larc.nasa.gov/example", path, ["T2M"],
                            opener=lambda *a, **k: FakeResponse(json.dumps(payload).encode()))
            self.assertEqual(result["observations"][1]["T2M"], None)
            self.assertEqual(result["units"]["T2M"], "C")
            self.assertTrue(path.with_suffix(".raw.json").exists())
            self.assertEqual(len(result["raw_sha256"]), 64)

if __name__ == "__main__": unittest.main()
