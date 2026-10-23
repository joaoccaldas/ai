# Economy, engagement, and social trust boundaries

## Borrow principles, not addiction mechanics

Roblox documentation recommends a short first-time user experience, starter resources, immediate progression and visible medium/long-term goals. CPU Studio applies that to: **install → test → diagnose → earn → acquire → next build**. The current prototype can finish all ten levels using earned money without doing a daily quest or paying anything. This is essential to an educational game.

## Finite starter economy

- Starting funds: 35 fictional credits.
- Players receive client-provided starter parts at the start of each new job. The workshop catalog contains 27 parts, each with an era, interface type and educational explanation.
- Levels 2–10 require buying **one** featured part using prior mission rewards. All necessary components are affordable with no grinding. Test: `a player can complete all ten missions with zero grinding or payments`.
- First-time stage payouts total 1,925 credits. Mandatory featured-part purchases total 785 credits. Including starting credits yields an end balance of **1,175** credits without side quests, optional purchases or barters.
- Optional daily correct-answer quest: +30 credits and +25 XP, once per calendar day stored locally. Incorrect answers have no cost and are retryable.
- Optional sell-back: 50% of listed part price for genuine surplus inventory. Never sell the last uninstalled required part for an active build.
- No premium currency, microtransactions, advertising or random rewards.

## Repeat visit design

1. Curiosity: new eras reveal unfamiliar media, interface forms and computing concepts.
2. Autonomy: choose how many components to buy, collect or swap (even when mandatory missions are simple).
3. Competence: each machine starts and failures produce real technical explanations.
4. Social expression: share a safe read-only design with a friend who can open the link.
5. Sustainable refresh: optional question of the day; a player never loses rewards/streak progress for missing a day.

## Social maturity levels

| Stage | Feature | Risk / control |
|---|---|---|
| Implemented now | **Read-only blueprint link** (level + known component IDs) | Validated against allowed schema; contains no wallet, profile or user data. No backend. |
| Implemented now | **NPC barter** | Deterministic fictional collectors. Atomic reducer exchange of spare part for an archival artifact. Not represented as P2P. |
| Next gated pilot | **Curated build galleries** | Moderated, view-only preapproved design sets; no user-uploaded text/photo/chat for kids without parental and moderation safeguards. |
| Later after legal/security review | **Friend-only player trading** | Trusted account login; age appropriate access/consent; both parties lock exact items in escrow; explicit two-party confirmation; transactional server commit, anti-duplication, audit ledger, rate limits, rollback/dispute process, fraud/abuse reports and moderation. |
| Only if proven appropriate | **World events, co-op challenges** | Peer safety, guardian controls, opt-in, no pressure or forced social interaction. |

### Hard blocker to real trading

Local storage is editable by the player. A client-only coin/inventory ledger **cannot guarantee ownership or trading safety**. Deploying real P2P trades on this architecture is categorically out of scope. A production marketplace must be server-authoritative with database transactions, authenticated ownership, and strong minor protections.

## Safety by design

- Trading is never about sending money, account credentials, addresses or off-platform goods.
- No loot boxes, cash-in cash-out, FOMO scarcity or pressure to log in daily.
- No trading with strangers in MVP. The bartering partners are fictional NPCs.
- Offline gameplay stores no personal identifying data. Read-only URL tokens encode nonpersonal known IDs only.
- Future real users, schools and children imply a privacy impact assessment, security testing and a safeguarding review before public social launch.

## Pilot analytics design

Current build **does not send telemetry anywhere**. For a research pilot, collect participant consent and conduct on-device observation with anonymous codes, or introduce privacy-reviewed event collection later. Capture:

`first_open → first_part_tap → all_slots_filled → power_test → first_success → first_store_view → first_purchase → next_mission → day_1_return → day_7_return`

Also use an unseen pre/post comprehension quiz on CPU/RAM/storage/compatibility. Treat conversion, retention and learning uplift as **unknown** until measured with real consented participants.
