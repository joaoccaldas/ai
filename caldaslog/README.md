# CaldasLog MVP

CaldasLog is a privacy-first family operations hub for parents in Sweden. It consolidates fragmented school, sports, calendar, email and wardrobe information into one calm daily plan.

The deployed GitHub Pages prototype is intentionally **synthetic**. It contains no real child records, credentials, school messages, club messages or household identifiers.

## Product thesis

Parents do not primarily need another inbox. They need a reliable answer to four questions:

1. What changed?
2. What must somebody do?
3. When and where must the family move?
4. What must be packed, worn, signed or paid?

CaldasLog therefore normalizes incoming items into a small family graph:

- household
- child
- source
- event
- action
- place
- wardrobe item
- consent and retention policy

## What the MVP demonstrates

- Immersive WebGL story and family-signal visual language
- Unified daily briefing
- Source-aware family timeline
- Action queue with household ownership
- Clothing and equipment carousel
- Safe connection model for InfoMentor, MyClub, email and calendar
- Local interactive mock service layer
- Responsive mobile and desktop layouts
- Reduced-motion accessibility support

## Safe integration strategy

### InfoMentor

InfoMentor publicly describes APIs and integration capabilities, but those are primarily positioned for schools, municipalities and contracted system integrations. A parent-facing product should not assume access to a private API or reverse-engineer authenticated traffic.

MVP ingestion order:

1. Authorized notification email ingestion
2. Calendar export or official feed when available
3. Explicit file/share import from the parent
4. Official provider partnership or school-authorized API integration

Sensitive actions such as absence reporting, formal replies and BankID-backed flows remain deliberate deep links to InfoMentor.

### MyClub

MyClub publicly describes an API for publishing selected information such as calendars, news and groups to organization websites. That does not imply unrestricted access to private member data.

MVP ingestion order:

1. Activity invitations and changes from authorized email
2. Official calendar or public team feed where available
3. User-triggered share/import
4. Contracted provider API for private member data

Attendance responses, payments and profile changes remain deliberate actions in MyClub until an official delegated authorization model exists.

### Explicitly excluded

- Password storage
- BankID automation
- Browser scraping behind authenticated sessions
- Session-cookie replay
- CAPTCHA bypass
- Hidden background actions on behalf of a parent
- Training models on child data
- Publishing real family data in a public repository

## Production architecture

Recommended production stack:

- **Web/PWA:** Next.js or React + TypeScript, WebGL layer isolated from core workflows
- **API:** TypeScript service or Supabase Edge Functions
- **Database:** PostgreSQL with row-level security per household
- **Auth:** passkeys or a Nordic identity provider; household invitation and guardian verification
- **Jobs:** EU-region queue for email/feed normalization
- **Storage:** encrypted EU object storage, short retention by default
- **AI:** structured extraction with schema validation; no autonomous external actions
- **Observability:** append-only audit events without sensitive source payloads

`supabase-schema.sql` contains a starting data model and household isolation policies.

## Scaling sequence

### Phase 0: synthetic prototype

Validate whether the daily briefing, timeline, action queue and wardrobe carousel are understandable in under one minute.

### Phase 1: one-household pilot

Use one read-only source, preferably a dedicated forwarded-email address or a narrow mailbox permission. Measure:

- minutes saved per week
- missed events or deadlines
- duplicate purchases avoided
- percentage of extracted items corrected by the parent

### Phase 2: household collaboration

Add co-parent ownership, read receipts, handoffs, conflict detection and child-appropriate views.

### Phase 3: provider partnerships

Pursue official InfoMentor and MyClub access, publish adapter contracts and certify each connector independently.

### Phase 4: Swedish family platform

Add additional school systems, sports platforms, healthcare appointments, municipal information and equipment lifecycle management without turning the product into a surveillance archive.

## Local run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Privacy gate before real data

Before any real household data is processed:

- identify the controller and processors
- establish a lawful basis for each purpose
- perform a documented risk assessment and determine whether a DPIA is required
- define retention and deletion schedules
- document provider terms and permitted automation
- test household isolation, export, revocation and deletion
- run a security review and incident exercise

This repository is a product prototype, not legal advice.
