#!/usr/bin/env python3
"""Build and install STRIDE.app, a native macOS Cocoa/WKWebView application
for STRIDE Athlete Worlds.

Points directly at the STRIDE worktree checkout and starts the local loopback
server on 127.0.0.1:8864 when not already running.
"""
import datetime
import json
import plistlib
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

NATIVE_DIR = Path(__file__).resolve().parent
STRIDE_DIR = NATIVE_DIR.parent
HOME = Path.home()
NAME = "STRIDE"
APP = HOME / "Applications" / f"{NAME}.app"
DESKTOP = HOME / "Desktop" / f"{NAME}.app"
DATA = HOME / "Library/Application Support/Stride"
PYTHON = Path("/opt/homebrew/bin/python3") if Path("/opt/homebrew/bin/python3").exists() else Path(sys.executable)


def find_node() -> str:
    for candidate in ["/opt/homebrew/bin/node", "/usr/local/bin/node", "/Users/joao/.local/nodejs/current/bin/node"]:
        if Path(candidate).exists():
            return candidate
    res = subprocess.run(["which", "node"], capture_output=True, text=True)
    return res.stdout.strip() or "node"


def run(*args, **kw):
    subprocess.run([str(a) for a in args], check=True, **kw)


def main():
    install = "--no-install" not in sys.argv
    stage = HOME / "Library/Caches/Stride/builds" / f"{NAME}-{uuid.uuid4().hex[:8]}.app"
    macos, res = stage / "Contents/MacOS", stage / "Contents/Resources"
    macos.mkdir(parents=True)
    res.mkdir()

    runtime = {
        "node": find_node(),
        "server": str(STRIDE_DIR / "server.mjs"),
        "root": str(STRIDE_DIR),
        "data": str(DATA),
        "port": "8864",
    }
    (res / "runtime.json").write_text(json.dumps(runtime, indent=2) + "\n")

    icon_png = stage.parent / "icon-1024.png"
    run(PYTHON, NATIVE_DIR / "make_icon.py", icon_png)
    iconset = stage.parent / "Stride.iconset"
    iconset.mkdir(exist_ok=True)
    for px, scale in [(16, 1), (16, 2), (32, 1), (32, 2), (128, 1), (128, 2), (256, 1), (256, 2), (512, 1), (512, 2)]:
        suffix = "@2x" if scale == 2 else ""
        run("/usr/bin/sips", "-z", px * scale, px * scale, icon_png, "--out", iconset / f"icon_{px}x{px}{suffix}.png", stdout=subprocess.DEVNULL)
    run("/usr/bin/iconutil", "-c", "icns", iconset, "-o", res / "Stride.icns")

    pkg = json.loads((STRIDE_DIR / "package.json").read_text())
    version = pkg.get("version", "0.4.0")
    info = {
        "CFBundleExecutable": "Stride",
        "CFBundleIdentifier": "ai.caldas.stride",
        "CFBundleName": NAME,
        "CFBundleDisplayName": "STRIDE Athlete Worlds",
        "CFBundleVersion": "4",
        "CFBundleShortVersionString": version,
        "CFBundlePackageType": "APPL",
        "CFBundleIconFile": "Stride.icns",
        "LSMinimumSystemVersion": "13.0",
        "NSHighResolutionCapable": True,
        "LSApplicationCategoryType": "public.app-category.sports",
        "NSAppTransportSecurity": {"NSAllowsLocalNetworking": True},
    }
    with (stage / "Contents/Info.plist").open("wb") as f:
        plistlib.dump(info, f)

    run("/usr/bin/swiftc", "-O", "-framework", "Cocoa", "-framework", "WebKit", NATIVE_DIR / "main.swift", "-o", macos / "Stride")
    run("/usr/bin/codesign", "--force", "--sign", "-", stage)
    run("/usr/bin/codesign", "--verify", "--deep", "--strict", stage)
    shutil.rmtree(iconset)

    if not install:
        print(json.dumps({"built": str(stage)}))
        return

    APP.parent.mkdir(exist_ok=True)
    backup = None
    if APP.exists():
        backups = DATA / "app-backups"
        backups.mkdir(parents=True, exist_ok=True)
        backup = backups / f"{NAME}-{datetime.datetime.now():%Y%m%d-%H%M%S}.bundle-backup"
        APP.rename(backup)
    stage.rename(APP)

    if not DESKTOP.exists() and not DESKTOP.is_symlink():
        DESKTOP.symlink_to(APP, target_is_directory=True)

    subprocess.run(["pkill", "-f", "projects/stride/server.mjs"], stderr=subprocess.DEVNULL)

    print(json.dumps({
        "app": str(APP),
        "desktop": str(DESKTOP),
        "previous": str(backup) if backup else None,
        "signing": "Local ad-hoc; verified",
        "serves": str(STRIDE_DIR),
        "port": 8864,
    }, indent=2))


if __name__ == "__main__":
    main()
