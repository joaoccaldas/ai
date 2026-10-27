# NOEMA for Mac

Native macOS window for the NOEMA site. Bundle id `ai.caldas.noema.mac`. The pages, catalogs, and rights captions are the files already in `projects/noema`. The app does not add evidence.

Home, Explore, and the journeys are the site itself. A sidebar and the Go menu open Home, Explore, Odin, Witches, and Gods. Back and forward are Command-[ and Command-]. Links that leave the catalog open in the browser.

The window is a reading shell: porcelain field, a chapter title in the toolbar, and an opening plate until the first page arrives. Inside the app the page hides its own Home / Explore / Atlas bar (`html.nm-mac`); the sidebar is the only navigation. The last destination is remembered on this Mac. Scroll position is remembered for the session, and across launches, from the page itself. A smoke run always starts at Home and does not restore a previous place. Nothing in the shell adds a source, a date, or a row.

The site loads JSON with `fetch()`. WebKit does not run `fetch()` from `file://`, so the app serves the bundled `site/`, `data/reference`, `data/candidates`, and `ontology` trees on `127.0.0.1` only.

## Open

```bash
open ~/Applications/NOEMA.app
```

## Build and install

This machine's developer directory is the Command Line Tools, not `Xcode.app`, so `xcodebuild` cannot configure a project here. `build.sh` compiles with `swiftc`, assembles `NOEMA.app`, ad-hoc signs it, and copies it to `~/Applications`.

```bash
projects/noema/mac/build.sh
```

The app bundles a copy of the site. After the reading changes on main, run that script again and reopen `NOEMA.app`. Until then the Mac window is still the previous pages.

Pass another destination as the first argument to install somewhere else. The script clears `com.apple.quarantine` if that attribute is present.

`NOEMA.entitlements` is the sandbox profile (loopback server and outbound network) for a later Developer ID build. The ad-hoc app installed by `build.sh` is not sandboxed, so Launch Services can open it without a provisioning profile.

## Smoke test

```bash
open ~/Applications/NOEMA.app --args --smoke /tmp/noema-smoke
```

The app quits when the check finishes. Results land in `report.json` and PNG files in that directory. `evidence/` is one such run: the installed app’s window on Home, Home search, Explore, the witches journey, and the gods journey.
