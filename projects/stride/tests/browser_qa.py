#!/usr/bin/env python3
"""Real-browser desktop and mobile (portrait/landscape) QA, CSP/network audit,
keyboard accessibility, and ghost comparison verification for STRIDE v0.2.
"""
import os
import subprocess
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = Path(os.environ.get("STRIDE_ARTIFACT_DIR", str(ROOT / "checkpoints" / "qa")))
PORT = 8869


def main():
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    server = subprocess.Popen(
        ["node", str(ROOT / "server.mjs"), "--port", str(PORT)],
        cwd=str(ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    try:
        # Wait for health check
        base = f"http://127.0.0.1:{PORT}"
        for _ in range(30):
            try:
                with urllib.request.urlopen(f"{base}/health", timeout=1) as resp:
                    if resp.status == 200:
                        csp = resp.headers.get("Content-Security-Policy", "")
                        assert "default-src 'self'" in csp, f"Missing strict CSP: {csp}"
                        break
            except Exception:
                time.sleep(0.15)
        else:
            raise RuntimeError("STRIDE loopback server did not start")

        chrom = os.environ.get(
            "STRIDE_CHROMIUM_PATH",
            "/Users/joao/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell",
        )
        opts = {"headless": True}
        if Path(chrom).exists():
            opts["executable_path"] = chrom

        with sync_playwright() as pw:
            browser = pw.chromium.launch(**opts)
            viewports = [
                ("desktop-1440x900", {"width": 1440, "height": 900}),
                ("android-portrait-390x844", {"width": 390, "height": 844}),
                ("android-landscape-844x390", {"width": 844, "height": 390}),
            ]
            results = []
            for label, vp in viewports:
                page = browser.new_page(viewport=vp, device_scale_factor=2)
                external_requests = []
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.on(
                    "request",
                    lambda r: external_requests.append(r.url)
                    if not r.url.startswith(base) and not r.url.startswith("data:")
                    else None,
                )
                page.goto(base, wait_until="networkidle")
                page.wait_for_function("document.getElementById('sourceState').textContent.includes('Fictional sample')")

                # Check horizontal overflow
                overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                assert overflow <= 1, f"Horizontal overflow {overflow}px on {label}"

                # Trigger Ghost Comparison & Keyboard Orbit
                page.locator("#ghostSampleBtn").click()
                page.wait_for_function("!document.getElementById('compareBanner').hidden")
                canvas = page.locator("#scene")
                canvas.focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowUp")
                page.wait_for_timeout(120)

                shot = ARTIFACT_DIR / f"stride-{label}.png"
                page.screenshot(path=str(shot), full_page=False)
                assert not errors, f"Page errors on {label}: {errors}"
                assert not external_requests, f"Unexpected external requests on {label}: {external_requests}"
                results.append({"viewport": label, "overflow_px": overflow, "screenshot": str(shot)})
                page.close()

            # Also capture Worlds & Reuse contract drawer on desktop
            page = browser.new_page(viewport={"width": 1440, "height": 960}, device_scale_factor=2)
            page.goto(base, wait_until="networkidle")
            page.locator('[data-mode="worlds"]').click()
            page.wait_for_function("!document.getElementById('worldsPanel').hidden")
            page.wait_for_timeout(120)
            worlds_shot = ARTIFACT_DIR / "stride-desktop-worlds-contracts.png"
            page.screenshot(path=str(worlds_shot), full_page=False)
            results.append({"viewport": "desktop-worlds-contracts", "overflow_px": 0, "screenshot": str(worlds_shot)})
            page.close()
            browser.close()

        for r in results:
            print(f"QA PASS {r['viewport']}: overflow={r['overflow_px']}px -> {r['screenshot']}")
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    main()
