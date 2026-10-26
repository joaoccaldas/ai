#!/bin/bash
# Build NOEMA.app with the Command Line Tools Swift compiler and install it.
# Full Xcode is not required. xcodebuild is unused because this machine's
# developer directory is CommandLineTools, not Xcode.app.
set -euo pipefail

MAC_DIR="$(cd "$(dirname "$0")" && pwd)"
NOEMA_DIR="$(cd "$MAC_DIR/.." && pwd)"
INSTALL="${1:-$HOME/Applications/NOEMA.app}"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/noema-mac.XXXXXX")"
APP="$WORK/NOEMA.app"
SDK="$(xcrun --show-sdk-path --sdk macosx)"

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$MAC_DIR/Info.plist" "$APP/Contents/Info.plist"

swiftc -parse-as-library -O -swift-version 5 \
  -sdk "$SDK" \
  -target arm64-apple-macosx14.0 \
  -framework AppKit \
  -framework SwiftUI \
  -framework WebKit \
  -framework Combine \
  -o "$APP/Contents/MacOS/NOEMA" \
  "$MAC_DIR/Sources/NOEMAApp.swift" \
  "$MAC_DIR/Sources/Destination.swift" \
  "$MAC_DIR/Sources/StaticServer.swift" \
  "$MAC_DIR/Sources/BrowserModel.swift" \
  "$MAC_DIR/Sources/ContentView.swift" \
  "$MAC_DIR/Sources/SmokeTest.swift"

WEB="$APP/Contents/Resources/web"
mkdir -p "$WEB/data" "$WEB/ontology"
ditto "$NOEMA_DIR/site" "$WEB/site"
ditto "$NOEMA_DIR/data/reference" "$WEB/data/reference"
ditto "$NOEMA_DIR/data/candidates" "$WEB/data/candidates"
ditto "$NOEMA_DIR/ontology" "$WEB/ontology"
find "$WEB" -name '.DS_Store' -delete

python3 "$MAC_DIR/make_icon.py" "$WORK/icon-1024.png"
ICONSET="$WORK/AppIcon.iconset"
mkdir -p "$ICONSET"
sips -z 16 16 "$WORK/icon-1024.png" --out "$ICONSET/icon_16x16.png" >/dev/null
sips -z 32 32 "$WORK/icon-1024.png" --out "$ICONSET/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$WORK/icon-1024.png" --out "$ICONSET/icon_32x32.png" >/dev/null
sips -z 64 64 "$WORK/icon-1024.png" --out "$ICONSET/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$WORK/icon-1024.png" --out "$ICONSET/icon_128x128.png" >/dev/null
sips -z 256 256 "$WORK/icon-1024.png" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$WORK/icon-1024.png" --out "$ICONSET/icon_256x256.png" >/dev/null
sips -z 512 512 "$WORK/icon-1024.png" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$WORK/icon-1024.png" --out "$ICONSET/icon_512x512.png" >/dev/null
cp "$WORK/icon-1024.png" "$ICONSET/icon_512x512@2x.png"
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

# Ad-hoc signature, no sandbox entitlement. NOEMA.entitlements is the profile
# for a later Developer ID build (loopback server plus outbound source links).
# This copy stays outside the sandbox so Launch Services can open the ad-hoc app
# and so a smoke test can write screenshots next to the source tree.
codesign --force --sign - "$APP"
codesign --verify --verbose=2 "$APP"

osascript -e 'quit app "NOEMA"' >/dev/null 2>&1 || true
if pgrep -x NOEMA >/dev/null 2>&1; then
  pkill -x NOEMA || true
  sleep 0.4
fi

mkdir -p "$(dirname "$INSTALL")"
rm -rf "$INSTALL"
ditto "$APP" "$INSTALL"
# Local builds usually have no quarantine attribute. Clear it anyway so
# Gatekeeper does not treat a recopied bundle as a downloaded app.
xattr -dr com.apple.quarantine "$INSTALL" 2>/dev/null || true
codesign --force --sign - "$INSTALL"
codesign --verify --verbose=2 "$INSTALL"

echo "Installed $INSTALL"
echo "Bundle id: ai.caldas.noema.mac"
du -sh "$INSTALL"
