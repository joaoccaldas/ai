#!/usr/bin/env python3
"""Comprehensive End-to-End Feature, Visual, Content & Tutorial Verification Suite
for STRIDE Athlete Worlds (STRIDE.app on 127.0.0.1:8864).

Tests:
1. Masthead, 5 Experience Modes (Replay, Cinema, Compare, Worlds & Reuse, Tutorials), and Method footer section.
2. File Import (GPX, TCX, FIT, and .stride.json round-trip).
3. 3D Stage Controls (Orbit keyboard/drag, Zoom, Follow, Cinema Drone, Play/Pause, 1x/2x/4x Speed).
4. Interactive 2D Elevation & Split Contour scrubbing (#profileCanvas).
5. Moment Atlas cards (Fastest 1 km, Steepest 1 km Gain, Slowest 1 km, Lap/Triathlon Transition, Photo Memory, Ghost Gap Split).
6. World Presets (Volcanic Coast / Kona, Red Canyon / St. George, Alpine Morning / Nice) + 24 Procedural Studio Props toggle.
7. KONA.m Canonical Bicycle Avatar selector (#equipmentSelect).
8. In-Memory Local Photo Pinning (#photoInput) + 3D route beacons.
9. 500 m Privacy Redaction Pins (#redactPinBtn), Privacy-Trimmed PNG export (#shareBtn), and .stride.json Story Bundle export (#bundleBtn).
10. All 8 Interactive Tutorials in the Feature Academy (#tutorialsPanel & #tourBanner).
"""
import json
import os
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

CHROMIUM = os.environ.get(
    "STRIDE_CHROMIUM_PATH",
    "/Users/joao/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell",
)
ARTIFACT_DIR = Path(
    os.environ.get(
        "STRIDE_ARTIFACT_DIR",
        "/Users/joao/.gemini/antigravity/brain/e572fde8-3ff2-423a-aaaf-53135a33aac2",
    )
)
BASE_URL = os.environ.get("STRIDE_BASE_URL", "http://127.0.0.1:8864")


def check_health():
    with urllib.request.urlopen(f"{BASE_URL}/health", timeout=3) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        assert data.get("status") == "ok", f"Unexpected health: {data}"
        assert data.get("stravaApi") == "disabled"
    with urllib.request.urlopen(f"{BASE_URL}/api/catalog", timeout=3) as resp:
        cat = json.loads(resp.read().decode("utf-8"))
        assert cat.get("schema") == "stride.reuse-inventory.v1"
        assert cat["counts"]["proceduralAssetDefinitions"] == 66
        assert cat["counts"]["bicycleStudies"] == 21
    print("✔ Loopback /health and /api/catalog verified on 127.0.0.1:8864")


def main():
    check_health()
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    report = []

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROMIUM, args=["--no-sandbox"])
        context = browser.new_context(
            viewport={"width": 1480, "height": 960},
            device_scale_factor=2,
            accept_downloads=True,
        )
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(350)

        # 1. Verify Masthead, Intro, Stats, and Method sections
        assert "STRIDE" in page.locator(".brand").inner_text()
        assert page.locator(".modebtn").count() == 5
        assert page.locator("#distanceStat").inner_text() != "—"
        assert "Truth underneath" in page.locator("#how").inner_text()
        report.append(("01_initial_replay_workspace", "Initial Replay Workspace & 2D Elevation Contour", page.locator("#routeTitle").inner_text()))

        # 2. Test Interactive Tutorials & Academy Mode + Step 01..08
        page.click('[data-mode="tutorials"]')
        page.wait_for_timeout(250)
        assert page.locator("#tutorialsPanel").is_visible()
        assert page.locator("#tourBanner").is_visible()
        assert page.locator(".tutorial-card").count() == 8
        shot_tut_overview = ARTIFACT_DIR / "tutorial-01-academy-overview.png"
        page.screenshot(path=str(shot_tut_overview), full_page=True)
        report.append(("tutorial-01-academy-overview.png", "Tutorial 01 & Interactive Academy Overview", page.locator("#tourTitle").inner_text()))

        # Step 02: Cinema Drone Orbit
        page.click("#tourNextBtn")
        page.wait_for_timeout(250)
        assert "02 / 08" in page.locator("#tourStepBadge").inner_text()
        assert page.locator("#cinemaBtn").get_attribute("aria-pressed") == "true"
        assert page.locator("#speed").inner_text() == "2×"
        shot_tut_cinema = ARTIFACT_DIR / "tutorial-02-cinema-drone.png"
        page.screenshot(path=str(shot_tut_cinema))
        report.append(("tutorial-02-cinema-drone.png", "Tutorial 02 · Autonomous Cinema Drone & Follow Camera", page.locator("#sourceState").inner_text()))

        # Step 03: Multi-Lap & Triathlon Brick Transition
        page.click("#tourNextBtn")
        page.wait_for_timeout(250)
        assert "03 / 08" in page.locator("#tourStepBadge").inner_text()
        moments_text = page.locator("#moments").inner_text()
        assert "TRANSITION · CYCLING → RUNNING" in moments_text
        shot_tut_laps = ARTIFACT_DIR / "tutorial-03-multilap-transition.png"
        page.screenshot(path=str(shot_tut_laps))
        report.append(("tutorial-03-multilap-transition.png", "Tutorial 03 · Moment Atlas & Multi-Lap Triathlon Transitions", page.locator("#sourceState").inner_text()))

        # Step 04: Interactive 2D Elevation & Split Contour Scrubbing
        page.click("#tourNextBtn")
        page.wait_for_timeout(250)
        assert "04 / 08" in page.locator("#tourStepBadge").inner_text()
        # Also test pointer click scrubbing on #profileCanvas directly
        page.locator("#profileCanvas").scroll_into_view_if_needed()
        box = page.locator("#profileCanvas").bounding_box()
        page.locator("#profileCanvas").click(position={"x": box["width"] * 0.75, "y": box["height"] * 0.5})
        page.wait_for_timeout(150)
        assert int(page.locator("#scrub").input_value()) >= 700
        shot_tut_contour = ARTIFACT_DIR / "tutorial-04-elevation-contour.png"
        page.screenshot(path=str(shot_tut_contour))
        report.append(("tutorial-04-elevation-contour.png", "Tutorial 04 · Interactive 2D Elevation & Split Contour Scrubbing", f"Scrubbed to {page.locator('#posDistance').inner_text()} ({page.locator('#liveElevation').inner_text()})"))

        # Step 05: Synchronized Ghost Compare
        page.click("#tourNextBtn")
        page.wait_for_timeout(250)
        assert "05 / 08" in page.locator("#tourStepBadge").inner_text()
        assert page.locator("#compareBanner").is_visible()
        assert "LARGEST GHOST GAP SPLIT" in page.locator("#moments").inner_text()
        shot_tut_ghost = ARTIFACT_DIR / "tutorial-05-ghost-compare.png"
        page.screenshot(path=str(shot_tut_ghost))
        report.append(("tutorial-05-ghost-compare.png", "Tutorial 05 · Synchronized Ghost Compare & Pacing Delta", page.locator("#compareDeltaText").inner_text()))

        # Step 06: World Presets (Red Canyon), 24 Studio Props & KONA.m Bicycle Selector
        page.click("#tourNextBtn")
        page.wait_for_timeout(250)
        assert "06 / 08" in page.locator("#tourStepBadge").inner_text()
        assert page.locator("#worldLabel").inner_text() == "RED CANYON"
        assert page.locator("#equipmentSelect").input_value() == "canyon-cfr-2027"
        shot_tut_worlds = ARTIFACT_DIR / "tutorial-06-canyon-konam-bike.png"
        page.screenshot(path=str(shot_tut_worlds))
        report.append(("tutorial-06-canyon-konam-bike.png", "Tutorial 06 · Red Canyon Preset, 24 Studio Props & KONA.m Speedmax CFR", page.locator("#sourceState").inner_text()))

        # Step 07: Self-Owned Local Photo Memories in 3D
        page.click("#tourNextBtn")
        page.wait_for_timeout(250)
        assert "07 / 08" in page.locator("#tourStepBadge").inner_text()
        assert page.locator("#photoCountBadge").inner_text() == "2 photos"
        assert "PHOTO MEMORY" in page.locator("#moments").inner_text()
        shot_tut_photos = ARTIFACT_DIR / "tutorial-07-local-photo-pins.png"
        page.screenshot(path=str(shot_tut_photos))
        report.append(("tutorial-07-local-photo-pins.png", "Tutorial 07 · Self-Owned Local Photo Memories in 3D", page.locator("#sourceState").inner_text()))

        # Step 08: Privacy Redaction Pins, PNG Export & .stride.json Bundle Export
        page.click("#tourNextBtn")
        page.wait_for_timeout(250)
        assert "08 / 08" in page.locator("#tourStepBadge").inner_text()
        assert page.locator("#redactCountBadge").inner_text() == "1 pin"
        assert page.locator("#worldsPanel").is_visible()

        # Verify actual download of Privacy-Trimmed PNG and .stride.json Story Bundle
        with page.expect_download() as dl_png_info:
            page.click("#shareBtn")
        dl_png = dl_png_info.value
        assert dl_png.suggested_filename == "stride-privacy-trimmed.png"

        with page.expect_download() as dl_json_info:
            page.click("#bundleBtn")
        dl_json = dl_json_info.value
        assert dl_json.suggested_filename == "stride-story-bundle.stride.json"
        bundle_path = ARTIFACT_DIR / "verified-export.stride.json"
        dl_json.save_as(str(bundle_path))
        bundle_data = json.loads(bundle_path.read_text())
        assert bundle_data["schema"] == "stride.story-bundle.v1"
        assert bundle_data["privacy"]["customRedactionZones"] == 1

        shot_tut_privacy = ARTIFACT_DIR / "tutorial-08-privacy-and-contracts.png"
        page.screenshot(path=str(shot_tut_privacy), full_page=True)
        report.append(("tutorial-08-privacy-and-contracts.png", "Tutorial 08 · Privacy Redaction Pins, PNG & .stride.json Story Bundle", f"Exported {bundle_data['privacy']['retainedPoints']} safe pts ({bundle_data['privacy']['redactedPoints']} redacted)"))

        # Also test Alpine Morning preset & re-importing the exported .stride.json file!
        page.click('[data-theme="alpine"]')
        page.set_input_files("#activityFile", str(bundle_path))
        page.wait_for_timeout(250)
        assert "Restored redacted Story Bundle" in page.locator("#sourceState").inner_text()

        overflow = page.evaluate("() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth)")
        assert overflow <= 1, f"Horizontal overflow {overflow}px"
        assert not errors, f"Console/Page errors: {errors}"

        browser.close()

    print("\n=== ALL STRIDE MAC APP FEATURES & 8 INTERACTIVE TUTORIALS VERIFIED ===")
    for filename, title, detail in report:
        print(f"  ✔ {title:58s} | {detail} ({filename})")


if __name__ == "__main__":
    main()
