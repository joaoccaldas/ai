# Privacy and integration decision record

## Decision

CaldasLog will not use credential scraping or unattended browser automation for InfoMentor or MyClub in its MVP.

## Why

The product processes information about children, schedules, schools, sports participation and household behavior. That creates a higher trust threshold than a generic productivity aggregator.

Provider login flows may include contractual restrictions, anti-automation controls, session tokens and strong authentication. Replaying those credentials in a third-party product would increase security, legal and operational risk while producing a brittle connector.

## Allowed connector modes

| Mode | MVP | Conditions |
|---|---:|---|
| User-forwarded notification email | Yes | Dedicated address; allowlist senders; read-only parsing |
| Narrow mailbox permission | Yes | Folder/label scope where technically possible; revocable |
| Official calendar feed/export | Yes | Read-only; preserve source and update timestamps |
| Explicit user upload/share | Yes | Clear retention choice and immediate deletion option |
| Public provider feed | Yes | Only content the provider/organization intentionally publishes |
| Official delegated provider API | Later | Contract, documented scopes, audit and revocation |
| Stored portal username/password | No | Prohibited |
| BankID automation | No | Prohibited |
| Authenticated browser scraping | No | Prohibited without explicit provider authorization |
| Autonomous payments/attendance/absence | No | Parent confirmation and official action surface required |

## Data minimization

By default, retain normalized facts instead of full source content:

- event title, date, place and source link
- action title, due date, owner and completion state
- wardrobe need and reason
- extraction confidence and parent correction

Do not retain class lists, unrelated attachments, full message histories or contact details merely because they were available.

## AI boundary

AI may:

- classify a source item
- extract dates, places and requested actions
- summarize a message
- detect conflicts
- propose a packing or handoff action

AI may not:

- submit absence
- accept an invitation
- pay an invoice
- message a teacher or coach
- alter a child profile
- infer sensitive traits

without a clear parent review and confirmation step through an authorized interface.

## Production gates

1. Provider terms and technical permission reviewed
2. Controller/processor roles documented
3. Lawful basis documented per purpose
4. Risk assessment completed and DPIA need determined
5. Household isolation penetration-tested
6. Secret storage and token revocation tested
7. Deletion/export verified end-to-end
8. Incident response rehearsal completed
9. Extraction quality measured on redacted test data
10. Parent-facing source, confidence and correction controls shipped
