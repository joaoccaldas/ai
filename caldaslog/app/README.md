# CaldasLog working app

CaldasLog is a local-first family operations application for consolidating school, sports, actions, packing needs and clothing readiness.

## Working functionality

- Responsive desktop and mobile application shell
- Persistent browser storage through `localStorage`
- Unified today dashboard and chronological family timeline
- Event, action and clothing creation
- Action workflow: to do → in progress → done
- Clothing workflow: ready → laundry → review
- MyClub-compatible ICS file import
- Search across events, actions and clothing
- Private JSON backup and restore
- Complete local deletion
- Synthetic demonstration data only in the repository

## Safety boundary

The app does not request or store InfoMentor, MyClub or BankID credentials. It does not replay sessions or scrape authenticated child records. The current integration path is read-only import plus explicit parent input. Provider portals remain the system of record for attendance, absence reporting, payments and sensitive replies.

## Open

GitHub Pages publishes this folder at:

`https://joaoccaldas.github.io/ai/caldaslog/app/`

## Production evolution

The next backend phase should replace local-only persistence with Supabase Auth and the household-isolated schema in `../supabase-schema.sql`. Cloud sync must preserve row-level security, audit imports, support deletion and avoid storing raw provider messages unless the household explicitly enables retention.
