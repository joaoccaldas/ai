"""Check equilibrium independently of the generator's rounded angle receipt."""
import importlib.util
import json
import math
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load_model():
    spec = importlib.util.spec_from_file_location(
        "formfinding", ROOT / "scripts/structural_formfinding_v2.py")
    model = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(model)
    return model


class Formfinding(unittest.TestCase):
    def test_import_does_not_generate_files(self):
        with patch.object(Path, "write_text", side_effect=AssertionError("write")), \
             patch.object(Path, "mkdir", side_effect=AssertionError("mkdir")):
            load_model()

    def test_section_moment_residuals(self):
        m = load_model()
        for rise in (0.9, 1.35, 1.8):
            for load in (3.0, 7.5, 12.0):
                h, v, _, _ = m.reactions(rise, load)
                self.assertAlmostEqual(2 * v, load * m.L)
                for x, y in m.parabola_points(rise):
                    # Simply supported beam moment minus arch thrust moment.
                    residual = load * x * (m.L - x) / 2 - h * y
                    self.assertLessEqual(abs(residual), h * 0.00005 + 1e-9)

    def test_endpoints_and_crown(self):
        m = load_model()
        points = m.parabola_points(m.F)
        self.assertEqual(points[0], [0, 0])
        self.assertEqual(points[-1], [m.L, 0])
        self.assertEqual(points[len(points) // 2], [m.L / 2, m.F])

    def test_receipt_reactions_are_reproducible(self):
        m = load_model()
        receipt = json.loads((ROOT / "config/structural_formfinding_v2_receipt.json").read_text())
        h, v, r, theta = m.reactions(m.F)
        for key, actual in (("horizontal_reaction_kN_per_support", h),
                            ("vertical_reaction_kN_per_support", v),
                            ("resultant_reaction_kN_per_support", r),
                            ("support_resultant_angle_deg_above_horizontal", theta)):
            self.assertAlmostEqual(receipt["chosen_case"][key], actual, delta=0.0005)
        self.assertAlmostEqual(theta, math.degrees(math.atan(4 * m.F / m.L)))

    def test_catenary_cannot_substitute_for_uniform_horizontal_load(self):
        m = load_model()
        a, x = 8.0, m.L / 4
        rise = a * (math.cosh(m.L / (2 * a)) - 1)
        y = a * (math.cosh(m.L / (2 * a)) - math.cosh((x - m.L / 2) / a))
        h, _, _, _ = m.reactions(rise)
        # The same endpoints/rise do not imply the same load equilibrium.
        self.assertGreater(abs(m.W * x * (m.L - x) / 2 - h * y), 0.1)

    def test_invalid_parameters_are_rejected(self):
        m = load_model()
        for rise in (0, -1, math.inf, math.nan):
            with self.assertRaises(ValueError):
                m.reactions(rise)
            with self.assertRaises(ValueError):
                m.parabola_points(rise)
        for load in (-1, math.inf, math.nan):
            with self.assertRaises(ValueError):
                m.reactions(m.F, load)


if __name__ == "__main__":
    unittest.main()
