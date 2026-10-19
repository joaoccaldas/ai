# Legal/rights/privacy gates / source checked 2026-10-19

**This is engineering risk guidance, not legal advice.**

First-party source: https://www.strava.com/legal/api_policy (effective 2026-06-01), agreement https://www.strava.com/legal/api, developer update https://communityhub.strava.com/insider-journal-9/an-update-to-our-developer-program-13428.

## High-risk prohibitions under current terms

- Strava API Data may be shown only to the specific authenticated user (Policy §2.3).
- API material/data cannot be used to develop/operate AI systems, including embeddings/RAG/grounding/model evaluation (§5.3).
- No API-derived aggregation, analytic processing, combination with other customer data, persistent graph/index or downstream product analytics (§§5.4–5.5).
- No Strava scraping, bulk harvesting, or unauthorized intermediaries/third-party MCP (§§5.5, 5.16).
- No competitor replication/look-and-feel imitation; pricing of platform-derived core functionality is restricted (§§5.2, 5.8).
- API cache expires within seven days; delete revoked/deleted data promptly (§§6.2–6.4, 7.4).
- Official Strava MCP is for personal use, not commercial third-party access (§3.5).
- Standard API tier availability/subscription caps, token rules and future endpoint migrations matter (§3, official developer announcement).

## STRIDE guardrails

1. No Strava API implementation, key, OAuth, MCP proxy, login or data syncing in MVP. No hidden connector dependency.
2. Direct activity files only, imported by their owner into the browser; do not imply this automatically clears every original provider/license contract.
3. No persistent GPS files by default, no analytics SDK sending coordinates, no third-party image generation using locations, no health-model pipeline from Strava API.
4. Generic procedural scenery and originally generated materials/meshes only in beta. Source imagery, map tiles, branded bicycles, celebrity likenesses and trademarks require individual permission/rights trace.
5. First/last 700m trimming is not complete location anonymity: visible intermediate places may still reveal personal patterns. Clearly warn user and allow private-only mode.
6. When exploring any Strava integration, seek developer/legal review of exact scopes, data paths, rendering, retention, pricing and exports *before implementation*.
7. For own-file cloud processing later: GDPR lawful basis, deletion/portability, controller/processor roles, encryption, region selection, incident plan, minors exclusion/consent and no auto-publish.