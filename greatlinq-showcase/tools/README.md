# Link & asset registry (Greatlinq / Spatial Studio)

`app/link-registry.json` is the single index: every catalog item id -> its destination (`room`, `page`, `local`, `project`, or `none` + why).
The app reads it first (`resolveUrl`), so adding a card is: add it to `catalog.json`, add its line to the registry, run the check.

    node tools/check-links.mjs --konam ~/Developer/konam --online     # run before every publish / commit

Fails on: duplicate ids, unmapped items, orphan registry rows, two cards sharing one room/page, undeclared project landings,
unacknowledged duplicate titles, `?room=` areas not declared (and not found in the Kona source when --konam is given),
missing images, `none` without a reason, and (with --online) any URL not returning 200.
`gen-registry.mjs` was the one-off bootstrap that froze the verified links into the registry; do not re-run it over hand edits.
Suggested wiring: `.github/workflows` job or a pre-commit hook running the command above.
