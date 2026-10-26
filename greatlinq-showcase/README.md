# ond.ai Spatial Studio — Greatlinq demo

The public page at [joaoccaldas.github.io/ai/greatlinq-showcase](https://joaoccaldas.github.io/ai/greatlinq-showcase/) is the ond.ai Greatlinq Demo.app site: the chaptered studio (Enter, Live, Featured, Worlds, Concepts, Objects, About, Next) plus the flagship, lantern, and hybrid pieces under `v2/`.

About João is `profile.json`, copied unchanged from the Mac demo (name, long bio, career, portraits).

## Run locally

From the repository root:

```bash
python3 -m http.server 8065
# http://127.0.0.1:8065/greatlinq-showcase/
```

`node verify.mjs` checks that the bio is present and that lantern, flagship, and vendor files resolve.

## Paths

The Mac app served this folder’s parent as the site root, so the studio used absolute URLs such as `/greatlinq-showcase/v2/...` and `/vendor/three@0.170.0/...`. GitHub Pages publishes the repo at `/ai/`, so those URLs would miss the prefix.

They are relative to this folder instead:

| Mac demo | Published file |
| --- | --- |
| `/greatlinq-showcase/mark.svg` | `mark.svg` |
| `/greatlinq-showcase/v2/flagship/` | `v2/flagship/` |
| `/greatlinq-showcase/v2/lantern/?embed=1` | `v2/lantern/?embed=1` |
| `/greatlinq-showcase/v2/hybrid/` | `v2/hybrid/` |
| `/vendor/three@0.170.0/...` | `vendor/three@0.170.0/...` |

From `v2/lantern/` and `v2/hybrid/`, Three.js is `../../vendor/three@0.170.0/...` (module import map and the lantern Draco decoder). The Mac lantern and hybrid pages pointed that import map at jsDelivr; the published pages use the vendored r170 build that shipped with the demo.

In-site `v2/` links still open in this tab (`Enter live`). Other catalog links stay external.

## Inventory

`img/inventory/` holds the internal stills (75 files from the Mac inventory packs). Catalog rows that use them are `external: false`, so they show when the header audience is Internal. The default audience is external.

## Not in this publish

- **`v2/hybrid/media/arch-film.mp4`** — not in the vendor/lantern pack. Hybrid keeps the night still (`arch-night.jpg`) and then opens the live arch.

## Android

The old evaluation APK wrapped the previous catalog, not this demo. See [ANDROID.md](ANDROID.md).
