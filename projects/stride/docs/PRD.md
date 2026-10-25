# Product requirements / v0.1

## Vision

Athletic histories become **explorable spatial memories**. The post-session experience changes from consuming an activity feed to understanding and remembering a personal physical achievement. Delight must never conceal uncertainty.

## Jobs to be done

1. Post-activity: "Show me where the effort actually happened in a way I want to revisit." (primary)
2. Reflection: "Help me understand a route, climb, pacing change or improvement without drowning me in charts." (primary)
3. Personal archive: "Make my races and meaningful training days feel like places I can return to." (follow-on)
4. Share: "Let me tell the story safely without exposing home or health information." (restricted beta)
5. Coach/race organizer/brand: "Create memorable, permissioned stories from athlete-owned evidence." (future, rights-gated)

## Non-goals

No feed, leaderboards, subscriptions, route planner, training prescriptions, social graph, AI model training from imported tracks, Strava lookalike, automatic Strava API ingestion, persistent GPS history, pseudo-real geolocation terrain, medical-grade analytics or claim that every scene is a digital twin.

## Core UX

Landing -> fictional sample (one tap) -> import activity -> overview with route and 4 truthful metrics -> scrub/play/orbit -> click highlights -> select procedural world theme -> optional privacy-reviewed local export. Registration never precedes value. Three-click-or-less return to meaningful content. Accessible keyboard equivalents and reduced-motion handling required.

## Feature scoring (hypotheses 1-5)

| Feature | Value | Differentiation | Feasibility | Priority |
|---|---:|---:|---:|---|
| Deterministic Moments/1km splits | 5 | 4 | 5 | P0 |
| Styled perspective scene + camera | 5 | 3 | 4 | P0 |
| Privacy-safe import/no account | 5 | 4 | 5 | P0 |
| Race comparison over same course | 5 | 5 | 3 | P1 |
| Exact geography/DEM tile streamer | 4 | 3 | 2 | P2 |
| Historical race world and heritage museum | 4 | 5 | 2 | P2 |
| Cinematic cloud video exports | 4 | 2 | 3 | P2 |
| Direct Strava API as core source | 2 | 1 | 1 | HOLD: policy |

Scores are judgments, not market evidence.

## Target users & hypotheses

Early beachhead: runners and cyclists who already save activity files and enjoy revisiting event experiences; second: triathletes revisiting race landmarks and equipment, third: coaches and race organizers looking for consented story experiences. Validate this ranking with 12–20 structured usability interviews across sports/device classes; measure willingness to pay from observed conversion, not survey sentiment alone.

## Activation metric

Primary: share of first-time users who load a valid route and interact with a meaningful moment within 90 s. Supporting metrics: import completion, time to first meaningful scene, interaction depth, insight understanding, repeat usage within 14 days, % successful redacted exports, browser FPS, device battery impact. No third-party analytics on track data. Only aggregate opt-in anonymous, source-independent product telemetry later if lawful.

## Initial user test gates

At least 5 different activity-file variants from consenting testers, 3 device classes including low-end Android, 2 screen-reading/keyboard evaluations, manual spot-check of kilometer splits against trustworthy reference, anonymization challenge evaluation, and strong qualitative evidence that the experience is more useful than a stock flyover. Beta not public until these gates have observed evidence.