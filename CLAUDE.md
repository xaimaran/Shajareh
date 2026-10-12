# شجره‌نامه قدرت در ایران

Research project tracing power holders in Iran from the Aq Qoyunlu to today: lineage, training cohorts, patronage, marriages, killings, identity changes ("masks") and ties to outside powers.

- Load the `shajare` skill before any work on `data/`, `notes/` or the viewer. It holds the method, evidence tiers, schema and workflow.
- Commands: `/era <id>`, `/person <name>`, `/mystery <id|rumor>`, `/verify <source-id|all-unchecked>`.
- All content is Persian. Ids and keys are English kebab-case.
- Viewer is fully offline: open `index.html` directly in a browser. No CDN, no remote fonts, no fetch.
- Validate after every data change: `node tools/validate.mjs` (read-only). Zero errors before finishing.
- Never delete rumors or mysteries; move their status with evidence.
- Never invent links or ancestry to fit the pattern. No camp's media or archive is trusted by default.
