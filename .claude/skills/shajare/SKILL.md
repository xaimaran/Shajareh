---
name: shajare
description: Method, data schema and workflow for the Iran power-genealogy research project (شجره‌نامه قدرت). Use whenever researching an era, adding or editing a person, link, group, source or mystery in data/, verifying sources, or changing the viewer (index.html, assets/). Covers the "mask" pattern being traced, evidence tiers, source-bias handling, file layout and the validation step.
---

# Shajare — power genealogy of Iran, Aq Qoyunlu to today

## Goal
Trace the people who held power in Iran from the Aq Qoyunlu (pre-Safavid) to the current Islamic Republic: who produced them, who trained or raised them, whom they married, whom they killed or betrayed, which outside power they came from or served, and when they changed identity ("mask"). Output: offline Persian HTML (`index.html`) reading structured data in `data/`, plus Persian research notes in `notes/`.

All user-facing content (data values, notes, HTML text) is **Persian**. Keys/ids stay English kebab-case.

## Dates: Jalali only
Every year in `data/`, `notes/` and the viewer is **Jalali (solar hijri, ش)** — numeric fields (`born`, `died`, `active`, `roles[].from/to`, `masks[].year`, era `start/end`) and years inside Persian text alike. Sources give Gregorian or lunar-hijri dates; convert on entry:
- Gregorian date on/after 21 March → Jalali = G − 621; before 21 March → G − 622. If only the year is known, use G − 621 and do not claim more precision.
- Lunar hijri (ق) → convert via Gregorian. For old texts keep the original lunar year in parentheses in source `year` fields only, e.g. `'۷۳۷ ش (۷۵۹ ق)'`.
- Book titles that contain Gregorian years stay as published.
`tools/validate.mjs` rejects any year above the current Jalali year (catches Gregorian slipped in).

## Religion: always explicit
Every person has `rel`: an ordered list of religion ids from `data/religions.js`, from birth faith to faith while in power. Muslims are always marked by branch (`sunni`, `shia12`, `ghulat`, `zaydi`, `ismaili`); Christians by church (`orthodox`, `armenian`, `catholic`, `protestant`); also `jewish`, `zoroastrian`, `babi`, `bahai`, `secular`, `unknown`. Put law school, Sufi order, sincerity doubts and evidence in the free-text `faith`. A change of religion (`rel.length > 1`) must also be recorded as a `mask` with tier and source. Use `unknown` rather than guessing; contested faith becomes a mystery. Add a new id to `religions.js` when needed (e.g. Yazidi, Ahl-e Haqq, Mandaean).

## Completeness: no missing rulers
Every era must list **all** power holders, not a selection. Build each era from complete lists first, then add depth:
- every ruler of every dynasty that held Iran or part of it, in order, including short reigns, child shahs, nominal shahs, co-rulers, rival claimants and regents (e.g. Mirwais and Abdul-Aziz Hotak, Suleiman II, Ismail III);
- every grand vizier / vakil / sadr-e azam / prime minister, every head of the main institutions (army commander, chief cleric, intelligence, treasury) and every president, leader and speaker in modern eras;
- foreign rulers only where they acted on Iran (invaders, patrons, refuges).
Sources for lists: Bosworth *New Islamic Dynasties*, Iranica, Persian chronicles, Wikipedia list pages (`wiki-lists`) as a checklist only. Cross-check two lists; a name missing from data is a defect, not a choice. When an era file grows too large, put the remaining office-holders in a supplement file `data/eNNb-<era>-<topic>.js` (loaded right after `eNN`), not in a later era's file.

## Kings: crown and ordinal
`data/kings.js` holds one `SH.dynasty({ id, name, src, note?, foreign?, kings: [...] })` per dynasty, in order of accession. Entries are ids, or `{ id, n?, claim?, note? }`:
- `n` = the ruler's historical number in the dynasty; omitted → previous + 1. The viewer shows a crown next to the name everywhere (nav, Gantt, hierarchy, tree, detail, modal): the first ruler shows the crown alone, the Nth ruler the crown and `×N`.
- `claim: true` = claimant, nominal shah or de-facto regent: faded crown, no number, not counted.
- `foreign: true` dynasty = ruler outside Iran or vassal (Ottoman, Mughal, Durrani, Georgian, Shirvan): grey crown, number only when `n` is given.
Every king or claimant added to any era file must be added here in the same change. A person appears in one dynasty only. The validator fails on unknown ids or duplicates and warns about people with ruling roles missing from `kings.js`.

## Tabari and early sources
Use Tabari (*Tarikh al-rusul wa al-muluk*, `tabari`) wherever a lineage, legitimacy or religious claim reaches back to the early Islamic or Sasanian period: claimed descent from Imams or Sasanian kings (e.g. the Shahrbanu legend, Safavid sayyid claims), the origin of tribes and titles, or precedents a dynasty invoked. Tabari's narrative ends in 302 ق (≈ 294 ش), so he can confirm or be silent on early claims, never on later events; record his silence as evidence (`against` or `for`) in the mystery. Compare with Ibn Sa'd, Baladhuri, Mas'udi and Shi'i sources (Kulayni, Mufid) for the same claim.

## The patterns to look for
Tag people with these (Persian tags in `tags`):
- **نقاب** — documented change of faith, ethnicity, name, allegiance or claimed lineage that preceded or enabled power (e.g. Christian Georgian → Muslim ghulam governor; Sufi master → Shi'i shah; "Tahmasp-Quli" → Nader Shah). Record in `masks[]`, never only in prose.
- **دست‌پرورده** — trained as a cohort by an institution or foreign body and later placed in roles (ghulams, seminary lineages, military academies, parties, foreign-trained officers). Use `training` links.
- **وصلت-سیاسی** — marriage as alliance. `marriage` links.
- **برکشیدن-و-کشتن** — raised to power and later killed by the patron. Pair a `patronage` link with a `killed` link.
- **عامل-خارجی / اتحاد-خارجی / دست‌نشانده / پناهنده** — tie to an outside power. Record in `ties[]` with `kind`.
- **امتناع-از-نقاب** — refused the mask and was removed. These control cases matter as much as the masked.
- **نسب-ساختگی**, **روحانیت-وارداتی**, **شاه‌ساز**, **منبع-انسانی** (the witness is also a player).

## Evidence rules (non-negotiable)
Every tie, mask, link and mystery evidence carries `tier` and `src`.
| tier | name | meaning |
|---|---|---|
| 1 | مستند | primary document, official archive, sanctions listing, court record, the person's own signed act |
| 2 | معتبر | academic study, or 2+ independent sources from different camps |
| 3 | ادعا | single source, partisan source, or memoir with motive |
| 4 | شایعه | rumor. **Kept, never deleted.** Goes into a `mystery` with evidence for and against |

- Never invent a link, ancestry, conversion or foreign tie to fit the pattern. If evidence shows no foreign root, record none. An empty result is a result.
- Rumors are not discarded and not believed: each becomes `SH.mystery` with `for[]`, `against[]`, `next[]`, `status`. Status moves only on new evidence.
- **Every power's media and archives serve that power** — British, American, Russian/Soviet, Chinese, French, Ottoman/Turkish, Israeli, Saudi, the Pahlavi state and the Islamic Republic alike. No camp is trusted by default. Weight goes to (a) primary documents, (b) facts confirmed by *opposing* camps, (c) facts that hurt the source's own side. Record each source's `bias`.
- `checked: false` on a source means claims citing it were written from prior knowledge and not yet compared with the text. Set `checked: true` only after reading the actual text (or a scan/translation of it) and fixing any claim it does not support. Say plainly in the session which claims were checked.
- Living people: only tier 1–2 for ties and masks; tier 3–4 allowed only inside a mystery with explicit counter-evidence and `next` steps. No speculation in `summary`.
- Dates after the model's knowledge (anything recent) must come from a source fetched in the session, cited.

## Portraits
For each era, write `tools/portraits/<era>.tsv` (`id<TAB>English Wikipedia title`), run `node tools/portraits.mjs tools/portraits/<era>.tsv`. It downloads the article's lead image into `assets/portraits/<id>.jpg` (320px, avatars) and `assets/portraits/full/<id>.jpg` (900px, opened in the click-to-zoom modal; the modal falls back to the small image if the large one is missing), throttles and retries on HTTP 429, and prints `id, file, license, artist`. Then **look at every downloaded image** (Read tool) for anything not obviously a portrait: delete coins, maps, buildings, coats of arms, title pages and same-name wrong people. Add only the verified ones to `assets/portraits/list.js` with file name and license (Edit, by hand). Living people: only freely licensed images, never cropped from news sites.

## Files
```
index.html            viewer; loads data/*.js in order — add every new data file here
assets/app.js         viewer logic (no dependencies, offline)
assets/icons.js       Font Awesome Pro regular icons used by the UI, inlined as SVG (sources in assets/icons/)
assets/portraits/     <id>.jpg images + list.js manifest (file, license)
assets/style.css      theme (light/dark), Vazirmatn fonts in assets/fonts/
data/core.js          registry: SH.religion/power/source/era/group/person/link/mystery
data/religions.js     religion and branch ids with Persian names and colors
data/powers.js        outside powers and origin-roots (add new ones here)
data/sources.js       all sources (one place)
data/eras.js          eras with summary, status, agenda
data/eNN-<era>.js     groups, people, links, mysteries of one era
data/eNNb-<era>-*.js  supplement for the same era (complete office-holder lists), loaded after eNN
data/kings.js         ruler lists per dynasty → crown and ordinal in the viewer (loaded after all era files)
data/influence.js     foreign interventions (SH.intervention), loaded after kings.js
data/threads.js       long threads across regimes (SH.thread), loaded after influence.js
data/prisons.js       prisons (SH.prison) and every spell in custody, exile or house arrest (SH.jail), loaded last
notes/                Persian research notes: roadmap, library, influence, threads, one log per era
tools/validate.mjs    read-only check: node tools/validate.mjs
```

## Schema
```js
SH.person({
  id: 'kebab-id', name: 'نام فارسی', alt: ['نام‌های دیگر'],
  era: 'era-id', groups: ['primary-group', 'other-group'],   // first group = where it is drawn
  born: 949, died: 1007,                  // Jalali; omit if unknown; use active: [from, to] for a known span
  death: 'natural|killed|executed|poisoned|battle|unknown|alive', deathNote: '',
  origin: 'تبار و خاستگاه',
  rel: ['orthodox', 'shia12'],            // REQUIRED, ordered birth → in power; ids from data/religions.js
  faith: 'مکتب، طریقت، تردیدها',
  roles: [{ t: 'عنوان', from: 967, to: 1007 }],
  masks: [{ year, from: 'هویت پیشین', to: 'هویت تازه', note, tier, src: [] }],
  ties: [{ power: 'britain', kind: 'origin|kin|ally|agent|client|refuge|trade|education|enemy', tier, note, src: [] }],
  summary: '۱ تا ۳ جمله', tags: [], src: [],
});
SH.link({ from, to, type, tier, note, src: [] });
// type: blood (parent→child) | training (teacher→student) | patronage (patron→raised) | succession
//       | marriage | kin | faction | foreign | killed (killer→victim) | betrayal (traitor→betrayed) | enmity
SH.group({ id, era, kind: 'dynasty|order|tribe|institution|faction|clergy|foreign|network|party|military|merchants|media', power?, name, summary });
SH.source({ id, short, title, author, year, kind: 'primary|archive|academic|memoir|press|reference|polemic|video', lang, bias, where?, checked: false });
SH.mystery({ id, era, title, status: 'open|supported|weakened|debunked|solved', people: [], claim,
             for: [{ t, src: [], tier }], against: [{ t, src: [], tier }], next: [] });
// data/influence.js — one act of an outside power on Iran (feeds the «نفوذ خارجی» view)
SH.intervention({ id: 'iv-…', year, end?, powers: ['usa', 'britain'], kind, title, placed: [], removed: [], people: [], tier, note, src: [], mystery? });
// kind: control  coup | install | remove | occupation | puppet | transition | payroll | intel | security
//       partner  advisers | treaty | economy | arms | mediation | protect
//       hostile  pressure | war        limit  restraint (power declined to defend — counter-evidence to «control»)
// placed/removed only with evidence that this power did it; contact alone goes in people. powers.js `bloc: west|east` groups the camps.
// data/threads.js — a foundation, network or foreign hand followed across regimes (feeds the «رشته‌ها» view)
SH.thread({ id: 'th-…', kind: 'foundation|network|foreign|pattern', power?, name, question, summary,
            verdict: { kind: 'continuous|shifted|broken|contested', t }, steps: [{ y, t?, p: [], ref?, tier?, src?, k?: 'break|claim' }] });
// ref points to an existing record and the step inherits its tier/src:
//   'link:FROM>TO:TYPE' | 'iv:ID' | 'mask:PERSON:INDEX' | 'tie:PERSON:POWER' | 'my:MYSTERY'
// a step without ref needs its own tier and src. Give kind 'foreign' threads their power (colour and power filter).
```
Record every outside act with the same tier/src rules, including acts *against* the hypothesis (sanctions votes, refusals, restraint). The view's score counts recorded data only; never add or inflate an event to move it.
```js
// data/prisons.js — who was held, where, by whom, with whom, and how it ended (feeds the «زندان» view)
SH.prison({ id, name, city?, note? });   // a named place, so cellmates (same place, overlapping years) can be computed
SH.jail({ who, from, to?, when?, at?, place?, kind, by, out, with?: [], confess?, mystery?, note, tier, src: [] });
// kind: prison | fortress | house | exile | internment (held by a foreign power) | hostage | captive
// by:   jailer = a group id (Iranian state of that era) or a power id (foreign jailer)
// out:  released | pardon | repent | amnesty | escape | exchange | deal | power | transfer | executed | killed | died | ongoing | unknown
// to missing = end unknown (unless out = ongoing); from missing = undated, then `when` is required. with = documented cellmates.
```
Record every spell in custody for every person, with tier and src like a tie. Prison is where cohorts form, interrogations happen and people are turned, so the view flags special releases (pardon, repentance, escape, deal, straight to power), public confessions, foreign custody, deaths in custody and prisoners who later ran security or courts. These are signals for research, never a verdict: a spying claim goes into a mystery with evidence on both sides. Never invent a cellmate; overlap is computed only from a recorded place and years.
Threads add no new facts: put the fact in its era file first, then reference it. The «who was behind» matrix weighs Iranians' ties (agent/client 3 = control, ally/trade 1, refuge 0.5), foreign agents' own ties as presence only (1, never control), and control/partner interventions, all × tier weight. Threads judge historical claims (coercion, forged lineage, institutional continuity), never the truth of a faith.
Bridge people (who cross eras) belong to the era where they held power; link across eras freely.

## Workflow for an era
1. Read `data/eras.js` (agenda), `notes/roadmap.md`, `notes/library.md`, the previous era's file (for bridge nodes).
2. Get the complete lists first (see Completeness), then list power holders by layer: ruler/court → military → clergy → bureaucrats/viziers → merchants/financiers → media/opinion (from 1216 ش newspapers on) → foreign agents present. Add every ruler and claimant to `data/kings.js`.
3. For each: religion and branch (`rel`), origin, training, patrons, marriages, masks, ties, fate. Convert every date to Jalali. Search out who trained cohorts and where the cohort went.
4. Pull rumors of the era into mysteries.
5. Add new sources to `sources.js` with honest `bias`. Persian, Russian, Ottoman/Turkish, Arabic and Chinese sources must be sought, not only Western ones.
6. Write `data/eNN-<era>.js`, add its `<script>` to `index.html`, set era `status: 'draft'`.
7. Run `node tools/validate.mjs` — zero errors before finishing. Fix warnings where possible.
8. Fetch and verify portraits (see Portraits).
9. Write `notes/eras/NN-<era>.md`: what was added, what is unchecked, open questions.
10. Update the era's `status`, its row in `notes/roadmap.md`, and close any bridge nodes the previous era left open.

## Hard rules
- Create files with Write, change them with Edit. Never write or modify project files through scripts, heredocs, sed or node/python one-liners.
- One fact, one place: structured facts live in `data/`; `notes/` explains, it does not duplicate tables.
- Do not delete a mystery or a tier-4 claim; change its status with evidence.
- Keep the viewer offline: no CDN, no remote fonts, no fetch.
