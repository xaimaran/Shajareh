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

const unused = S.sources.filter((s) => !JSON.stringify([S.people, S.links, S.mysteries, S.dynasties || [], S.interventions || []]).includes(`"${s.id}"`)).map((s) => s.id);
if (unused.length) warn.push(`منابع بی‌ارجاع: ${unused.join('، ')}`);

console.log(`افراد ${S.people.length} | پیوندها ${S.links.length} | گروه‌ها ${S.groups.length} | معماها ${S.mysteries.length} | منابع ${S.sources.length} (تطبیق‌شده ${S.sources.filter((s) => s.checked).length})`);
warn.forEach((x) => console.log('هشدار: ' + x));
problems.forEach((x) => console.log('خطا: ' + x));
console.log(problems.length ? `${problems.length} خطا` : 'بدون خطا');
process.exit(problems.length ? 1 : 0);
