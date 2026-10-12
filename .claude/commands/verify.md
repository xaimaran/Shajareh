---
description: Check claims against the actual text of a source and mark it verified
argument-hint: <source-id> | all-unchecked
---
Load the `shajare` skill. Verify `$ARGUMENTS`.

1. Run `node tools/validate.mjs` first and fix any errors.
2. For the source (or each `checked: false` source, most-cited first): list every person, link and mystery citing it (grep its id in `data/`).
3. Obtain the actual text: a free scan or edition (archive.org, national library digital collections, publisher previews, the user's own copies when they provide them). If the text cannot be obtained, say so and leave `checked: false`.
4. For each citing claim: confirm, correct, downgrade the tier, or move it into a mystery. Note page or section numbers in the claim's `note` where possible.
5. Set `checked: true` only when every citing claim was compared with the text.
6. Report in Persian: confirmed, corrected, downgraded, and still unverifiable claims.
