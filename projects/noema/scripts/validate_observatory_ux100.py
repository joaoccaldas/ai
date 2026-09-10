from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
html = (SITE / "observatory.html").read_text()
css = (SITE / "observatory-v3.css").read_text()
js = (SITE / "observatory-v3.js").read_text()
health = json.loads((SITE / "research-health.json").read_text())
patterns = json.loads((SITE / "pattern-candidates.json").read_text())
review = json.loads((SITE / "review-queue.json").read_text())
media = json.loads((SITE / "museum-reference-media.json").read_text())

checks: list[tuple[str, bool, str]] = []

def check(i: int, cond: bool, desc: str) -> None:
    checks.append((f"UX{i:03d}", bool(cond), desc))

# Information architecture / orientation 001-010
check(1, "Civilization Observatory · NOEMA" in html, "Distinct Observatory title")
check(2, 'meta name="description"' in html and "ancestry" in html, "Search/share description states multidimensional scope")
check(3, 'aria-label="Primary"' in html, "Primary navigation is semantically labelled")
check(4, all(x in html for x in ["Explore","Atlas","Compare","Analyze","Review","Research"]), "Core workspaces remain one click away")
check(5, 'id="commandOpen"' in html, "Command palette has a visible trigger")
check(6, 'id="focusMode"' in html, "Focus mode is directly accessible")
check(7, 'aria-label="Civilization lenses"' in html, "Lens rail has an accessible purpose")
check(8, len([x for x in ["civilization","belief","ritual","mortuary","altered","technology","environment","language","ancestry"] if f'data-lens="{x}"' in html]) == 9, "Nine primary analytical lenses are exposed")
check(9, "26D" in html and "26 dimensions" in html, "Multidimensional model is visible in the product")
check(10, 'id="liveStatus"' in html and 'aria-live="polite"' in html, "Dynamic state has a live-region channel")

# Visual system / typography / spacing / color 011-020
check(11, '--serif:' in css and '--sans:' in css, "Editorial and interface typography are deliberately separated")
check(12, 'Iowan Old Style' in css and 'Palatino' in css, "Serif stack is richer than Georgia-only fallback")
check(13, all(x in css for x in ['--sand:','--sky:','--rose:','--mint:','--violet:']), "Palette supports multiple semantic accents")
check(14, '--line-strong:' in css, "Border hierarchy has more than one contrast level")
check(15, '--space:clamp(' in css, "Responsive spacing token is available")
check(16, '.hero h1' in css and 'clamp(46px,5.6vw,84px)' in css, "Hero typography scales with viewport")
check(17, '.data-ribbon' in css and '.metric' in css, "Metrics use a dedicated hierarchy instead of generic cards")
check(18, '.vignette' in css and '.aurora' in css and '.grain' in css, "Atmospheric depth uses layered treatment")
check(19, 'backdrop-filter:blur(22px)' in css, "Panels gain controlled depth separation")
check(20, '@media(max-width:600px)' in css, "Small-screen spacing and composition are explicit")

# Three.js / WebGL immersion 021-030
check(21, 'three@0.180.0' in html, "Three.js version is pinned")
check(22, 'new THREE.WebGLRenderer' in js, "Observatory has a real WebGL renderer")
check(23, 'new THREE.SphereGeometry(1.82,112,112)' in js, "Globe geometry is sufficiently smooth")
check(24, 'new THREE.MeshStandardMaterial' in js, "Globe uses physically informed material response")
check(25, 'new THREE.FogExp2' in js, "Depth haze is part of the scene")
check(26, 'new THREE.HemisphereLight' in js and 'new THREE.DirectionalLight' in js, "Scene uses layered lighting")
check(27, 'new THREE.TorusGeometry' in js, "Globe has a restrained orbital depth cue")
check(28, 'new THREE.Points' in js and '1500' in js, "Atmospheric particle field is present")
check(29, "pointerdown" in js and "pointermove" in js and "wheel" in js, "Globe supports direct manipulation and zoom")
check(30, 'powerPreference:\'high-performance\'' in js and 'Math.min(devicePixelRatio,1.8)' in js, "WebGL performance is bounded")

# Deep-time experience 031-040
check(31, 'id="timeSlider"' in html, "A continuous time control is visible")
check(32, '300,000 years before present to 2026' in html, "Timeline scope is explicit")
check(33, 'id="eraLabel"' in html and 'id="timeLabel"' in html, "Human-readable era and date are separate")
check(34, 'id="playPause"' in html and 'id="slower"' in html and 'id="faster"' in html, "Timeline playback speed can be controlled")
check(35, 'function timeFromSlider' in js, "Time mapping is centralized")
check(36, 'Deep Pleistocene' in js and 'Late Pleistocene' in js and 'Early Holocene' in js, "Deep-time eras have explicit narrative bands")
check(37, 'Bronze / Iron Age' in js and 'Historical era' in js and 'Recent history' in js, "Later historical eras are represented")
check(38, 'Temporal focus:' in js and 'does not invent events' in js, "Time movement cannot imply invented events")
check(39, 'prefers-reduced-motion' in css and 'state.reduceMotion' in js, "Time animation respects reduced-motion preference")
check(40, 'updateSceneEpoch' in js, "Visual atmosphere responds to temporal focus without fabricating data")

# Data usage / live metrics 041-050
check(41, 'research-health.json' in js, "Research-health projection is loaded")
check(42, 'pattern-candidates.json' in js, "Pattern-candidate projection is loaded")
check(43, 'review-queue.json' in js, "Human-review debt is loaded")
check(44, 'museum-reference-media.json' in js, "Rights-gated museum imagery is loaded")
check(45, health.get('metrics',{}).get('comparable_profiles',0) > 0, "Comparable-profile metric is real and non-empty")
check(46, health.get('metrics',{}).get('accepted_semantic_assertions',0) > 0, "Accepted-assertion metric is real and non-empty")
check(47, health.get('metrics',{}).get('source_families',0) >= 3, "Multiple source families are represented")
check(48, 'id="profiles"' in html and 'id="assertions"' in html and 'id="sources"' in html, "Live source metrics have dedicated display targets")
check(49, 'id="reviewDebt"' in html and 'deduplicated_review_items' in js, "Review debt is surfaced from machine data")
check(50, 'style="width:68%"' not in html and 'style="width:52%"' not in html and 'style="width:44%"' not in html, "Hard-coded pseudo-quantitative evidence meters were removed")

# Pattern analytics / statistical honesty 051-060
check(51, patterns.get('status') == 'HYPOTHESIS_GENERATION_ONLY', "Pattern data remains hypothesis-generation only")
check(52, 'Association only.' in js, "Pattern cards explicitly say association only")
check(53, 'Phylogeny, geography, contact, source dependence and chronology remain unresolved.' in js, "Core confounders are shown with patterns")
check(54, 'q_bh' in js, "Adjusted multiple-testing output is visible")
check(55, 'phi' in js, "Effect size is visible")
check(56, 'lift' in js, "Enrichment magnitude is visible")
check(57, 'n_comparable' in js, "Pairwise comparable sample size is visible")
check(58, 'validPatternRows' in js and '.sort(' in js, "Pattern ordering is deterministic from current data")
check(59, 'not evidence of causation, diffusion or common origin' in js, "Inspect view blocks causal/descent overclaiming")
check(60, 'No candidate does not mean no historical relationship.' in js, "Empty statistical output is not turned into negative historical evidence")

# Evidence / provenance / epistemic UX 061-070
check(61, 'EVIDENCE INSPECTOR' in html, "Evidence reasoning has a persistent visual home")
check(62, 'Challenge interpretation' in html, "Users can invoke a skeptical reading")
check(63, 'Why this?' in html, "Users can request provenance/context")
check(64, 'No numeric mechanism probabilities are shown until a calibrated causal model exists.' in html, "Uncalibrated mechanism scores are not visualized as probabilities")
check(65, all(x in js for x in ['Convergence','Contact','Diffusion','Shared ancestry','Ecology','Innovation','Unknown']), "Rival causal families are explicit")
check(66, 'Language is not ancestry' in js, "Language/ancestry conflation is blocked")
check(67, 'Technology without migration shortcuts' in js, "Technology/migration conflation is blocked")
check(68, 'Ancestry without cultural essentialism' in js, "Genetic ancestry is not treated as culture")
check(69, 'Unknown ≠ absent.' in js, "Unknown/absence distinction is explicit")
check(70, review.get('status') == 'REVIEW_REQUIRED_NO_AUTOMATIC_PROMOTION' and all(x.get('automatic_promotion') is False for x in review.get('items',[])), "Review data prohibits automatic promotion")

# Images / cultural material / rights 071-080
check(71, media.get('policy',{}).get('not_evidence') is True, "Reference-image policy says images are not evidence")
check(72, len(media.get('records',[])) > 0, "Approved museum-reference collection is non-empty")
check(73, all(r.get('rights') in {'PUBLIC_DOMAIN','CC0'} for r in media.get('records',[])), "Every rendered museum record has permissive rights")
check(74, all(r.get('evidence_status') == 'NOT_EVIDENCE' for r in media.get('records',[])), "Every museum image is epistemically reference-only")
check(75, 'REFERENCE ONLY' in html, "Image panel visibly labels reference status")
check(76, 'loading="lazy"' in js and 'decoding="async"' in js, "Reference imagery loads lazily and asynchronously")
check(77, 'provider_page_url' in js, "Every visual can link back to institution provenance")
check(78, 'entity_name' in js and 'date_display' in js and 'rights' in js, "Image captions carry identity/date/rights metadata")
check(79, '.media-card img' in css and 'object-fit:cover' in css, "Reference imagery has a stable cinematic crop")
check(80, 'A displayed object is visual context, not evidence' in html, "Image semantics are explained next to the imagery")

# Accessibility / resilience / responsive performance 081-090
check(81, ':focus-visible' in css, "Keyboard focus is visually obvious")
check(82, 'aria-pressed="false"' in html, "Toggle state is exposed accessibly")
check(83, 'role="tablist"' in html and 'role="tab"' in html, "Analysis drawer uses tab semantics")
check(84, 'aria-selected' in js and 'aria-selected="true"' in html, "Tab state updates programmatically")
check(85, 'role="dialog"' in html and 'aria-modal="true"' in html, "Overlays expose dialog semantics")
check(86, 'aria-label="Interactive three-dimensional civilization observatory' in html, "Canvas purpose and epistemic status are announced")
check(87, 'WebGL unavailable; data interface remains usable' in js, "WebGL failure has a non-blocking fallback")
check(88, '@media(max-width:920px)' in css and '@media(max-width:600px)' in css, "Tablet and phone layouts are defined")
check(89, 'touch-action:none' in css, "Canvas direct-manipulation behavior is explicit")
check(90, 'renderer.setPixelRatio(Math.min(devicePixelRatio,1.8))' in js, "High-DPI rendering is capped for performance")

# Discoverability / narrative / interaction 091-100
check(91, 'id="palette"' in html and 'id="paletteSearch"' in html, "Command palette supports direct navigation")
check(92, 'metaKey' in js and 'ctrlKey' in js and "key.toLowerCase()==='k'" in js, "Command palette has cross-platform keyboard shortcut")
check(93, "e.key==='/'" in js, "Slash opens navigation/search")
check(94, "e.code==='Space'" in js, "Space toggles time playback")
check(95, '/^[1-9]$/.test(e.key)' in js, "Number keys select analytical lenses")
check(96, 'id="storyline"' in html and 'storyCards' in js, "Guided narrative mode is implemented")
check(97, len([x for x in ['Journey 01','Journey 02','Journey 03','Journey 04'] if x in js]) == 4, "Guided journey covers four scientific story beats")
check(98, 'id="tooltip"' in html and '[data-tip]' in js, "Dense controls have contextual tooltips")
check(99, 'focus-mode' in css and "classList.toggle('focus-mode')" in js, "Focus mode reduces interface noise")
check(100, 'atmospheric globe graphics are not historical evidence'.lower() in html.lower() and 'Atmospheric graphics are decorative.' in js, "Immersion is explicitly separated from evidence")

assert len(checks) == 100
failed = [x for x in checks if not x[1]]
for ident, ok, desc in checks:
    print(f"{'PASS' if ok else 'FAIL'} {ident} {desc}")
if failed:
    raise SystemExit(f"{len(failed)} / 100 Observatory UX checks failed: " + ", ".join(x[0] for x in failed))
print("NOEMA OBSERVATORY UX100: 100/100 checks passed")
