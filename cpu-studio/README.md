# CPU Studio — Build Through Time

A playable mobile-first educational computer-building game that starts with physical switches and LEDs in 1975 and grows into a modern creator workstation in 2026.

**Release:** v0.2.1, October 23, 2026. **Stage:** functional offline-first fundraising **vertical slice**, not a production multiplayer game or demonstrated product-market fit.

## Play in a browser

No npm install, backend or secrets needed:

```bash
cd cpu-studio
python3 -m http.server 4173
# http://localhost:4173
```

Run deterministic tests and build a portable single-file version:

```bash
npm test
npm run build
# host the generated dist/index.html on any static HTTPS service
```

The browser game remembers progress on this device in `localStorage` (v2). The v0.2.1 corrections retain save-format compatibility with v0.2; an old level-8 save already in progress may not start with the newly preinstalled DDR2 fault. If the browser erases site storage, local progress disappears. The first load requires internet when hosted, but service-worker caching enables subsequent offline use on compatible HTTPS browsers after all necessary assets have cached successfully. Do not promise offline availability if storage/cache is cleared.

## Features actually implemented

- **10 educator-authored configurations / 5 eras:** 1975, 1981, 1995, 2005, 2026.
- **Evolving spaces and UI:** switches + LEDs → green CRT → multimedia desktop → LAN den → creator studio; stable controls throughout.
- **Build loop:** tap components to install into real functional slots, power up, see contextual error diagnostics, correct failures.
- **Progression:** next mission/era, XP, completed-machine museum, persistent local saves.
- **Economy:** earn credits for first-time completed builds; curated store; buy, keep, remove and sell spare parts; anti-double-reward protections and no grind required for mandatory progression.
- **Trading demo:** explicit offline non-player-character bartering for three deterministic collector artifacts, no online player exchange.
- **Social demonstration:** share/import a read-only blueprint URL containing only part IDs and level number, no private data; no real shared inventory.
- **Optional daily question:** rotating technical challenge with 30 credits / 25 XP, one reward per local calendar day, no streak penalties.
- **Privacy:** no logins, chat, cookies, external analytics, payments or tracking SDKs. Progress is only local and can be reset.

**Explicitly not implemented:** server-side data ownership, actual player-to-player trade, authoritative coins, monetization, parent/teacher controls, content moderation, account syncing, community gallery feed, public game metrics, external multiplayer, production security audits.

## Honest educational model

The game teaches *component role, compatible interfaces and common boot failures* using representative historic configurations. It is **not** an exact hardware emulator and it does **not** let you assemble every cable and jumper on a physical motherboard. A lab-issued motherboard/case/drive interface is treated as preinstalled in early levels; modern power and cooling must be installed explicitly. See [`docs/historical-sources.md`](docs/historical-sources.md) for each historical rule and limitation.

## Technical structure

```
index.html + styles.css           accessible mobile-first interface
src/catalog.mjs                 historical data, missions, hardware & lessons
src/engine.mjs                  deterministic pure reducer, compatibility, money ledger
src/main.mjs                    DOM adapter, local persistence, safe sharing
sw.js                           same-origin service-worker caching
assets/icon.svg                 brand icon
tests/engine.test.mjs            30 zero-dependency engine tests
tests/dom_smoke.test.mjs         4 DOM adapter smoke tests
tests/browser_verify.py         real-browser test script (requires permitted Chromium)
scripts_bundle.py               deterministic self-contained deployment artifact
docs/                           PRD, sources, funding pilot & implementation evidence
```

No external fonts, JS libraries, images or CDNs in the runtime. The state-machine reducer is DOM-independent and ready to back a future authoritative API. Local-only money is intentionally not treated as tamperproof. Trading/multiplayer needs a server with authenticated, atomic transfers, age-aware access and abuse handling.

## Repository and launch status

This directory is designed to be published at `https://joaoccaldas.github.io/ai/cpu-studio/`. The verified public deployment, Git commit and release gate are documented in `docs/release-gate.md` after publication. This version has 33 passing engine/DOM smoke tests. A live browser agent verified the preceding v0.2 public Vercel preview, but **390px/iOS/Android visual QA for v0.2.1 is not yet verified**.

Start with [`docs/product-prd.md`](docs/product-prd.md), [`docs/game-economy-and-social.md`](docs/game-economy-and-social.md), and [`docs/pilot-plan.md`](docs/pilot-plan.md) when pitching or deciding what to build next.
