# 3-hour engineering/research cycle

The 3-hour ChatGPT STRIDE Engineering Cycle was enabled on 2026-10-19 at 23:41 UTC after explicit user approval to pause the overlapping KONA.m Weekly Agenda. Verify actual run receipts and GitHub work each cycle; a configured scheduler does not establish successful autonomous code execution.

## Per cycle (bounded execution, not reports only)

0. Read the canonical branch and latest checkpoint; read CI, open PR/issue blockers; compare code/UX evidence with previous run.
1. Check whether data/rights/API/commercial assumptions materially changed (authoritative first-party check, not broad search every run).
2. Audit inventory before creation. Record new reusable source candidates only when actual git paths and revision IDs are available.
3. Rank ten actions by `0.35 * user impact + 0.25 * information gain + 0.20 * reuse leverage + 0.10 * feasibility + 0.10 * risk reduction`, each scored 0–5. Record dependencies and confidence, not invented dates.
4. Choose **one bounded improvement** with an independently verifiable outcome, especially a P0 bug. Make a branch/PR; no automatic merge or deploy.
5. Run relevant deterministic tests, static checks and visual/device QA when tools allow. If a test can't run, mark UNKNOWN; inspect CI after commit.
6. Write checkpoint keyed by run UTC timestamp + SHA + PR + change/test evidence + measured UX delta + top 10 next actions + blockers + approvals needed. Avoid dumping raw user tracks, prompts, secrets or heavy screenshots into public GitHub.
7. Notify only on material verified progress, P0 blockers, release/privacy decision or a need for approval. No-run is acceptable if no safe action exists.

## Scheduler capacity and scope

An autonomous ChatGPT scheduler must be explicitly enabled, available, and able to access GitHub; it is not a guarantee of production engineering. A local/CI implementation can eventually run via private jOS when rights and budget allow, but never duplicate scheduling authority or create unattended PR floods. If automation slots full, the workflow stays MANUAL/PENDING until an existing task is deliberately paused or consolidated by owner approval.

## Checkpoint schema

`{run_id, triggered_at_utc, repo_sha, prior_checkpoint, policy_version, changed_files, test_results:[{command,outcome,evidence}], qa_results:[{device,viewport,source,outcome}], done, only_proposed, blocked, ui_delta, measured_impact, next_10:[{title,why,how,dependency,confidence}], next_one, prs, approval_requests}`.

Evidence ladder: source-inspected < implemented < tests-passed < real device QA < released & verified < measured downstream user outcome. No promotion by speculation.