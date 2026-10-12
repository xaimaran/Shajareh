---
description: Investigate a rumor or open mystery and move it with evidence
argument-hint: <mystery-id or the rumor in words>
---
Load the `shajare` skill. Investigate `$ARGUMENTS`.

1. If it is a new rumor, create an `SH.mystery` in the era file where it belongs, with the claim stated exactly as it circulates and where it circulates.
2. Trace the rumor to its earliest traceable source: who first said it, when, and what they gained by saying it.
3. Gather evidence for and against from different camps: primary documents, archives, books, memoirs, period newspapers, recorded interviews or videos (cite channel, date, speaker). Each item gets `tier` and `src`; add new sources to `data/sources.js` with honest `bias`.
4. Change `status` only if the evidence justifies it: `supported`, `weakened`, `debunked`, or `solved`. Otherwise keep `open` and sharpen `next`.
5. Never delete the mystery. Run `node tools/validate.mjs` to zero errors.
6. Report in Persian: the rumor's origin, strongest evidence each way, the verdict and its confidence.
