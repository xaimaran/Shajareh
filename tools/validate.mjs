// اعتبارسنجی فقط‌خواندنی داده‌ها: node tools/validate.mjs
// فایل‌های data/ را به همان ترتیب index.html بارگذاری می‌کند و ارجاع‌های شکسته، شناسه‌های تکراری،
// مقادیر نامعتبر و فایل‌های جاافتاده از index.html را گزارش می‌دهد. هیچ فایلی را تغییر نمی‌دهد.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="(data\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const onDisk = readdirSync(join(root, 'data')).filter((f) => f.endsWith('.js')).map((f) => `data/${f}`);

const problems = [];
const warn = [];
onDisk.filter((f) => !scripts.includes(f)).forEach((f) => problems.push(`فایل در index.html بارگذاری نمی‌شود: ${f}`));

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of scripts) {
  try { vm.runInContext(readFileSync(join(root, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { problems.push(`خطای اجرا در ${f}: ${e.message}`); }
}
const S = ctx.window.SH?.store;
if (!S) { console.error('داده بارگذاری نشد.'); process.exit(1); }

const LINK_TYPES = ['blood', 'training', 'patronage', 'succession', 'marriage', 'kin', 'faction', 'foreign', 'killed', 'betrayal', 'enmity'];
const DEATH = ['natural', 'killed', 'executed', 'poisoned', 'battle', 'unknown', 'alive'];
const TIE_KINDS = ['origin', 'kin', 'ally', 'agent', 'client', 'refuge', 'trade', 'education', 'enemy'];
const MSTATUS = ['open', 'supported', 'weakened', 'debunked', 'solved'];
const ESTATUS = ['draft', 'pending', 'verified'];

const ids = (arr, kind) => {
  const m = new Map();
  arr.forEach((x) => { if (m.has(x.id)) problems.push(`شناسه تکراری (${kind}): ${x.id}`); m.set(x.id, x); });
  return m;
};
const P = ids(S.people, 'people'), E = ids(S.eras, 'eras'), G = ids(S.groups, 'groups'), SRC = ids(S.sources, 'sources'), PW = ids(S.powers, 'powers');
const RL = ids(S.religions || [], 'religions');
ids(S.mysteries, 'mysteries');

// همه سال‌ها خورشیدی‌اند. سال بزرگ‌تر از سال خورشیدی جاری تقریباً همیشه یعنی سال میلادی به اشتباه وارد شده.
const now = new Date();
const JNOW = now >= new Date(now.getFullYear(), 2, 21) ? now.getFullYear() - 621 : now.getFullYear() - 622;
const yearOk = (y, where) => {
  if (y == null) return;
  if (!Number.isInteger(y)) problems.push(`سال غیرعددی ${y} در ${where}`);
  else if (y > JNOW + 1) problems.push(`سال ${y} در ${where} از سال خورشیدی جاری (${JNOW}) بزرگ‌تر است؛ احتمالاً میلادی وارد شده`);
};
S.eras.forEach((e) => { yearOk(e.start, `دوره ${e.id}`); yearOk(e.end, `دوره ${e.id}`); });

const tierOk = (t, where) => { if (t != null && ![1, 2, 3, 4].includes(t)) problems.push(`tier نامعتبر ${t} در ${where}`); if (t == null) warn.push(`tier ندارد: ${where}`); };
const srcOk = (list, where, required = true) => {
  if (required && (!list || !list.length)) warn.push(`بدون منبع: ${where}`);
  (list || []).forEach((s) => { if (!SRC.has(s)) problems.push(`منبع ناشناخته «${s}» در ${where}`); });
};

S.eras.forEach((e) => { if (!ESTATUS.includes(e.status)) problems.push(`status نامعتبر دوره ${e.id}`); });
S.groups.forEach((g) => {
  if (!E.has(g.era)) problems.push(`دوره ناشناخته برای گروه ${g.id}`);
  if (g.power && !PW.has(g.power)) problems.push(`قدرت ناشناخته برای گروه ${g.id}`);
});
S.people.forEach((p) => {
  const w = `فرد ${p.id}`;
  if (!E.has(p.era)) problems.push(`دوره ناشناخته «${p.era}» در ${w}`);
  if (p.death && !DEATH.includes(p.death)) problems.push(`death نامعتبر «${p.death}» در ${w}`);
  if (!p.death) warn.push(`death ندارد: ${w}`);
  if (!Array.isArray(p.rel) || !p.rel.length) problems.push(`دین و مذهب (rel) ثبت نشده: ${w}`);
  else p.rel.forEach((r) => { if (!RL.has(r)) problems.push(`دین ناشناخته «${r}» در ${w}`); });
  if (p.rel && p.rel.length > 1 && !(p.masks || []).length) warn.push(`تغییر دین بدون نقاب ثبت‌شده: ${w}`);
  yearOk(p.born, w); yearOk(p.died, w);
  (p.active || []).forEach((y) => yearOk(y, `${w} / active`));
  (p.roles || []).forEach((r) => { yearOk(r.from, `${w} / نقش`); yearOk(r.to, `${w} / نقش`); });
  (p.masks || []).forEach((m) => yearOk(m.year, `${w} / نقاب`));
  (p.groups || []).forEach((g) => { if (!G.has(g)) problems.push(`گروه ناشناخته «${g}» در ${w}`); });
  (p.ties || []).forEach((t, i) => {
    if (!PW.has(t.power)) problems.push(`قدرت ناشناخته «${t.power}» در ${w}`);
    if (!TIE_KINDS.includes(t.kind)) problems.push(`kind نامعتبر «${t.kind}» در ${w}`);
    tierOk(t.tier, `${w} / tie ${i}`); srcOk(t.src, `${w} / tie ${i}`);
  });
  (p.masks || []).forEach((m, i) => { tierOk(m.tier, `${w} / mask ${i}`); srcOk(m.src, `${w} / mask ${i}`); });
  srcOk(p.src, w);
  if (p.born != null && p.died != null && p.died < p.born) problems.push(`مرگ پیش از تولد در ${w}`);
  if (p.born == null && p.died == null && !p.active && !(p.roles || []).some((r) => r.from || r.to)) warn.push(`هیچ تاریخی ندارد (در خط زمان دیده نمی‌شود): ${w}`);
});
S.links.forEach((l, i) => {
  const w = `پیوند ${l.from} → ${l.to} (${l.type})`;
  if (!P.has(l.from)) problems.push(`فرد ناشناخته «${l.from}» در ${w}`);
  if (!P.has(l.to)) problems.push(`فرد ناشناخته «${l.to}» در ${w}`);
  if (!LINK_TYPES.includes(l.type)) problems.push(`نوع ناشناخته در ${w}`);
  tierOk(l.tier, w); srcOk(l.src, w);
});
S.mysteries.forEach((m) => {
  const w = `معما ${m.id}`;
  if (!MSTATUS.includes(m.status)) problems.push(`status نامعتبر در ${w}`);
  if (m.era && !E.has(m.era)) problems.push(`دوره ناشناخته در ${w}`);
  (m.people || []).forEach((id) => { if (!P.has(id)) problems.push(`فرد ناشناخته «${id}» در ${w}`); });
  [...(m.for || []), ...(m.against || [])].forEach((x, i) => { tierOk(x.tier, `${w} / شاهد ${i}`); srcOk(x.src, `${w} / شاهد ${i}`); });
  if (!(m.against || []).length) warn.push(`معما بدون شاهد مخالف: ${w}`);
});

// فهرست شاهان (kings.js): هر شناسه باید فرد ثبت‌شده باشد و هر فرد فقط یک بار در یک سلسله بیاید
const crowned = new Map();
ids(S.dynasties || [], 'dynasties');
(S.dynasties || []).forEach((d) => {
  srcOk(d.src, `سلسله ${d.id}`);
  (d.kings || []).forEach((k) => {
    const id = typeof k === 'string' ? k : k.id;
    if (typeof k === 'object' && k.n != null && (!Number.isInteger(k.n) || k.n < 1)) problems.push(`شماره نامعتبر برای «${id}» در ${d.id}`);
    if (!P.has(id)) problems.push(`فرد ناشناخته «${id}» در فهرست شاهان ${d.id}`);
    if (crowned.has(id)) problems.push(`«${id}» دو بار در فهرست شاهان آمده (${crowned.get(id)} و ${d.id})`);
    crowned.set(id, d.id);
  });
});
// هر کس نقش شاه یا سلطان دارد ولی در فهرست شاهان نیست — احتمال جاافتادن
S.people.forEach((p) => {
  if (!crowned.has(p.id) && (p.roles || []).some((r) => /^(شاه|سلطان|آخرین سلطان|آخرین فرمانروا|فرمانروا$|بنیان‌گذار و شاه)/.test(r.t)))
    warn.push(`نقش فرمانروایی دارد ولی در kings.js نیست (اگر شاه ایران نبوده نادیده بگیرید): ${p.id}`);
});

// دخالت‌های خارجی (influence.js)
const IV_KINDS = ['coup', 'install', 'remove', 'occupation', 'puppet', 'transition', 'payroll', 'intel', 'security',
  'advisers', 'treaty', 'economy', 'arms', 'mediation', 'protect', 'pressure', 'war', 'restraint'];
const MY = new Set(S.mysteries.map((m) => m.id));
ids(S.interventions || [], 'interventions');
(S.interventions || []).forEach((v) => {
  const w = `دخالت ${v.id}`;
  if (!IV_KINDS.includes(v.kind)) problems.push(`kind نامعتبر «${v.kind}» در ${w}`);
  if (!Number.isInteger(v.year)) problems.push(`سال ندارد: ${w}`);
  yearOk(v.year, w); yearOk(v.end, w);
  if (!(v.powers || []).length) problems.push(`قدرت ندارد: ${w}`);
  (v.powers || []).forEach((p) => { if (!PW.has(p)) problems.push(`قدرت ناشناخته «${p}» در ${w}`); });
  [...(v.placed || []), ...(v.removed || []), ...(v.people || [])].forEach((id) => { if (!P.has(id)) problems.push(`فرد ناشناخته «${id}» در ${w}`); });
  if (v.mystery && !MY.has(v.mystery)) problems.push(`معمای ناشناخته «${v.mystery}» در ${w}`);
  tierOk(v.tier, w); srcOk(v.src, w);
  if ((v.placed || []).length && v.tier > 2) warn.push(`«گماشتن» با سطح ${v.tier} — فقط در معما نتیجه‌گیری شود: ${w}`);
});

// رشته‌های بلند (threads.js): هر گام یا به رکورد موجود ارجاع می‌دهد یا tier و src خودش را دارد
const TH_KINDS = ['foundation', 'network', 'foreign', 'pattern'];
const TH_VERDICT = ['continuous', 'shifted', 'broken', 'contested'];
const IVM = new Set((S.interventions || []).map((v) => v.id));
const resolveRef = (ref) => {
  const [kind, rest = ''] = ref.split(/:(.*)/s);
  if (kind === 'link') {
    const m = rest.match(/^([^>]+)>([^:]+):(\w+)$/);
    return !!m && S.links.some((l) => l.from === m[1] && l.to === m[2] && l.type === m[3]);
  }
  if (kind === 'iv') return IVM.has(rest);
  if (kind === 'my') return MY.has(rest);
  if (kind === 'mask') { const [pid, i] = rest.split(':'); return !!P.get(pid)?.masks?.[+i]; }
  if (kind === 'tie') { const [pid, pw] = rest.split(':'); return (P.get(pid)?.ties || []).some((t) => t.power === pw); }
  return false;
};
ids(S.threads || [], 'threads');
(S.threads || []).forEach((th) => {
  const w = `رشته ${th.id}`;
  if (!TH_KINDS.includes(th.kind)) problems.push(`kind نامعتبر «${th.kind}» در ${w}`);
  if (!TH_VERDICT.includes(th.verdict?.kind)) problems.push(`verdict نامعتبر در ${w}`);
  if (th.power && !PW.has(th.power)) problems.push(`قدرت ناشناخته «${th.power}» در ${w}`);
  if (!(th.steps || []).length) problems.push(`گام ندارد: ${w}`);
  (th.steps || []).forEach((s, i) => {
    const sw = `${w} / گام ${i} (${s.y})`;
    if (!Number.isInteger(s.y)) problems.push(`سال ندارد: ${sw}`);
    yearOk(s.y, sw);
    (s.p || []).forEach((id) => { if (!P.has(id)) problems.push(`فرد ناشناخته «${id}» در ${sw}`); });
    if (s.ref && !resolveRef(s.ref)) problems.push(`ارجاع شکسته «${s.ref}» در ${sw}`);
    if (!s.ref || s.ref.startsWith('my:')) { if (s.tier != null || !s.ref) tierOk(s.tier ?? (s.ref ? 3 : null), sw); }
    if (!s.ref) srcOk(s.src, sw); else srcOk(s.src, sw, false);
    if (!s.ref && !s.t) problems.push(`متن ندارد: ${sw}`);
  });
});

// زندان، تبعید و حصر (prisons.js): زندانی، زندان‌بان (گروه یا قدرت)، جای حبس، نوع، پایان، سال‌ها، اعتبار
const J_KINDS = ['prison', 'fortress', 'house', 'exile', 'internment', 'hostage', 'captive'];
const J_OUT = ['released', 'pardon', 'repent', 'amnesty', 'escape', 'exchange', 'deal', 'power', 'transfer', 'executed', 'killed', 'died', 'ongoing', 'unknown'];
const PR = ids(S.prisons || [], 'prisons');
(S.jails || []).forEach((j, i) => {
  const w = `حبس ${i} (${j.who})`;
  const p = P.get(j.who);
  if (!p) problems.push(`فرد ناشناخته در ${w}`);
  if (!J_KINDS.includes(j.kind)) problems.push(`kind نامعتبر «${j.kind}» در ${w}`);
  if (!J_OUT.includes(j.out)) problems.push(`out نامعتبر «${j.out}» در ${w}`);
  if (!G.has(j.by) && !PW.has(j.by)) problems.push(`زندان‌بان ناشناخته «${j.by}» در ${w} (باید گروه یا قدرت باشد)`);
  if (j.at && !PR.has(j.at)) problems.push(`جای حبس ناشناخته «${j.at}» در ${w}`);
  if (j.from == null) { if (!j.when) problems.push(`نه سال دارد نه when: ${w}`); else warn.push(`حبس بی‌تاریخ (در خط زمان دیده نمی‌شود): ${w}`); }
  else if (!Number.isInteger(j.from)) problems.push(`سال غیرعددی در ${w}`);
  yearOk(j.from, w); yearOk(j.to, w);
  if (j.to != null && j.from != null && j.to < j.from) problems.push(`پایان پیش از آغاز در ${w}`);
  if (j.out === 'ongoing' && j.to != null) problems.push(`ongoing با سال پایان در ${w}`);
  if (p && j.from != null && p.born != null && j.from < p.born) problems.push(`حبس پیش از تولد در ${w}`);
  if (p && j.from != null && p.died != null && j.from > p.died) problems.push(`حبس پس از مرگ در ${w}`);
  (j.with || []).forEach((id) => { if (!P.has(id)) problems.push(`هم‌بند ناشناخته «${id}» در ${w}`); });
  if (j.mystery && !MY.has(j.mystery)) problems.push(`معمای ناشناخته «${j.mystery}» در ${w}`);
  tierOk(j.tier, w); srcOk(j.src, w);
  if (p && p.death === 'alive' && j.tier > 2) problems.push(`فرد زنده فقط با سطح ۱ یا ۲: ${w}`);
  if (!j.note) warn.push(`یادداشت ندارد: ${w}`);
});

// چرا آزاد شدند (SH.release): دست‌اندرکاران گروه یا قدرت، چگونگی، اعتبار؛ و ارجاع حبس‌ها به آن‌ها
const REL_HOW = ['decision', 'amnesty', 'pressure', 'intercession', 'campaign', 'deal', 'collapse', 'escape', 'covert'];
const REL = ids(S.releases || [], 'releases');
(S.releases || []).forEach((r) => {
  const w = `آزادی ${r.id}`;
  if (!REL_HOW.includes(r.how)) problems.push(`how نامعتبر «${r.how}» در ${w}`);
  if (!Number.isInteger(r.year)) problems.push(`سال ندارد: ${w}`);
  yearOk(r.year, w);
  (r.by || []).forEach((b) => { if (!G.has(b) && !PW.has(b)) problems.push(`دست‌اندرکار ناشناخته «${b}» در ${w}`); });
  if (!r.title) problems.push(`عنوان ندارد: ${w}`);
  if (r.mystery && !MY.has(r.mystery)) problems.push(`معمای ناشناخته «${r.mystery}» در ${w}`);
  if (r.how === 'covert' && !r.mystery) problems.push(`ادعای دست پنهان بدون معما: ${w}`);
  tierOk(r.tier, w); srcOk(r.src, w);
});
(S.jails || []).forEach((j, i) => (j.freed || []).forEach((id) => { if (!REL.has(id)) problems.push(`آزادی ناشناخته «${id}» در حبس ${i} (${j.who})`); }));
const usedRel = new Set((S.jails || []).flatMap((j) => j.freed || []));
(S.releases || []).forEach((r) => { if (!usedRel.has(r.id)) warn.push(`آزادی بی‌ارجاع (هیچ حبسی به آن اشاره نمی‌کند): ${r.id}`); });

// دانشنامه‌ها و سایت‌های پرخواننده نشانی‌اند نه سند: ادعایی که فقط بر آن‌ها تکیه دارد حداکثر سطح ۳ است
const REFK = new Set(S.sources.filter((s) => s.kind === 'reference').map((s) => s.id));
const onlyRef = (src) => (src || []).length && src.every((s) => REFK.has(s));
let refOnly = 0;
S.people.forEach((p) => [...(p.ties || []), ...(p.masks || [])].forEach((x) => { if (onlyRef(x.src) && x.tier < 3) refOnly++; }));
[...S.links, ...(S.interventions || []), ...(S.jails || []), ...(S.releases || [])].forEach((x) => { if (onlyRef(x.src) && x.tier < 3) refOnly++; });
S.mysteries.forEach((m) => [...(m.for || []), ...(m.against || [])].forEach((x) => { if (onlyRef(x.src) && x.tier < 3) refOnly++; }));
if (refOnly) warn.push(`${refOnly} ادعای سطح ۱ یا ۲ فقط بر دانشنامه یا گردآوری جست‌وجو تکیه دارد؛ با سند دست اول تطبیق یا به سطح ۳ کاهش یابد`);

const unused = S.sources.filter((s) => !JSON.stringify([S.people, S.links, S.mysteries, S.dynasties || [], S.interventions || [], S.threads || [], S.jails || [], S.releases || []]).includes(`"${s.id}"`)).map((s) => s.id);
if (unused.length) warn.push(`منابع بی‌ارجاع: ${unused.join('، ')}`);

console.log(`افراد ${S.people.length} | پیوندها ${S.links.length} | گروه‌ها ${S.groups.length} | معماها ${S.mysteries.length} | منابع ${S.sources.length} (تطبیق‌شده ${S.sources.filter((s) => s.checked).length})`);
warn.forEach((x) => console.log('هشدار: ' + x));
problems.forEach((x) => console.log('خطا: ' + x));
console.log(problems.length ? `${problems.length} خطا` : 'بدون خطا');
process.exit(problems.length ? 1 : 0);
