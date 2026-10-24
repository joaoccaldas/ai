# Page disposition

Checked 2026-10-21 against links in `projects/noema` (HTML, JS, Python, Markdown, workflows). No legacy page was deleted.

## Retain

These are the product or the records it opens.

| Page | Role |
| --- | --- |
| `index.html` | Home |
| `explore.html`, `entity.html`, `concept.html` | Explore and the records it opens |
| `human-meaning-atlas.html`, `deep-time.html`, `history.html` | Atlas and time |
| `lineages.html`, `patterns.html`, `compare.html`, `simulations.html` | Connections |
| `research.html`, `library.html`, `review.html`, `cognition.html`, `drh.html` | Research, including the library |
| `gods.html`, `rituals.html`, `altered-states.html`, `belief-systems.html` | Explore satellites still linked from in-section navigation |
| `observatory.html` | Optional 3D depth layer |
| `sources-v1.html`, `religion-decomposition.html`, `research-health.html`, `automation-pulse.html` | Linked research workbenches |

## Merge later

Keep the files until the surviving page covers the same job and inbound links are moved.

| Page | Merge into | Why |
| --- | --- | --- |
| `observatory-v6.html` | `observatory.html` | Previous observatory generation. No inbound link in this repo. |
| `dashboard-v1.html` | `research.html` / research health | Older command center. It throws because a node it expects is missing. No inbound link in this repo. |
| `deep-time-compare.html` | `compare.html` or `deep-time.html` | Overlapping comparison surface. No inbound link in this repo. |

## Deprecate, do not delete yet

`observatory-v6.html`, `dashboard-v1.html`, and `deep-time-compare.html` are the deprecation candidates. They are still valid URLs if someone bookmarked them. Remove them only after a production referrer check shows they are unused.

P0 pages are not deprecation candidates.
