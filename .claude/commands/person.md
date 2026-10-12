---
description: Research one person in depth and add or update their node, links and mysteries
argument-hint: <name or id>
---
Load the `shajare` skill. Research `$ARGUMENTS`:

1. Find whether the person exists in `data/` (grep by id and Persian name). Update in place; never duplicate.
2. Establish: religion and branch at birth and in power (`rel`; Sunni/Shia and sub-branch, Christian church, etc.), family (parents, spouses, children, in-laws), education and trainers, patrons, the cohort they belonged to, roles with years, wealth sources, media they owned or controlled, every documented identity change (mask), every outside tie, and how they died or lost power.
3. For each claim record `tier` and `src`. Seek at least one source from a camp hostile to the person and one friendly to them.
4. Current rumors about the person go into a mystery with evidence for and against and concrete `next` steps.
5. Add any new people needed as link endpoints (minimal nodes are fine, marked with sources).
6. Run `node tools/validate.mjs` to zero errors. Report in Persian what changed and what remains unverified.
