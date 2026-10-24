# ond.ai / Greatlinq Spatial Showcase — review candidate

A **self-contained visitor-only web presentation** adapted from the editorial selection in the private *Spatial Studio / A Living Atlas* catalog. This is a **new static demonstration**, not a mirror of the private Atlas and not a replacement for the canonical production apps. No private snapshot, inventory, research notebook, pipeline, asset validation report, IP diligence, or internal network URL is shipped.

## Run locally

```bash
python3 -m http.server 8065
# Open http://localhost:8065/
```

## Visitor journeys

- **Show me around**: Automatic guided tour. The Spark (90 seconds), The Journey (3 minutes), The Expedition (7 minutes). A single declarative list of timed stops changes app pages and selected scenes/models/concepts. Pause, resume, skip forward/back, exit.
- **Let me explore**: Manual navigation among Overview, Worlds, Objects, Transform and Possibilities, with a final Pilot Ideas page.
- **Live source work**: Approved-for-selection *public* repository assets and links from `joaoccaldas/konam`, `joaoccaldas/studio-kona`, `joaoccaldas/bellagio` and `joaoccaldas/ai`. Assets are loaded from their public GitHub CDN and should be individually license-reviewed before any public promotion.
- **Actual 3D viewer**: GLTFLoader / Three.js loads publicly committed GLB files with orbit and auto-rotation. When offline, unsupported or blocked, the original public preview image stays visible. No recreated asset binary is added to this bundle.
- **Greatlinq concepts**: Intelligent product showroom, shared architecture review and industrial training, explicitly labelled *future collaboration*, not built Greatlinq integrations. The industrial pump illustration is an original explanatory schematic, **not the private semantic pump GLB**.

## External publication is **not approved**

The ond.ai governance charter reserves brand, rights and publication approval to the founder. This is a review artifact. Do not send to Greatlinq, attach it to an unrestricted public host, announce an endorsed partnership or merge without the owner's affirmative review. The design follows proposed ond.ai typography and colors, whose adoption remains pending.

## Origin and boundaries

- Original private editorial source: `joaoccaldas/nonamecompany/apps/spatial-studio/ROOM_COLLECTIONS.json` and `PROJECT_STORIES.json` (read only). Only author-curated summaries made it into this standalone code; originals are never queried by the visitor.
- Visual sources are individually named public GitHub paths in `app.js`. No native models from private infrastructure are exported.
- Greatlinq’s own website (`greatlinq.com/about-virtual-reality`) describes T.2 avatar-led 3D meetings/training. Third-party performance and interoperability claims are not independently verified.
- Proposed shared scenarios are UI storytelling only. No synchronous avatars, voice AI, Unreal/T.2 adapter, e-commerce, CRM, production authentication, headset certification or deployment validation is represented as working.
- Independent KONA / Canyon / Bellagio brand or city-inspired concept illustrations do **not** imply affiliation with brand owners or Greatlinq. Always clear source and image rights prior to external use. Published versions of scenes may differ from current local work.

## Quality acceptance checks

Run `node verify.mjs`. Check browser at **390, 768 and 1440 px**, and perform a user journey. Tour must advance through features, not just captions. Verify linked source permissions, asset availability, visual quality, safe statuses, disabled third-party integration, reduced motion and correct text before publication. Since `raw.githubusercontent.com` and the Three.js CDN are required for models, test actual connectivity. Never treat a synthetic browser pass or a code-only check as release authorization.

## Next governance gate

Owner reviews curation, brand, proposed claims and third-party asset rights. Greatlinq must confirm its own SDK/asset interface and ability to run a bounded pilot before shared session capabilities can be presented as integrated. Deployment should be separate from the private Atlas, with preview access controls as appropriate.