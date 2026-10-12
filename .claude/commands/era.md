---
description: Research one era of the power genealogy and add it to the data and viewer
argument-hint: <era-id> e.g. afshar | zand | qajar | mashruteh | pahlavi1 | pahlavi2 | revolution | ir-today
---
Load the `shajare` skill and follow its "Workflow for an era" for era `$ARGUMENTS`.

- Start from the era's `agenda` in `data/eras.js` and the bridge nodes already present from the previous era.
- Cover every layer of power: ruler/court, military, clergy, bureaucracy, money (merchants, concession holders, industrialists), media (newspapers once they exist), and foreign agents on the ground.
- Trace cohorts: who trained whom (schools, seminaries, academies, lodges, parties, foreign missions) and where each cohort ended up.
- Every tie, mask and link needs `tier` and `src`. Rumors become mysteries with evidence on both sides.
- Write `data/eNN-$ARGUMENTS.js`, register it in `index.html`, set the era to `draft`, run `node tools/validate.mjs` until it reports zero errors, and write `notes/eras/NN-$ARGUMENTS.md`.
- End with a short Persian report: people added, strongest documented masks/ties found, open mysteries, and which sources still need checking against their text.
