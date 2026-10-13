/* نمایشگر شجره‌نامه — بدون وابستگی، کاملاً آفلاین. داده از window.SH.store می‌آید. همه سال‌ها خورشیدی‌اند.
   آیکون‌ها از assets/icons.js (window.ic) و فهرست تصویرها از assets/portraits/list.js (window.PORTRAITS). */
(function () {
  'use strict';

  const S = window.SH.store;
  const ic = window.ic;
  const PORTRAITS = window.PORTRAITS || {};
  const jalaliNow = () => { const d = new Date(); const g = d.getFullYear(); return d >= new Date(g, 2, 21) ? g - 621 : g - 622; };
  const NOW = jalaliNow();
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const fa = (v) => String(v).replace(/\d/g, (d) => FA[d]);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const norm = (s) => String(s ?? '')
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ةۀ]/g, 'ه').replace(/[أإٱ]/g, 'ا').replace(/ؤ/g, 'و')
    .replace(/[ً-ْٰ]/g, '')
    .replace(/[\s‌‍‎‏]/g, '')
    .toLowerCase();
  function $(s, r = document) { return r.querySelector(s); }

  /* ——— واژگان ——— */
  const TIERS = { 1: 'مستند', 2: 'معتبر', 3: 'ادعا', 4: 'شایعه' };
  const LINKS = {
    blood: { name: 'نسبی', out: 'فرزند', in: 'پدر / مادر', descent: true, rank: 0 },
    succession: { name: 'جانشینی', out: 'جانشین', in: 'پیشین', descent: true, rank: 1 },
    training: { name: 'تربیت و شاگردی', out: 'شاگرد / پرورده', in: 'استاد / مربی', descent: true, rank: 2 },
    patronage: { name: 'برکشیدن و حمایت', out: 'برکشیده', in: 'حامی', descent: true, rank: 3 },
    marriage: { name: 'ازدواج', out: 'همسر / داماد', in: 'همسر / پدرزن', rank: 4 },
    kin: { name: 'خویشاوندی', out: 'خویشاوند', in: 'خویشاوند', rank: 4 },
    faction: { name: 'هم‌دستی', out: 'هم‌دست', in: 'هم‌دست', rank: 5 },
    foreign: { name: 'پیوند خارجی', out: 'طرف پیوند', in: 'طرف پیوند', rank: 5 },
    killed: { name: 'قتل', out: 'قربانی', in: 'قاتل / آمر قتل', rank: 6 },
    betrayal: { name: 'خیانت', out: 'خیانت‌دیده', in: 'خائن', rank: 6 },
    enmity: { name: 'دشمنی', out: 'دشمن', in: 'دشمن', rank: 6 },
  };
  const DEATH = { natural: 'مرگ طبیعی', killed: 'کشته شد', executed: 'اعدام / قتل به فرمان', poisoned: 'مسموم شد (گمان)', battle: 'کشته در جنگ', unknown: 'نامعلوم', alive: 'در قید حیات' };
  const VIOLENT = new Set(['killed', 'executed', 'poisoned', 'battle']);
  const TIE_KINDS = { origin: 'خاستگاه', kin: 'پیوند خونی', ally: 'متحد', agent: 'کارگزار', client: 'دست‌نشانده', refuge: 'پناهنده', trade: 'تجاری', education: 'تحصیل', enemy: 'دشمن' };
  const MSTATUS = { open: 'باز', supported: 'تقویت‌شده', weakened: 'تضعیف‌شده', debunked: 'رد شده', solved: 'حل‌شده' };
  const ESTATUS = { draft: 'پیش‌نویس', pending: 'در انتظار پژوهش', verified: 'تطبیق‌شده' };
  const GKIND = { dynasty: 'خاندان', order: 'طریقت', tribe: 'ایل', institution: 'نهاد', faction: 'جناح', clergy: 'روحانیت', foreign: 'قدرت خارجی', network: 'شبکه', party: 'حزب', military: 'نظامی', merchants: 'بازرگانان', media: 'رسانه' };
  const SKIND = { primary: 'دست اول', archive: 'سند / آرشیو', academic: 'پژوهشی', memoir: 'خاطرات', press: 'مطبوعات', reference: 'دانشنامه', polemic: 'جدلی', video: 'ویدیو' };
  const VIEWS = [
    ['overview', 'gantt', 'گانت'], ['hier', 'sitemap', 'سلسله‌مراتب'], ['tree', 'listTree', 'شجره'],
    ['influence', 'hand', 'نفوذ خارجی'], ['threads', 'diagram', 'رشته‌ها'], ['prisons', 'bars', 'زندان'], ['trail', 'route', 'ردپا'], ['mysteries', 'question', 'معماها'], ['sources', 'books', 'منابع'],
  ];
  /* ——— نفوذ خارجی (data/influence.js) ——— */
  const IV_CAT = {
    control: { name: 'مهار', hint: 'کودتا، گماشتن، برکناری، اشغال، دولت دست‌نشانده، شبکه اطلاعاتی، پرداخت پنهان' },
    partner: { name: 'همکاری', hint: 'پیمان، نفت و اقتصاد، سلاح، مستشار، میانجی‌گری، پشتیبانی دیپلماتیک' },
    hostile: { name: 'دشمنی', hint: 'تحریم، فشار، جنگ' },
    limit: { name: 'خودداری', hint: 'قدرت از دفاع یا پشتیبانی خودداری کرد — شاهد مخالف «سلطه»' },
  };
  const IV_KIND = {
    coup: ['کودتا', 'control', 3], install: ['گماشتن', 'control', 3], remove: ['برکناری', 'control', 3], occupation: ['اشغال نظامی', 'control', 3],
    puppet: ['دولت دست‌نشانده', 'control', 3], transition: ['هدایت انتقال قدرت', 'control', 2], payroll: ['پرداخت پنهان به مقام‌ها', 'control', 2],
    intel: ['شبکه اطلاعاتی و حزبی', 'control', 2], security: ['ساختن دستگاه امنیتی', 'control', 2],
    advisers: ['مستشاران', 'partner', 1], treaty: ['پیمان و امتیاز', 'partner', 1], economy: ['نفت و اقتصاد', 'partner', 1], arms: ['سلاح و همکاری نظامی', 'partner', 1],
    mediation: ['میانجی‌گری', 'partner', 1], protect: ['پشتیبانی دیپلماتیک', 'partner', 1],
    pressure: ['تحریم و فشار', 'hostile', 1], war: ['جنگ و حمله', 'hostile', 2], restraint: ['خودداری از دفاع', 'limit', 1],
  };
  const TIER_W = { 1: 1, 2: 0.75, 3: 0.4, 4: 0.15 };
  const IV_RANGES = [['century', 'سده اخیر', 1298, null], ['pahlavi', 'پهلوی', 1299, 1357], ['ir', 'جمهوری اسلامی', 1357, null], ['decade', 'ده سال اخیر', null, null]];
  const HEAD_RE = /^(شاه ایران|نخست‌وزیر|رئیس‌جمهور|رهبر جمهوری اسلامی|نایب‌السلطنه|سرپرست ریاست‌جمهوری|سرپرست نخست‌وزیری)/;
  const CAMP_KINDS = new Set(['agent', 'client', 'ally', 'refuge', 'trade']);
  const FULLABLE = new Set(['overview', 'hier']);
  const REL_SHORT = { sunni: 'سنی', shia12: 'شیعه', ghulat: 'غالی', zaydi: 'زیدی', ismaili: 'اسماعیلی', orthodox: 'ارتدوکس', armenian: 'ارمنی', catholic: 'کاتولیک', protestant: 'پروتستان', jewish: 'یهودی', zoroastrian: 'زرتشتی', babi: 'بابی', bahai: 'بهائی', secular: 'سکولار', unknown: 'نامعلوم' };

  /* ——— نمایه‌ها ——— */
  const idx = (arr) => { const m = Object.create(null); arr.forEach((x) => { m[x.id] = x; }); return m; };
  const P = idx(S.people), E = idx(S.eras), G = idx(S.groups), SRC = idx(S.sources), PW = idx(S.powers), MY = idx(S.mysteries), RL = idx(S.religions);
  const OUT = Object.create(null), IN = Object.create(null);
  S.links.forEach((l) => { (OUT[l.from] ||= []).push(l); (IN[l.to] ||= []).push(l); });
  const ERAS = [...S.eras].sort((a, b) => a.start - b.start);

  /* ——— شاهان (data/kings.js): شماره هر فرمانروا در سلسله‌اش؛ مدعی‌ها بی‌شماره، بیگانه‌ها فقط با شماره صریح ——— */
  const KING = Object.create(null);
  (S.dynasties || []).forEach((d) => {
    let n = 0;
    (d.kings || []).forEach((k) => {
      const o = typeof k === 'string' ? { id: k } : k;
      let num = null;
      if (d.foreign) num = o.n ?? null;
      else if (!o.claim) { n = o.n ?? n + 1; num = n; }
      KING[o.id] ||= { d, n: num, claim: !!o.claim, foreign: !!d.foreign, note: o.note };
    });
  });
  const RULE_RE = /(شاه|سلطان|فرمانروا|امپراتور|خان|امیر|پادشاه|رهبر|رئیس‌جمهور|نایب‌السلطنه|وکیل)/;
  const ORD = ['', 'نخستین', 'دومین', 'سومین', 'چهارمین', 'پنجمین', 'ششمین', 'هفتمین', 'هشتمین', 'نهمین', 'دهمین', 'یازدهمین', 'دوازدهمین', 'سیزدهمین', 'چهاردهمین', 'پانزدهمین'];
  const kingTitle = (k) => (k.claim ? `مدعی یا شاه اسمی — ${k.d.name}` : k.n ? `${ORD[k.n] || fa(k.n) + 'مین'} فرمانروای ${k.d.name}` : `فرمانروای ${k.d.name}`);

  S.people.forEach((p) => {
    for (const k of ['alt', 'groups', 'roles', 'masks', 'ties', 'src', 'tags', 'rel']) p[k] ||= [];
    if (!p.rel.length) p.rel = ['unknown'];
    // active: [از، تا] — بازه حضور شناخته‌شده برای کسانی که تاریخ تولد و مرگشان معلوم نیست
    const ry = p.roles.flatMap((r) => [r.from, r.to]).filter(Number.isFinite);
    const act = Array.isArray(p.active) ? p.active : null;
    p._start = p.born ?? (act ? act[0] : ry.length ? Math.min(...ry) - 20 : (p.died ? p.died - 40 : null));
    p._end = p.died ?? (p.death === 'alive' ? NOW : act ? act[1] : (ry.length ? Math.max(...ry) : (p._start != null ? p._start + 40 : null)));
    p._approx = p.born == null || (p.died == null && p.death !== 'alive');
    // نقش قدرتِ اصلی با سال آغاز: برای شاهان نقش سلطنت، برای دیگران نخستین نقش دارای سال
    const dated = p.roles.filter((r) => Number.isFinite(r.from));
    p._rule = (KING[p.id] && dated.find((r) => RULE_RE.test(r.t))) || dated[0] || null;
    // ترتیب در درخت‌ها: سال رسیدن به قدرت، و برای کسانی که قدرتی نداشتند سال تولد
    p._order = p._rule ? p._rule.from : p._start;
    const main = p.ties.filter((t) => t.kind !== 'enemy').sort((a, b) => (a.tier ?? 2) - (b.tier ?? 2))[0];
    p._power = main ? main.power : null;
    p._relNow = p.rel[p.rel.length - 1];
    p._text = norm([p.name, ...p.alt, p.origin, p.faith, p.summary, p.deathNote, ...p.tags,
      ...p.rel.map((r) => RL[r]?.name || r),
      ...p.roles.map((r) => r.t), ...p.masks.map((m) => `${m.from} ${m.to} ${m.note || ''}`),
      ...p.ties.map((t) => `${PW[t.power]?.name || t.power} ${t.note || ''}`),
      ...p.groups.map((g) => G[g]?.name || ''), E[p.era]?.name, p.born, p.died].join(' '));
  });
  const IVS = (S.interventions || []).slice().sort((a, b) => a.year - b.year);
  const IV = idx(IVS);
  const IV_OF = Object.create(null);
  IVS.forEach((v) => {
    for (const k of ['powers', 'placed', 'removed', 'people', 'src']) v[k] ||= [];
    v._end = v.end ?? v.year;
    new Set([...v.placed, ...v.removed, ...v.people]).forEach((id) => { (IV_OF[id] ||= []).push(v); });
    v._text = norm([v.title, v.note, v.year, ...v.powers.map((w) => PW[w]?.name || w), IV_KIND[v.kind]?.[0], ...[...v.placed, ...v.removed, ...v.people].map((id) => P[id]?.name)].join(' '));
  });
  S.mysteries.forEach((m) => {
    m.people ||= []; m.for ||= []; m.against ||= []; m.next ||= [];
    m._text = norm([m.title, m.claim, ...m.for.map((x) => x.t), ...m.against.map((x) => x.t), ...m.next, ...m.people.map((id) => P[id]?.name)].join(' '));
  });

  /* ——— اعتبارسنجی ارجاع‌ها ——— */
  const issues = [];
  const chk = (ok, msg) => { if (!ok) issues.push(msg); };
  const chkSrc = (list, where) => (list || []).forEach((s) => chk(SRC[s], `منبع ناشناخته «${s}» در ${where}`));
  Object.entries({ people: S.people, eras: S.eras, groups: S.groups, sources: S.sources, powers: S.powers, mysteries: S.mysteries, religions: S.religions }).forEach(([k, arr]) => {
    const seen = new Set();
    arr.forEach((x) => { chk(!seen.has(x.id), `شناسه تکراری در ${k}: ${x.id}`); seen.add(x.id); });
  });
  S.people.forEach((p) => {
    chk(E[p.era], `دوره ناشناخته «${p.era}» برای ${p.id}`);
    p.rel.forEach((r) => chk(RL[r], `دین ناشناخته «${r}» برای ${p.id}`));
    p.groups.forEach((g) => chk(G[g], `گروه ناشناخته «${g}» برای ${p.id}`));
    p.ties.forEach((t) => { chk(PW[t.power], `قدرت ناشناخته «${t.power}» برای ${p.id}`); chkSrc(t.src, p.id); });
    p.masks.forEach((m) => chkSrc(m.src, p.id));
    chkSrc(p.src, p.id);
  });
  S.groups.forEach((g) => { chk(E[g.era], `دوره ناشناخته برای گروه ${g.id}`); if (g.power) chk(PW[g.power], `قدرت ناشناخته برای گروه ${g.id}`); });
  S.links.forEach((l) => {
    chk(P[l.from] && P[l.to], `پیوند با فرد ناشناخته: ${l.from} → ${l.to}`);
    chk(LINKS[l.type], `نوع پیوند ناشناخته: ${l.type}`);
    chkSrc(l.src, `${l.from}→${l.to}`);
  });
  S.mysteries.forEach((m) => {
    m.people.forEach((id) => chk(P[id], `فرد ناشناخته «${id}» در معمای ${m.id}`));
    [...m.for, ...m.against].forEach((x) => chkSrc(x.src, m.id));
  });

  IVS.forEach((v) => {
    chk(IV_KIND[v.kind], `نوع دخالت ناشناخته «${v.kind}» در ${v.id}`);
    v.powers.forEach((w) => chk(PW[w], `قدرت ناشناخته «${w}» در ${v.id}`));
    [...v.placed, ...v.removed, ...v.people].forEach((id) => chk(P[id], `فرد ناشناخته «${id}» در ${v.id}`));
    chkSrc(v.src, v.id);
  });

  /* ——— ارجاع‌های هر منبع ——— */
  const CITES = Object.create(null);
  const cite = (list, key) => (list || []).forEach((s) => { (CITES[s] ||= new Set()).add(key); });
  S.people.forEach((p) => { const k = `person:${p.id}`; cite(p.src, k); p.ties.forEach((t) => cite(t.src, k)); p.masks.forEach((m) => cite(m.src, k)); });
  S.links.forEach((l) => { cite(l.src, `person:${l.from}`); cite(l.src, `person:${l.to}`); });
  S.mysteries.forEach((m) => { const k = `mystery:${m.id}`; [...m.for, ...m.against].forEach((x) => cite(x.src, k)); });
  IVS.forEach((v) => cite(v.src, `intervention:${v.id}`));

  /* ——— وضعیت ——— */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('shajare:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('shajare:' + k, JSON.stringify(v)); } catch (e) { /* بدون حافظه مرورگر هم کار می‌کند */ } },
  };
  const st = {
    view: 'overview', sel: null, q: '', qn: '', powers: new Set(), rels: new Set(), maxTier: 4, masks: false, violent: false,
    ivRange: store.get('ivRange', 'century'), ivZoom: store.get('ivZoom', 1), thZoom: store.get('thZoom', 1), thKind: '', thStep: undefined,
    jRange: store.get('jRange', 'modern'), jZoom: store.get('jZoom', 1), jSig: '',
    zoom: store.get('zoom', 5), treeMode: store.get('treeMode', 'power'), mstatus: '', full: false, pk: null,
    types: new Set(Object.keys(LINKS).filter((k) => LINKS[k].descent)),
    open: new Set(store.get('open', ['era:roots', 'era:safavid'])),
    tlFold: new Set(store.get('tlFold', [])),
    sumOpen: store.get('sumOpen', false),
    hFold: new Set(store.get('hFold', [])), hRoot: '', hZoom: store.get('hZoom', 1), hSecondary: store.get('hSecondary', false),
    navW: store.get('navW', 300), detW: store.get('detW', 380), navC: store.get('navC', false), detC: store.get('detC', false),
  };
  const hist = { back: [], fwd: [] };

  const tierOK = (t) => (t ?? 2) <= st.maxTier;
  const filtersActive = () => !!(st.qn || st.powers.size || st.rels.size || st.masks || st.violent);
  function matches(p) {
    if (st.qn && !p._text.includes(st.qn)) return false;
    if (st.powers.size && !p.ties.some((t) => t.kind !== 'enemy' && st.powers.has(t.power) && tierOK(t.tier))) return false;
    if (st.rels.size && !p.rel.some((r) => st.rels.has(r))) return false;
    if (st.masks && !p.masks.some((m) => tierOK(m.tier))) return false;
    if (st.violent && !VIOLENT.has(p.death)) return false;
    return true;
  }

  /* ——— قطعه‌های مشترک ——— */
  const life = (p) => `${p.born != null ? fa(p.born) : '؟'}–${p.died != null ? fa(p.died) : (p.death === 'alive' ? 'اکنون' : '؟')}`;
  const tierBadge = (t) => { const n = t ?? 2; return `<span class="tier t${n}" title="سطح اعتبار">${TIERS[n]}</span>`; };
  const powerChip = (id) => { const w = PW[id]; return `<button class="pchip${st.powers.has(id) ? ' on' : ''}" data-power="${esc(id)}" style="--c:${w ? w.color : '#888'}">${esc(w ? w.name : id)}</button>`; };
  const relName = (id) => RL[id]?.name || id;
  const relShort = (id) => REL_SHORT[id] || relName(id);
  const relChain = (p) => p.rel.map(relName).join(' ← ');
  const relDot = (p) => `<i class="rdot${p.rel.length > 1 ? ' changed' : ''}" style="--c:${RL[p._relNow]?.color || '#999'}" title="${esc(relChain(p))}"></i>`;
  const relChip = (p) => `<span class="rchip${p.rel.length > 1 ? ' changed' : ''}" style="--c:${RL[p._relNow]?.color || '#999'}" title="${esc(relChain(p))}">${esc(relShort(p._relNow))}</span>`;
  const pColor = (p) => (p._power && PW[p._power] ? PW[p._power].color : 'var(--neutral)');
  const badges = (p) => `${p.masks.length ? `<span class="bi b-mask" title="تغییر نقاب">${ic('masks')}</span>` : ''}${VIOLENT.has(p.death) ? `<span class="bi b-dead" title="${esc(DEATH[p.death])}">${ic('skull')}</span>` : ''}`;
  const initial = (p) => p.name.replace(/^(شاه|شیخ|سلطان|میرزا|ملکه|شاهزاده|محقق|میر|سید|آیت‌الله|امیر)\s+/, '').charAt(0);
  const portraitSrc = (id) => (PORTRAITS[id] ? `assets/portraits/${id}.jpg` : null);
  // تصویر کوچک آواتار با data-zoom در پنجره بزرگ باز می‌شود (و کلیک همچنان فرد را انتخاب می‌کند)
  const avatar = (p, size = 'sm') => {
    const src = portraitSrc(p.id);
    return `<span class="av av-${size}" style="--c:${pColor(p)}"${src ? ` data-zoom="${p.id}" title="بزرگ کردن تصویر"` : ''}>${src ? `<img src="${src}" alt="" loading="lazy">` : `<b>${esc(initial(p))}</b>`}</span>`;
  };
  // سال رسیدن به قدرت (داده‌ها فقط سال دارند)
  const ruleText = (p) => (p._rule ? `${fa(p._rule.from)}${Number.isFinite(p._rule.to) ? '–' + fa(p._rule.to) : ''}` : '');
  const ruleChip = (p) => (p._rule ? `<span class="rule" title="${esc(p._rule.t)}: آغاز ${fa(p._rule.from)} ش">${KING[p.id] ? 'سلطنت' : 'قدرت'} ${ruleText(p)}</span>` : '');
  // تاج توپر زرد؛ مسیر ساده و مستقل از مجموعه آیکون‌ها
  const CROWN_VB = '0 0 24 22', CROWN_D = 'M1.5 5.5l5.5 4.5 5-8 5 8 5.5-4.5-2.2 11.5H3.7zM3.7 18.5h16.6v2.5H3.7z';
  const crownSvg = () => `<svg class="ic crownic" viewBox="${CROWN_VB}" aria-hidden="true"><path d="${CROWN_D}"/></svg>`;
  // تاج کنار نام شاهان: نخستین فرمانروا تاج تنها، فرمانروای nام تاج و «×n»
  const crown = (p) => {
    const k = KING[p.id];
    if (!k) return '';
    return `<span class="crown${k.claim ? ' claim' : ''}${k.foreign ? ' foreign' : ''}" title="${esc(kingTitle(k))}${p._rule ? ' — از ' + fa(p._rule.from) + ' ش' : ''}">${crownSvg()}${k.n > 1 ? `<small>×${fa(k.n)}</small>` : ''}</span>`;
  };
  // تاج در SVG: لبه راست در xRight و بالای آیکون در y؛ پهنای اشغال‌شده هم برمی‌گردد
  const svgCrown = (p, xRight, y, size) => {
    const k = KING[p.id];
    if (!k) return { svg: '', w: 0 };
    const num = k.n > 1 ? `×${fa(k.n)}` : '';
    const fs = Math.max(10, Math.round(size * 0.6));
    const numW = num ? 3 + num.length * fs * 0.65 : 0;
    const x0 = xRight - size;
    return { w: size + numW, svg: `<g class="scrown${k.claim ? ' claim' : ''}${k.foreign ? ' foreign' : ''}"><title>${esc(kingTitle(k))}${p._rule ? ' — از ' + fa(p._rule.from) + ' ش' : ''}</title>`
      + `<rect class="cbg" x="${x0 - numW - 3}" y="${y - 2}" width="${size + numW + 6}" height="${size + 4}" rx="${(size + 4) / 2}"/>`
      + `<svg x="${x0}" y="${y}" width="${size}" height="${size}" viewBox="${CROWN_VB}"><path d="${CROWN_D}"/></svg>`
      + (num ? `<text x="${x0 - 2}" y="${y + size * 0.78}" style="font-size:${fs}px">${num}</text>` : '') + '</g>' };
  };
  const personBtn = (id) => { const p = P[id]; if (!p) return `<span class="bad">${esc(id)}</span>`; return `<button class="plink" data-person="${p.id}">${avatar(p, 'xs')}${esc(p.name)}${crown(p)}</button>`; };
  const srcList = (ids) => (ids && ids.length ? `<span class="srcs">${ids.map((id) => {
    const s = SRC[id];
    return s ? `<button class="src${s.checked ? ' ok' : ''}" data-source="${s.id}" title="${esc(s.title)}${s.checked ? '' : ' — تطبیق نشده'}">${esc(s.short || s.title)}</button>` : `<span class="src bad">${esc(id)}</span>`;
  }).join('')}</span>` : '');
  const eraOf = (p) => E[p.era];
  const selName = (s) => (!s ? 'چکیده کل' : s.kind === 'person' ? P[s.id]?.name : s.kind === 'era' ? E[s.id]?.name : s.kind === 'group' ? G[s.id]?.name : s.kind === 'mystery' ? MY[s.id]?.title : s.kind === 'source' ? SRC[s.id]?.title : s.kind === 'intervention' ? IV[s.id]?.title : s.kind === 'thread' ? TH[s.id]?.name : '') || '';

  function summarize(people) {
    const ids = new Set(people.map((p) => p.id));
    const s = { n: people.length, violent: 0, masks: 0, powers: {}, rels: {}, myst: 0, open: 0 };
    people.forEach((p) => {
      if (VIOLENT.has(p.death)) s.violent++;
      if (p.masks.length) s.masks++;
      s.rels[p._relNow] = (s.rels[p._relNow] || 0) + 1;
      new Set(p.ties.filter((t) => t.kind !== 'enemy').map((t) => t.power)).forEach((w) => { s.powers[w] = (s.powers[w] || 0) + 1; });
    });
    S.mysteries.forEach((m) => { if (m.people.some((id) => ids.has(id))) { s.myst++; if (m.status === 'open') s.open++; } });
    return s;
  }
  function bars(entries, kind) {
    if (!entries.length) return '';
    const max = entries[0][1];
    const meta = kind === 'power' ? PW : RL;
    return `<div class="pbars">${entries.map(([k, v]) => `<button class="pbar" data-${kind}="${esc(k)}"><span class="pn">${esc(meta[k]?.name || k)}</span><span class="track"><i style="width:${Math.round((v / max) * 100)}%;background:${meta[k]?.color || '#888'}"></i></span><span class="pv">${fa(v)}</span></button>`).join('')}</div>`;
  }
  function summaryHTML(s) {
    const pw = Object.entries(s.powers).sort((a, b) => b[1] - a[1]);
    const rl = Object.entries(s.rels).sort((a, b) => b[1] - a[1]);
    return `<div class="kpis">
      <div class="kpi">${ic('users')}<b>${fa(s.n)}</b><span>نفر</span></div>
      <div class="kpi">${ic('skull')}<b>${fa(s.violent)}</b><span>مرگ خشونت‌آمیز</span></div>
      <div class="kpi">${ic('masks')}<b>${fa(s.masks)}</b><span>تغییر نقاب</span></div>
      <div class="kpi">${ic('question')}<b>${fa(s.open)}<small> از ${fa(s.myst)}</small></b><span>معمای باز</span></div>
    </div>
    <div class="sumcols">${pw.length ? `<div><h5>${ic('globe')} ریشه و قدرت بیرونی</h5>${bars(pw, 'power')}</div>` : ''}${rl.length ? `<div><h5>${ic('worship')} دین و مذهب (هنگام قدرت)</h5>${bars(rl, 'rel')}</div>` : ''}</div>`;
  }

  /* ——— سربرگ: نماها و فیلترهای کشویی ——— */
  function renderViews() {
    $('#views').innerHTML = VIEWS.map(([v, icon, label]) => `<button data-view="${v}" class="${st.view === v ? 'on' : ''}" title="${label}">${ic(icon)}<span>${label}</span></button>`).join('');
  }
  function pickerList(kind, items, selected) {
    return `<div class="pk-actions"><button class="lnk" data-act="pk-all" data-kind="${kind}">همه</button><button class="lnk" data-act="pk-none" data-kind="${kind}">هیچ</button></div>
      <div class="pk-list">${items.map((it) => `<label class="pk-row"><input type="checkbox" data-pkval="${kind}" value="${it.id}"${selected.has(it.id) ? ' checked' : ''}><i class="dot" style="background:${it.color}"></i><span>${esc(it.name)}</span><small>${fa(it.count)}</small></label>`).join('')}</div>`;
  }
  function renderPickers() {
    const counts = {}, rcounts = {};
    S.people.forEach((p) => {
      new Set(p.ties.filter((t) => t.kind !== 'enemy').map((t) => t.power)).forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
      new Set(p.rel).forEach((r) => { rcounts[r] = (rcounts[r] || 0) + 1; });
    });
    const powers = S.powers.filter((w) => counts[w.id]).map((w) => ({ ...w, count: counts[w.id] }));
    const rels = S.religions.filter((r) => rcounts[r.id]).map((r) => ({ ...r, count: rcounts[r.id] }));
    const picker = (id, icon, label, count, body) => `<div class="picker${st.pk === id ? ' open' : ''}">
      <button class="pk-btn${count ? ' active' : ''}" data-act="pk" data-pk="${id}">${ic(icon)}<span>${label}</span>${count ? `<b class="pk-count">${count}</b>` : ''}${ic('chevronDown', 'caret')}</button>
      ${st.pk === id ? `<div class="pk-pop">${body}</div>` : ''}</div>`;
    const tierBody = `<div class="pk-list">${[[1, 'فقط مستند'], [2, 'مستند و معتبر'], [3, 'تا ادعا'], [4, 'همه، با شایعه']].map(([v, t]) => `<label class="pk-row"><input type="radio" name="tier" data-pkval="tier" value="${v}"${st.maxTier === v ? ' checked' : ''}>${tierBadge(v)}<span>${t}</span></label>`).join('')}</div>`;
    $('#pickers').innerHTML = picker('powers', 'globe', 'ریشه و قدرت', st.powers.size ? fa(st.powers.size) : '', pickerList('power', powers, st.powers))
      + picker('rels', 'worship', 'دین و مذهب', st.rels.size ? fa(st.rels.size) : '', pickerList('rel', rels, st.rels))
      + picker('tier', 'badge', TIERS[st.maxTier] === 'شایعه' ? 'اعتبار' : `اعتبار: ${TIERS[st.maxTier]}`, st.maxTier !== 4 ? '•' : '', tierBody)
      + `<button class="tg${st.masks ? ' on' : ''}" data-act="masks" title="فقط کسانی که نقاب عوض کرده‌اند">${ic('masks')}</button>`
      + `<button class="tg${st.violent ? ' on' : ''}" data-act="violent" title="فقط مرگ خشونت‌آمیز">${ic('skull')}</button>`
      + (filtersActive() || st.maxTier !== 4 ? `<button class="tg clear" data-act="clear" title="پاک کردن همه فیلترها">${ic('filterX')}</button>` : '');
  }

  /* ——— ستون راهبری ——— */
  const groupKeysOfEra = (eraId) => [...S.groups.filter((g) => g.era === eraId).map((g) => `group:${g.id}`), `group:${eraId}:other`];
  function renderNav() {
    const active = filtersActive();
    const html = ERAS.map((era) => {
      const people = S.people.filter((p) => p.era === era.id);
      const vis = people.filter(matches);
      if (active && !vis.length) return '';
      const groups = S.groups.filter((g) => g.era === era.id);
      const rows = [...groups.map((g) => [g, vis.filter((p) => p.groups[0] === g.id)]),
        [null, vis.filter((p) => !groups.some((g) => g.id === p.groups[0]))]].filter(([g, m]) => m.length || (g && !active));
      const ek = `era:${era.id}`;
      const open = active || st.open.has(ek);
      const selE = st.sel && st.sel.kind === 'era' && st.sel.id === era.id;
      const anyGroupOpen = groupKeysOfEra(era.id).some((k) => st.open.has(k));
      return `<details class="n-era" data-key="${ek}"${open ? ' open' : ''}>
        <summary class="${selE ? 'sel' : ''}"><span class="dot" style="background:${era.color}"></span><span class="nm" data-era="${era.id}" title="${esc(era.name)}">${esc(era.name)}</span>
          <span class="cnt">${fa(vis.length)}</span>
          ${rows.length ? `<button class="mini" data-act="era-groups" data-era-id="${era.id}" title="${anyGroupOpen ? 'بستن همه گروه‌های این دوره' : 'باز کردن همه گروه‌های این دوره'}">${ic(anyGroupOpen ? 'anglesUp' : 'anglesDown')}</button>` : ''}</summary>
        <div class="n-era-meta"><span class="yr">${fa(era.start)}–${era.end ? fa(era.end) : 'امروز'}</span>${era.status !== 'verified' ? `<span class="st st-${era.status}">${ESTATUS[era.status] || ''}</span>` : ''}</div>
        ${rows.length ? rows.map(([g, m]) => {
          const gk = `group:${g ? g.id : era.id + ':other'}`;
          const gopen = active || st.open.has(gk);
          const selG = g && st.sel && st.sel.kind === 'group' && st.sel.id === g.id;
          return `<details class="n-group" data-key="${gk}"${gopen ? ' open' : ''}>
            <summary class="${selG ? 'sel' : ''}">${g && g.power ? `<span class="dot sm" style="background:${PW[g.power]?.color}"></span>` : ''}<span class="nm"${g ? ` data-group="${g.id}"` : ''}>${esc(g ? g.name : 'سایر')}</span><span class="cnt">${fa(m.length)}</span></summary>
            <div class="n-people">${m.sort((a, b) => (a._start ?? 0) - (b._start ?? 0)).map((p) => `<button class="n-person${st.sel && st.sel.kind === 'person' && st.sel.id === p.id ? ' sel' : ''}" data-person="${p.id}">${avatar(p, 'xs')}<span class="nm">${esc(p.name)}</span>${crown(p)}${badges(p)}${relDot(p)}<span class="yr">${p._rule ? ruleText(p) : life(p)}</span></button>`).join('')}</div>
          </details>`;
        }).join('') : '<p class="empty">هنوز کسی ثبت نشده — دوره در انتظار پژوهش است.</p>'}
      </details>`;
    }).join('');
    $('#nav-tree').innerHTML = html || '<p class="empty">موردی با این فیلتر پیدا نشد.</p>';
  }

  /* ——— ابزار مشترک صحنه ——— */
  const tbtn = (act, icon, label, extra = '') => `<button class="tbtn${extra}" data-act="${act}" title="${label}">${ic(icon)}<span>${label}</span></button>`;
  const ibtn = (act, icon, title, extra = '') => `<button class="ibtn${extra}" data-act="${act}" title="${title}">${ic(icon)}</button>`;
  const fullBtn = () => st.full ? tbtn('full', 'compress', 'خروج از تمام‌صفحه', ' accent') : tbtn('full', 'expand', 'تمام‌صفحه', ' accent');
  const zoomBox = (val, act) => `<div class="zoom">${ibtn(act + '-out', 'zoomOut', 'کوچک‌نمایی')}<span>${val}</span>${ibtn(act + '-in', 'zoomIn', 'بزرگ‌نمایی')}</div>`;
  const helpBox = (text) => `<details class="help"><summary>${ic('question')} راهنما</summary><p>${text}</p>${linkLegend()}</details>`;
  function linkLegend() {
    return `<div class="legend">${Object.entries(LINKS).map(([k, v]) => `<span class="lg"><i class="lk-${k}"></i>${v.name}</span>`).join('')}</div>`;
  }
  let chartView = null;
  function keepScroll(fn, initial) {
    const w = $('#chartwrap');
    const keep = w && chartView === st.view ? { x: w.scrollLeft, y: w.scrollTop, w: w.scrollWidth } : null;
    fn();
    chartView = st.view;
    const n = $('#chartwrap');
    if (!n) return;
    if (keep && keep.w) { n.scrollLeft = keep.x + (n.scrollWidth - keep.w); n.scrollTop = keep.y; }
    else if (initial) initial(n);
    else n.scrollLeft = n.scrollWidth;
  }

  /* ——— نمای کلان: گانت ——— */
  const Y0 = 600, Y1 = NOW + 6;
  function layoutTimeline() {
    const ppy = st.zoom;
    const X = (y) => Math.round((Y1 - y) * ppy) + 24;
    const W = X(Y0) + 24;
    const eraLanes = [];
    const eraBoxes = ERAS.map((e) => {
      const r = X(e.start), l = X(e.end ?? NOW);
      let lane = eraLanes.findIndex((left) => r <= left - 2);
      if (lane < 0) { lane = eraLanes.length; eraLanes.push(0); }
      eraLanes[lane] = l;
      return { e, l, r, lane };
    });
    let y = 30 + eraLanes.length * 26 + 12;
    const rows = [];
    const placed = Object.create(null);
    const span = (ps) => ({ r: X(Math.min(...ps.map((p) => p._start))), l: X(Math.max(...ps.map((p) => p._end))) });
    ERAS.forEach((e) => {
      const gs = S.groups.filter((g) => g.era === e.id);
      const inEra = S.people.filter((p) => p.era === e.id && p._start != null);
      if (!inEra.length) return;
      const blocks = [...gs.map((g) => [g, inEra.filter((p) => p.groups[0] === g.id)]), [null, inEra.filter((p) => !gs.some((g) => g.id === p.groups[0]))]]
        .filter(([, m]) => m.length)
        .map(([g, m]) => ({ group: g, key: 'g:' + (g ? g.id : e.id + ':other'), people: m.sort((a, b) => a._start - b._start) }))
        .sort((a, b) => a.people[0]._start - b.people[0]._start);
      const eKey = 'e:' + e.id;
      const eFold = st.tlFold.has(eKey);
      const es = span(inEra);
      rows.push({ kind: 'era', e, key: eKey, folded: eFold, y, r: es.r, n: inEra.length });
      y += 30;
      if (eFold) {
        rows.push({ kind: 'agg', key: eKey, color: e.color, people: inEra, y, ...es });
        inEra.forEach((p) => { placed[p.id] = { p, r: X(p._start), l: X(p._end), y, folded: true }; });
        y += 34;
        return;
      }
      blocks.forEach((b) => {
        const bs = span(b.people);
        const gFold = st.tlFold.has(b.key);
        const blk = { kind: 'block', e, group: b.group, key: b.key, folded: gFold, y, n: b.people.length };
        rows.push(blk);
        y += 24;
        if (gFold) {
          rows.push({ kind: 'agg', key: b.key, color: e.color, people: b.people, y, ...bs });
          b.people.forEach((p) => { placed[p.id] = { p, r: X(p._start), l: X(p._end), y, folded: true }; });
          blk.left = Math.min(bs.l, bs.r - 220); blk.right = bs.r; blk.h = 24 + 28;
          y += 28 + 10;
          return;
        }
        const lanes = [];
        let right = -Infinity, left = Infinity;
        b.people.forEach((p) => {
          const r = X(p._start), bl = X(p._end);
          const lw = (p.name.length + (p._rule ? ruleText(p).length + 3 : 0)) * 6.6 + 16 + (KING[p.id] ? 34 : 0);
          const lft = Math.min(bl, r - lw);
          let lane = lanes.findIndex((lx) => r <= lx - 10);
          if (lane < 0) { lane = lanes.length; lanes.push(0); }
          lanes[lane] = lft;
          placed[p.id] = { p, r, l: bl, y: y + lane * 24 };
          right = Math.max(right, r); left = Math.min(left, lft);
        });
        blk.left = Math.min(left, right - 220); blk.right = right; blk.h = 24 + lanes.length * 24;
        y += lanes.length * 24 + 12;
      });
      y += 4;
    });
    return { X, W, H: y + 16, ppy, eraBoxes, eraLanes: eraLanes.length, rows, placed };
  }
  const chevron = (folded) => `<path class="chev" d="${folded ? 'M3 0 L-3 5 L3 10' : 'M-5 2 L0 8 L5 2'}"/>`;

  function timelineSVG(L) {
    const out = [`<svg class="tl" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}" xmlns="http://www.w3.org/2000/svg">`];
    const step = L.ppy >= 9 ? 10 : L.ppy >= 4 ? 25 : 50;
    for (let yr = Math.ceil(Y0 / step) * step; yr <= Y1; yr += step) {
      const x = L.X(yr);
      const major = yr % 100 === 0;
      out.push(`<line class="grid${major ? ' major' : ''}" x1="${x}" x2="${x}" y1="20" y2="${L.H}"/>`);
      if (major || (L.ppy >= 4 && yr % 50 === 0) || L.ppy >= 9) out.push(`<text class="tick${major ? ' major' : ''}" x="${x}" y="14" text-anchor="middle">${fa(yr)}</text>`);
    }
    L.eraBoxes.forEach(({ e, l, r, lane }) => {
      const y = 26 + lane * 26;
      const sel = st.sel && st.sel.kind === 'era' && st.sel.id === e.id;
      out.push(`<g class="era-band${sel ? ' sel' : ''}${e.status === 'pending' ? ' pending' : ''}" data-era="${e.id}"><rect x="${l}" y="${y}" width="${Math.max(2, r - l)}" height="22" rx="6" style="--c:${e.color}"/><text x="${r - 8}" y="${y + 15}">${esc(e.name)}</text><title>${esc(e.name)} — ${ESTATUS[e.status] || ''}</title></g>`);
    });

    const selP = st.sel && st.sel.kind === 'person' ? st.sel.id : null;
    const related = new Set();
    if (selP) [...(OUT[selP] || []), ...(IN[selP] || [])].forEach((lk) => { if (tierOK(lk.tier)) related.add(lk.from === selP ? lk.to : lk.from); });
    const active = filtersActive();

    L.rows.forEach((row) => {
      if (row.kind === 'era') {
        // کل سطر دوره برای جمع و باز کردن کلیک‌پذیر است
        out.push(`<g class="erow" data-fold="${row.key}"><title>${row.folded ? 'باز کردن دوره' : 'جمع کردن دوره'}</title><rect class="erow-bg" x="0" y="${row.y}" width="${L.W}" height="26" style="--c:${row.e.color}"/>`
          + `<g transform="translate(${row.r + 10},${row.y + 8})">${chevron(row.folded)}</g>`
          + `<text class="erow-label" x="${row.r - 6}" y="${row.y + 18}">${esc(row.e.name)} · ${fa(row.n)} نفر</text></g>`);
      } else if (row.kind === 'block') {
        out.push(`<rect class="block" x="${row.left - 8}" y="${row.y - 2}" width="${row.right - row.left + 16}" height="${row.h}" rx="8" style="--c:${row.e.color}"/>`);
        out.push(`<g class="ghead" data-fold="${row.key}"><title>${row.folded ? 'باز کردن گروه' : 'جمع کردن گروه'}</title><rect class="hit" x="${row.left - 8}" y="${row.y - 2}" width="${row.right - row.left + 16}" height="22"/>`
          + `<g transform="translate(${row.right + 4},${row.y + 5})">${chevron(row.folded)}</g>`
          + `<text class="glabel" x="${row.right - 10}" y="${row.y + 14}">${esc(row.group ? row.group.name : `سایر — ${row.e.short || row.e.name}`)} (${fa(row.n)})</text></g>`);
      } else if (row.kind === 'agg') {
        const v = row.people.filter((p) => VIOLENT.has(p.death)).length;
        const m = row.people.filter((p) => p.masks.length).length;
        const w = Math.max(220, row.r - row.l);
        out.push(`<g class="agg" data-fold="${row.key}"><rect x="${row.r - w}" y="${row.y}" width="${w}" height="22" rx="6" style="--c:${row.color}"/>`
          + `<text x="${row.r - 8}" y="${row.y + 15}">${fa(row.people.length)} نفر${v ? ` · ${fa(v)} مرگ خشونت‌آمیز` : ''}${m ? ` · ${fa(m)} نقاب` : ''} — برای باز کردن بزنید</text></g>`);
      }
    });

    Object.values(L.placed).forEach(({ p, r, l, y, folded }) => {
      if (folded) return;
      const cls = ['pp'];
      if (active && !matches(p)) cls.push('dim');
      if (selP) cls.push(p.id === selP ? 'sel' : related.has(p.id) ? 'rel' : 'far');
      const tip = `${p.name} (${life(p)})${p._rule ? ` — ${p._rule.t}: ${ruleText(p)}` : ''} — ${relChain(p)}${p.summary ? ' — ' + p.summary : ''}`;
      out.push(`<g class="${cls.join(' ')}" data-person="${p.id}"><title>${esc(tip)}</title>`);
      out.push(`<rect class="bar${p._approx ? ' approx' : ''}" x="${l}" y="${y}" width="${Math.max(4, r - l)}" height="18" rx="5" style="--c:${pColor(p)}"/>`);
      out.push(`<rect class="relmark" x="${r - 4}" y="${y + 2}" width="3" height="14" rx="1.5" style="fill:${RL[p._relNow]?.color || '#999'}"/>`);
      const cr = svgCrown(p, r - 8, y - 2, 22);
      out.push(`${cr.svg}<text class="pname" x="${r - 8 - (cr.w ? cr.w + 5 : 0)}" y="${y + 13}">${esc(p.name)}${p._rule ? `<tspan class="prule"> · ${ruleText(p)}</tspan>` : ''}</text>`);
      if (VIOLENT.has(p.death) && p.died != null) out.push(`<path class="dead" d="M${l - 10} ${y + 5} l7 8 m0 -8 l-7 8"/>`);
      p.masks.forEach((m) => { if (m.year && tierOK(m.tier)) { const x = L.X(m.year); out.push(`<path class="mask" d="M${x} ${y - 3} l5 6 l-5 6 l-5 -6z"><title>${esc(`نقاب (${fa(m.year)}): ${m.from} ← ${m.to}`)}</title></path>`); } });
      out.push('</g>');
    });

    if (selP && L.placed[selP]) {
      const a = L.placed[selP];
      [...(OUT[selP] || []), ...(IN[selP] || [])].forEach((lk) => {
        if (!tierOK(lk.tier)) return;
        const b = L.placed[lk.from === selP ? lk.to : lk.from];
        if (!b) return;
        const ax = a.r, ay = a.y + (a.folded ? 11 : 9), bx = b.r, by = b.y + (b.folded ? 11 : 9);
        const bend = Math.min(140, 26 + Math.abs(ay - by) * 0.25);
        out.push(`<path class="lk lk-${lk.type}${(lk.tier ?? 2) >= 3 ? ' weak' : ''}" d="M${ax} ${ay} C${ax + bend} ${ay}, ${bx + bend} ${by}, ${bx} ${by}"><title>${esc(`${LINKS[lk.type]?.name || lk.type}: ${P[lk.from]?.name} ← ${P[lk.to]?.name}${lk.note ? ' — ' + lk.note : ''}`)}</title></path>`);
      });
    }
    out.push('</svg>');
    return out.join('');
  }

  let lastLayout = null;
  function renderOverview() {
    keepScroll(() => {
      const vis = S.people.filter(matches);
      lastLayout = layoutTimeline();
      $('#stage').innerHTML = `
        <div class="toolbar">
          <h2>${ic('gantt')} گانت</h2>
          ${tbtn('tl-expand', 'anglesDown', 'باز کردن همه')}${tbtn('tl-fold-groups', 'anglesUp', 'بستن گروه‌ها')}${tbtn('tl-fold-eras', 'anglesUp', 'بستن دوره‌ها')}
          <span class="sep"></span>${zoomBox(fa(st.zoom), 'zoom')}${ibtn('center', 'crosshairs', 'رفتن به نفر انتخاب‌شده')}
          <span class="grow"></span><span class="hint">${ic('hand')} برای جابه‌جایی بکشید</span>${fullBtn()}
        </div>
        ${helpBox('هر نوار یک نفر است از تولد تا مرگ، با سال خورشیدی. رنگ نوار نخستین ریشه یا قدرت بیرونی اوست (خاکستری: بی‌پیوند ثبت‌شده) و خط باریک سر نوار رنگ دین و مذهب اوست. لوزی طلایی تغییر نقاب و ضربدر قرمز مرگ خشونت‌آمیز است؛ لبه خط‌چین یعنی تاریخ تقریبی. روی سرسطر هر دوره یا گروه بزنید تا جمع یا باز شود. روی هر نفر بزنید تا پیوندهایش رسم شود.')}
        <details class="sumbox" data-sum${st.sumOpen ? ' open' : ''}><summary>${ic('chart')} چکیده آماری (${fa(vis.length)} نفر)</summary>${summaryHTML(summarize(vis))}</details>
        <div class="chart-wrap" id="chartwrap" dir="ltr">${timelineSVG(lastLayout)}</div>`;
    });
  }

  /* ——— پیوندهای تباری مشترک ——— */
  function kids(id, dir) {
    const arr = dir === 'down' ? (OUT[id] || []) : (IN[id] || []);
    return arr.filter((l) => st.types.has(l.type) && tierOK(l.tier))
      .map((l) => ({ l, p: P[dir === 'down' ? l.to : l.from] })).filter((x) => x.p)
      .sort((a, b) => (a.p._order ?? 0) - (b.p._order ?? 0));
  }
  function hitFinder(dir) {
    const memo = new Map();
    const hit = (id) => {
      if (memo.has(id)) return memo.get(id);
      memo.set(id, false);
      const r = matches(P[id]) || kids(id, dir).some((k) => hit(k.p.id));
      memo.set(id, r);
      return r;
    };
    return hit;
  }
  const allRoots = () => S.people.filter((p) => kids(p.id, 'up').length === 0 && kids(p.id, 'down').length > 0).sort((a, b) => (a._order ?? 0) - (b._order ?? 0));
  function typeChips() {
    return `<div class="types"><span class="flabel">${ic('link')} پیوندها:</span>${Object.entries(LINKS).map(([k, v]) => `<button class="tchip lk-${k}${st.types.has(k) ? ' on' : ''}" data-type="${k}"><i></i>${v.name}</button>`).join('')}</div>`;
  }

  /* ——— نمودار سلسله‌مراتبی: هر نفر یک بار، زیر «والد اصلی» خودش ———
     والد اصلی از میان پیوندهای تباری ورودی انتخاب می‌شود: هم‌گروه بودن، سپس نوع پیوند (خون، جانشینی، تربیت، برکشیدن)،
     سپس اعتبار، سپس قدیمی‌تر. والدهای دیگر روی کادر نوشته می‌شوند و می‌توان آن‌ها را به صورت خط‌چین نشان داد. */
  const HW = 240, HH = 92, HG = 18, HV = 50, HP = 28;
  // شکستن نام به حداکثر n سطر با اندازه‌گیری واقعی متن؛ سطر آخر در صورت نیاز با «…» کوتاه می‌شود
  const measureCtx = document.createElement('canvas').getContext('2d');
  function wrapName(s, maxW, n) {
    measureCtx.font = `700 13px ${getComputedStyle(document.body).fontFamily}`;
    const fits = (t) => measureCtx.measureText(t).width <= maxW;
    const words = s.split(/\s+/), lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (fits(t) || !cur) cur = t; else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > n) { lines.length = n; lines[n - 1] += ' …'; }
    lines.forEach((l, i) => { if (!fits(l)) { let t = l; while (t.length > 1 && !fits(t + '…')) t = t.slice(0, -1); lines[i] = t + '…'; } });
    return lines;
  }
  let lastHier = null;
  function primaryParents() {
    const parent = Object.create(null), others = Object.create(null);
    S.people.forEach((p) => {
      const ins = kids(p.id, 'up');
      if (!ins.length) return;
      const score = (x) => (x.p.groups[0] && x.p.groups[0] === p.groups[0] ? 0 : 100) + LINKS[x.l.type].rank * 10 + (x.l.tier ?? 2) + (x.p._start ?? 0) / 10000;
      ins.sort((a, b) => score(a) - score(b));
      parent[p.id] = ins[0];
      others[p.id] = ins.slice(1);
    });
    // شکستن چرخه‌ها: اگر زنجیره والد اصلی به خود نفر برگردد، آن نفر ریشه می‌شود
    Object.keys(parent).forEach((id) => {
      const seen = new Set([id]);
      let cur = parent[id] && parent[id].p.id;
      while (cur) { if (seen.has(cur)) { delete parent[id]; break; } seen.add(cur); cur = parent[cur] && parent[cur].p.id; }
    });
    const children = Object.create(null);
    Object.entries(parent).forEach(([id, x]) => { (children[x.p.id] ||= []).push({ p: P[id], l: x.l }); });
    Object.values(children).forEach((arr) => arr.sort((a, b) => (a.p._order ?? 0) - (b.p._order ?? 0)));
    return { parent, others, children };
  }
  function buildH(p, via, T) {
    const ch = T.children[p.id] || [];
    const n = { p, via, children: [], count: ch.length, folded: false, others: T.others[p.id] || [] };
    if (!ch.length) return n;
    if (st.hFold.has(p.id)) { n.folded = true; return n; }
    n.children = ch.map((k) => buildH(k.p, k.l, T));
    return n;
  }
  // همه نوادگان دارای فرزندِ یک نفر (خودش هم) در ساختار تباری کامل، بی‌توجه به جمع‌شدگی
  function subtreeIds(id, T, out = []) {
    if ((T.children[id] || []).length) { out.push(id); T.children[id].forEach((k) => subtreeIds(k.p.id, T, out)); }
    return out;
  }
  const deepOpen = (id, T) => subtreeIds(id, T).every((x) => !st.hFold.has(x));
  function measureH(n) {
    n.children.forEach(measureH);
    n.cw = n.children.reduce((s, c) => s + c.w, 0) + HG * Math.max(0, n.children.length - 1);
    n.w = Math.max(HW, n.cw);
  }
  function placeH(n, x0, depth, acc) {
    n.depth = depth;
    n.cx = x0 + n.w / 2;
    n.y = HP + depth * (HH + HV);
    acc.maxDepth = Math.max(acc.maxDepth, depth);
    acc.pos[n.p.id] = n;
    let right = x0 + (n.w + n.cw) / 2; // راست‌به‌چپ: نخستین فرزند در راست
    n.children.forEach((c) => { placeH(c, right - c.w, depth + 1, acc); right -= c.w + HG; });
  }
  function layoutHier() {
    const T = primaryParents();
    let roots = S.people.filter((p) => !T.parent[p.id] && (T.children[p.id] || []).length).sort((a, b) => (a._start ?? 0) - (b._start ?? 0));
    if (st.hRoot && P[st.hRoot]) roots = [P[st.hRoot]];
    else if (filtersActive()) {
      const memo = new Map();
      const hit = (id) => { if (memo.has(id)) return memo.get(id); memo.set(id, false); const r = matches(P[id]) || (T.children[id] || []).some((c) => hit(c.p.id)); memo.set(id, r); return r; };
      roots = roots.filter((r) => hit(r.id));
    }
    const trees = roots.map((r) => buildH(r, null, T));
    trees.forEach(measureH);
    const total = trees.reduce((s, t) => s + t.w, 0) + 60 * Math.max(0, trees.length - 1);
    const acc = { maxDepth: 0, pos: Object.create(null) };
    let right = HP + total;
    trees.forEach((t) => { placeH(t, right - t.w, 0, acc); right -= t.w + 60; });
    return { trees, T, W: total + HP * 2, H: HP * 2 + (acc.maxDepth + 1) * (HH + HV), pos: acc.pos, allRoots: S.people.filter((p) => !T.parent[p.id] && (T.children[p.id] || []).length) };
  }
  function hierSVG(L) {
    const z = st.hZoom;
    const out = [`<svg class="hier" width="${Math.round(L.W * z)}" height="${Math.round(L.H * z)}" viewBox="0 0 ${L.W} ${L.H}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="avclip" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath></defs>`];
    const edges = [], nodes = [], extra = [];
    const active = filtersActive();
    const selP = st.sel && st.sel.kind === 'person' ? st.sel.id : null;
    const walk = (n) => {
      n.children.forEach((c) => {
        const mid = n.y + HH + HV / 2;
        edges.push(`<path class="he lk-${c.via.type}${(c.via.tier ?? 2) >= 3 ? ' weak' : ''}" d="M${n.cx} ${n.y + HH} V${mid} H${c.cx} V${c.y}"><title>${esc(`${LINKS[c.via.type]?.name}: ${n.p.name} ← ${c.p.name}${c.via.note ? ' — ' + c.via.note : ''}`)}</title></path>`);
        walk(c);
      });
      const p = n.p;
      const cls = ['hn'];
      if (active) cls.push(matches(p) ? 'hit' : 'dim');
      if (selP === p.id) cls.push('sel');
      const x = n.cx - HW / 2;
      const rel = RL[p._relNow];
      const src = portraitSrc(p.id);
      const tx = HW - 62;
      const nameL = wrapName(p.name, tx - 12, 2);
      let ly = nameL.length > 1 ? 50 : 36;
      const line = (cls, txt, style = '') => { const s = `<text class="${cls}" x="${tx}" y="${ly}"${style}>${txt}</text>`; ly += 15; return s; };
      const otherNames = n.others.map((o) => o.p.name).join('، ');
      nodes.push(`<g class="${cls.join(' ')}" data-person="${p.id}" transform="translate(${x},${n.y})"><title>${esc(`${p.name} (${life(p)})${p._rule ? ` — ${p._rule.t}: ${ruleText(p)}` : ''} — ${relChain(p)}${otherNames ? ' — پیوند تباری دیگر: ' + otherNames : ''}`)}</title>`
        + `<rect class="hbox" width="${HW}" height="${HH}" rx="12" style="--c:${pColor(p)}"/>`
        + `<rect class="hera" x="${HW - 6}" y="0" width="6" height="${HH}" rx="3" style="fill:${eraOf(p)?.color || '#999'}"/>`
        + `<circle class="havbg" cx="${HW - 32}" cy="${HH / 2}" r="21" style="--c:${pColor(p)}"/>`
        + (src ? `<image data-zoom="${p.id}" href="${src}" x="${HW - 53}" y="${HH / 2 - 21}" width="42" height="42" preserveAspectRatio="xMidYMin slice" clip-path="url(#avclip)"/>` : `<text class="hinit" x="${HW - 32}" y="${HH / 2 + 6}" text-anchor="middle">${esc(initial(p))}</text>`)
        + svgCrown(p, HW - 18, -14, 26).svg
        + `<text class="hname" x="${tx}" y="19">${nameL.map((s, i) => `<tspan x="${tx}" dy="${i ? 16 : 0}">${esc(s)}</tspan>`).join('')}<title>${esc(p.name)}</title></text>`
        + (p._rule ? line('hrule', `${KING[p.id] ? 'سلطنت' : 'قدرت'} ${ruleText(p)}`) : '')
        + line('hyr', `${life(p)}${p.masks.length ? ' · نقاب' : ''}${VIOLENT.has(p.death) ? ' · ' + DEATH[p.death] : ''}`)
        + line('hrel', `${esc(p.rel.map(relShort).join(' ← '))}${n.others.length ? ` · +${fa(n.others.length)} پیوند` : ''}`, ` style="fill:${rel ? rel.color : '#999'}"`) + '</g>');
      if (n.count) nodes.push(`<g class="hfold${n.folded ? ' folded' : ''}" data-hfold="${p.id}" transform="translate(${n.cx},${n.y + HH + 12})"><title>${n.folded ? 'باز کردن شاخه' : 'جمع کردن شاخه'}</title><circle r="11"/><text y="4" text-anchor="middle">${n.folded ? fa(n.count) : '−'}</text></g>`);
      if (n.count) {
        const open = deepOpen(p.id, L.T);
        nodes.push(`<g class="hfold hdeep${open ? '' : ' folded'}" data-hdeep="${p.id}" transform="translate(${x + 14},${n.y + HH - 2})"><title>${open ? 'بستن کل شاخه تا آخرین نسل' : 'باز کردن کل شاخه تا آخرین نسل'}</title><circle r="10"/><text y="4" text-anchor="middle">${open ? '⇈' : '⇊'}</text></g>`);
      }
      if (st.hSecondary) n.others.forEach((o) => extra.push([o, n]));
    };
    L.trees.forEach(walk);
    const sec = extra.map(([o, n]) => {
      const a = L.pos[o.p.id];
      if (!a) return '';
      const ax = a.cx, ay = a.y + HH, bx = n.cx, by = n.y;
      return `<path class="hsec lk-${o.l.type}" d="M${ax} ${ay} C${ax} ${ay + 80}, ${bx} ${by - 80}, ${bx} ${by}"><title>${esc(`${LINKS[o.l.type]?.name} (فرعی): ${o.p.name} ← ${n.p.name}`)}</title></path>`;
    }).join('');
    out.push(...edges, sec, ...nodes, '</svg>');
    return out.join('');
  }
  function renderHier() {
    keepScroll(() => {
      lastHier = layoutHier();
      const roots = lastHier.allRoots.sort((a, b) => (a._start ?? 0) - (b._start ?? 0));
      const selPerson = st.sel && st.sel.kind === 'person' ? P[st.sel.id] : null;
      $('#stage').innerHTML = `
        <div class="toolbar">
          <h2>${ic('sitemap')} سلسله‌مراتب</h2>
          <label class="sel-wrap">${ic('diagram')}<select id="hroot"><option value="">همه ریشه‌ها (${fa(roots.length)})</option>${roots.map((r) => `<option value="${r.id}"${st.hRoot === r.id ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}${st.hRoot && !roots.some((r) => r.id === st.hRoot) && P[st.hRoot] ? `<option value="${st.hRoot}" selected>${esc(P[st.hRoot].name)}</option>` : ''}</select></label>
          ${selPerson ? tbtn('h-from-sel', 'sitemap', `شاخه «${selPerson.name}»`) : ''}
          <span class="sep"></span>${tbtn('h-expand', 'anglesDown', 'باز کردن همه')}${tbtn('h-collapse', 'anglesUp', 'بستن همه')}
          <button class="tbtn${st.hSecondary ? ' on' : ''}" data-act="h-secondary" title="نمایش پیوندهای تباری فرعی به صورت خط‌چین">${ic('link')}<span>پیوندهای فرعی</span></button>
          <span class="sep"></span>${zoomBox(fa(Math.round(st.hZoom * 100)) + '٪', 'hzoom')}${ibtn('h-fit', 'compress', 'جا دادن کل نمودار')}${ibtn('center', 'crosshairs', 'رفتن به نفر انتخاب‌شده')}
          <span class="grow"></span><span class="hint">${ic('hand')} برای جابه‌جایی بکشید</span>${fullBtn()}
        </div>
        ${helpBox('شجره به شکل نمودار سازمانی: هر نفر فقط یک بار، زیر «والد اصلی» خودش می‌آید (اولویت با هم‌خاندان، سپس خون، جانشینی، تربیت و برکشیدن). اگر کسی پیوند تباری دیگری هم دارد (مثلاً مادر یا حامی)، روی کادرش «+ پیوند» نوشته می‌شود و با دکمه «پیوندهای فرعی» به صورت خط‌چین نمایش داده می‌شود. لبه کادر رنگ ریشه بیرونی است و نوار کنار آن رنگ دوره. دایره زیر هر کادر شاخه را جمع یا باز می‌کند. برای جابه‌جایی، صفحه را بکشید؛ Ctrl و چرخ موس بزرگ‌نمایی می‌کند.')}
        ${typeChips()}
        <div class="chart-wrap hier-wrap" id="chartwrap" dir="ltr">${lastHier.trees.length ? hierSVG(lastHier) : '<p class="empty">ریشه‌ای با این فیلتر پیدا نشد.</p>'}</div>`;
    }, (wrap) => {
      const root = lastHier.trees[0];
      if (!root) return;
      wrap.scrollLeft = root.cx * st.hZoom - wrap.clientWidth / 2;
      wrap.scrollTop = 0;
    });
  }
  function hierFit() {
    const w = $('#chartwrap');
    if (!w || !lastHier) return;
    st.hZoom = Math.max(0.2, Math.min(1.8, Math.floor(Math.min(w.clientWidth / lastHier.W, w.clientHeight / lastHier.H) * 20) / 20));
    store.set('hZoom', st.hZoom);
    chartView = null;
    renderStage();
  }

  /* ——— شجره (فهرست) و ردپا ——— */
  function nodeLabel(p, via) {
    const active = filtersActive();
    return `<span class="node${active ? (matches(p) ? ' hit' : ' dim') : ''}${st.sel && st.sel.kind === 'person' && st.sel.id === p.id ? ' sel' : ''}">`
      + (via ? `<span class="via lk-${via.type}" title="${esc(via.note || '')}">${esc(LINKS[via.type]?.name || via.type)}${(via.tier ?? 2) !== 1 ? tierBadge(via.tier) : ''}</span>` : '')
      + `<button class="nm" data-person="${p.id}">${avatar(p, 'xs')}${esc(p.name)}${crown(p)}</button>`
      + `${ruleChip(p)}<span class="yr">${life(p)}</span>${relChip(p)}<span class="era-chip" style="--c:${eraOf(p)?.color}">${esc(eraOf(p)?.short || '')}</span>${badges(p)}</span>`;
  }
  // وضعیت باز/بسته هر شاخه که کاربر تغییر داده است؛ با بازسازی فهرست از دست نمی‌رود
  const treeOpen = new Map(Object.entries(store.get('treeOpen', {})));
  let treeSaveT = 0;
  document.addEventListener('toggle', (ev) => {
    const d = ev.target;
    if (!d.dataset || !d.dataset.tid || !d.closest('#treelist')) return;
    treeOpen.set(d.dataset.tid, d.open);
    clearTimeout(treeSaveT);
    treeSaveT = setTimeout(() => store.set('treeOpen', Object.fromEntries(treeOpen)), 200);
  }, true);
  // شاخه‌های بالادست نفر را باز می‌کند و او را در میانه صفحه می‌آورد
  function treeReveal(id) {
    const b = document.querySelector(`#treelist [data-person="${id}"]`);
    if (!b) return;
    const own = b.closest('summary') ? b.closest('details') : null;
    for (let d = b.closest('details'); d; d = d.parentElement.closest('details')) if (d !== own) d.open = true;
    b.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function treeDeep(id) {
    const top = document.querySelector(`#treelist details[data-tid="${id}"]`);
    if (!top) return;
    const all = [top, ...top.querySelectorAll('details')];
    const open = !all.every((d) => d.open);
    all.forEach((d) => { d.open = open; });
  }
  function treeMarkSel() {
    const id = st.sel && st.sel.kind === 'person' ? st.sel.id : null;
    document.querySelectorAll('#treelist .node').forEach((n) => n.classList.toggle('sel', !!id && n.querySelector(`[data-person="${id}"]`) !== null));
  }
  // skip: کسانی که جای دیگری از همین درخت آمده‌اند (شاهان در نمای قدرت) و زیر نیاکان تکرار نمی‌شوند
  function treeNode(p, via, dir, path, seen, depth, hit, skip) {
    const ch = path.has(p.id) ? [] : kids(p.id, dir).filter((k) => !skip || !skip.has(k.p.id));
    const repeat = seen.has(p.id);
    seen.add(p.id);
    const head = nodeLabel(p, via);
    if (!ch.length) return `<li class="leaf">${head}</li>`;
    if (repeat) return `<li class="leaf">${head}<span class="rep" title="این شاخه پیش‌تر در همین درخت آمده است">↺ ${fa(ch.length)}</span></li>`;
    path.add(p.id);
    const open = treeOpen.has(p.id) ? treeOpen.get(p.id) : filtersActive() ? hit(p.id) : false;
    const inner = ch.map((k) => treeNode(k.p, k.l, dir, path, seen, depth + 1, hit, skip)).join('');
    path.delete(p.id);
    return `<li><details data-tid="${p.id}"${open ? ' open' : ''}><summary>${head}<span class="kids">${fa(ch.length)}</span><button class="tdeep" data-tdeep="${p.id}" title="باز یا بسته کردن کل شاخه تا آخرین نسل">${ic('anglesDown')}</button></summary><ul>${inner}</ul></details></li>`;
  }
  // گره گروهی (سلسله یا دوره) در نمای قدرت
  function treeGroup(tid, label, color, items) {
    if (!items.length) return '';
    const open = treeOpen.has(tid) ? treeOpen.get(tid) : filtersActive();
    return `<li><details data-tid="${tid}"${open ? ' open' : ''}><summary><span class="tgroup" style="--c:${color || 'var(--gold)'}">${label}</span><span class="kids">${fa(items.length)}</span><button class="tdeep" data-tdeep="${tid}" title="باز یا بسته کردن کل شاخه تا آخرین نسل">${ic('anglesDown')}</button></summary><ul>${items.join('')}</ul></details></li>`;
  }
  function powerTree(hit, seen) {
    const ok = (p) => !filtersActive() || hit(p.id);
    const crowned = new Set(Object.keys(KING));
    const dyn = (S.dynasties || []).map((d) => {
      const ks = (d.kings || []).map((k) => P[typeof k === 'string' ? k : k.id]).filter(Boolean);
      return { d, ks, at: Math.min(...ks.map((p) => p._order ?? Infinity)) };
    }).filter((x) => x.ks.length).sort((a, b) => a.at - b.at);
    const rows = dyn.map(({ d, ks }) => treeGroup(`dyn:${d.id}`, `${crownSvg()} ${esc(d.name)}${Number.isFinite(ks[0]._order) ? ` <span class="yr">از ${fa(ks[0]._order)}</span>` : ''}`, d.foreign ? 'var(--neutral)' : 'var(--gold)',
      ks.filter(ok).map((p) => treeNode(p, null, 'down', new Set(), seen, 1, hit, crowned))));
    // صاحبان قدرتِ بی‌تاج، به تفکیک دوره و به ترتیب سال رسیدن به قدرت
    const others = S.people.filter((p) => p._rule && !KING[p.id] && ok(p)).sort((a, b) => a._order - b._order);
    const byEra = ERAS.map((e) => treeGroup(`era:${e.id}`, `دیگر صاحبان قدرت — ${esc(e.name)}`, e.color,
      others.filter((p) => p.era === e.id).map((p) => treeNode(p, null, 'down', new Set(), seen, 1, hit, crowned))));
    return [...rows, ...byEra].join('');
  }
  function renderTree() {
    const hit = hitFinder('down');
    const power = st.treeMode !== 'line';
    const seen = new Set();
    let body, lone;
    if (power) {
      body = powerTree(hit, seen);
      lone = S.people.filter((p) => !p._rule && !KING[p.id] && !kids(p.id, 'up').length && !kids(p.id, 'down').length && (!filtersActive() || matches(p)));
    } else {
      const roots = allRoots();
      const shown = filtersActive() ? roots.filter((r) => hit(r.id)) : roots;
      body = shown.map((r) => treeNode(r, null, 'down', new Set(), seen, 0, hit)).join('');
      lone = S.people.filter((p) => !kids(p.id, 'up').length && !kids(p.id, 'down').length && (!filtersActive() || matches(p)));
    }
    $('#stage').innerHTML = `
      <div class="stick-head"><div class="toolbar"><h2>${ic('listTree')} شجره (فهرست)</h2>
        <button class="tbtn${power ? ' on' : ''}" data-act="tree-mode-power" title="سلسله‌ها و صاحبان قدرت در ریشه، به ترتیب رسیدن به قدرت">${crownSvg()}<span>بر پایه قدرت</span></button>
        <button class="tbtn${power ? '' : ' on'}" data-act="tree-mode-line" title="نیاکان در ریشه، فرزندان زیرشان">${ic('listTree')}<span>بر پایه تبار</span></button>
        <span class="sep"></span>${tbtn('tree-expand', 'anglesDown', 'باز کردن همه')}${tbtn('tree-collapse', 'anglesUp', 'بستن همه')}</div>
      ${typeChips()}</div>
      ${helpBox('«بر پایه قدرت»: هر سلسله یک ریشه است و فرمانروایانش به ترتیب سلطنت زیر آن می‌آیند؛ دیگر صاحبان قدرت (وزیران، رهبران، فرماندهان) به تفکیک دوره و به ترتیب سال رسیدن به قدرت. زیر هر نفر فرزندان و شاگردانِ بی‌تاج او می‌آیند. «بر پایه تبار»: کهن‌ترین نیاکان در ریشه. در هر دو، ترتیب با سال رسیدن به قدرت است و برای کسانی که قدرتی نداشتند سال تولد. ↺ یعنی این شاخه پیش‌تر آمده است. دکمه کنار شمار فرزندان کل شاخه را تا آخرین نسل باز یا بسته می‌کند.')}
      <ul class="tree" id="treelist">${body || '<li class="empty">موردی پیدا نشد.</li>'}</ul>
      ${lone.length ? `<details class="lone"><summary>افراد بی‌پیوند در این نوع درخت (${fa(lone.length)})</summary><div class="lone-list">${lone.sort((a, b) => (a._order ?? 0) - (b._order ?? 0)).map((p) => personBtn(p.id)).join('')}</div></details>` : ''}`;
  }
  function renderTrail() {
    const p = st.sel && st.sel.kind === 'person' ? P[st.sel.id] : null;
    if (!p) {
      $('#stage').innerHTML = `<div class="toolbar"><h2>${ic('route')} ردپا</h2></div><p class="empty">یک نفر را از ستون راهبری، نمودارها یا جست‌وجو انتخاب کنید تا ریشه‌های او (بالادست) و ادامه‌اش (پایین‌دست) دنبال شود.</p>`;
      return;
    }
    const up = treeNode(p, null, 'up', new Set(), new Set(), 0, hitFinder('up'));
    const down = treeNode(p, null, 'down', new Set(), new Set(), 0, hitFinder('down'));
    $('#stage').innerHTML = `
      <div class="toolbar"><h2>${ic('route')} ردپای ${esc(p.name)}</h2></div>
      ${typeChips()}
      <div class="trail">
        <section><h3>ریشه‌ها (بالادست)</h3><ul class="tree">${up}</ul></section>
        <section><h3>ادامه (پایین‌دست)</h3><ul class="tree">${down}</ul></section>
      </div>`;
  }

  /* ——— معماها و منابع ——— */
  function mysteryCard(m, full) {
    const era = E[m.era];
    const ev = (arr, cls) => (arr.length ? `<ul class="ev ${cls}">${arr.map((x) => `<li>${tierBadge(x.tier)} ${esc(x.t)} ${srcList(x.src)}</li>`).join('')}</ul>` : '<p class="muted">—</p>');
    return `<article class="mcard${full ? ' full' : ''}">
      <header><button class="mtitle" data-mystery="${m.id}">${esc(m.title)}</button><span class="ms ms-${m.status}">${MSTATUS[m.status] || m.status}</span>${era ? `<span class="era-chip" style="--c:${era.color}">${esc(era.short || era.name)}</span>` : ''}</header>
      <p class="claim"><b>ادعا:</b> ${esc(m.claim)}</p>
      <div class="mpeople">${m.people.map(personBtn).join('')}</div>
      <div class="evcols"><div><h4>شواهد موافق</h4>${ev(m.for, 'for')}</div><div><h4>شواهد مخالف</h4>${ev(m.against, 'against')}</div></div>
      ${m.next.length ? `<div class="next"><h4>گام بعدی پژوهش</h4><ul>${m.next.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
    </article>`;
  }
  function renderMysteries() {
    const list = S.mysteries.filter((m) => (!st.mstatus || m.status === st.mstatus) && (!st.qn || m._text.includes(st.qn)));
    const counts = {}; S.mysteries.forEach((m) => { counts[m.status] = (counts[m.status] || 0) + 1; });
    $('#stage').innerHTML = `
      <div class="toolbar"><h2>${ic('question')} معماها و شایعه‌ها</h2></div>
      ${helpBox('هیچ ادعایی دور ریخته نمی‌شود و هیچ ادعایی بی‌شاهد پذیرفته نمی‌شود. هر معما شواهد موافق و مخالف با سطح اعتبار و منبع دارد.')}
      <div class="types"><button class="tchip${!st.mstatus ? ' on' : ''}" data-mstatus="">همه (${fa(S.mysteries.length)})</button>${Object.entries(MSTATUS).filter(([k]) => counts[k]).map(([k, v]) => `<button class="tchip ms-${k}${st.mstatus === k ? ' on' : ''}" data-mstatus="${k}">${v} (${fa(counts[k])})</button>`).join('')}</div>
      <div class="mlist">${list.map((m) => mysteryCard(m, false)).join('') || '<p class="empty">موردی پیدا نشد.</p>'}</div>`;
  }
  function renderSources() {
    const list = S.sources.filter((s) => !st.qn || norm(`${s.title} ${s.author} ${s.bias}`).includes(st.qn));
    const checked = S.sources.filter((s) => s.checked).length;
    $('#stage').innerHTML = `
      <div class="toolbar"><h2>${ic('books')} منابع</h2><span class="hint">${fa(checked)} از ${fa(S.sources.length)} منبع با متن اصلی تطبیق داده شده است</span></div>
      <div class="table-wrap"><table class="stable"><thead><tr><th>منبع</th><th>نویسنده</th><th>سال (خورشیدی)</th><th>نوع</th><th>سوگیری و یادداشت</th><th>ارجاع</th><th>وضعیت</th></tr></thead><tbody>
      ${list.map((s) => `<tr data-source="${s.id}"><td><b>${esc(s.title)}</b>${s.where ? `<div class="muted sm">${esc(s.where)}</div>` : ''}</td><td>${esc(s.author)}</td><td>${esc(s.year)}</td><td>${SKIND[s.kind] || esc(s.kind)}</td><td class="bias">${esc(s.bias || '—')}</td><td>${fa(CITES[s.id] ? CITES[s.id].size : 0)}</td><td>${s.checked ? '<span class="ok-tag">تطبیق‌شده</span>' : '<span class="no-tag">تطبیق نشده</span>'}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  /* ——— نفوذ خارجی: ترازو، خط زمان قدرت‌ها، دهه‌ها، دفتر گماشتن، دو اردوگاه ——— */
  const fmt1 = (x) => fa(String(Math.round(x * 10) / 10).replace('.', '٫'));
  function ivRangeYears() {
    const r = IV_RANGES.find((k) => k[0] === st.ivRange) || IV_RANGES[0];
    return r[0] === 'decade' ? [NOW - 10, NOW] : [r[2], r[3] ?? NOW];
  }
  const ivVisible = (v, from, to) => tierOK(v.tier) && v._end >= from && v.year <= to
    && (!st.powers.size || v.powers.some((w) => st.powers.has(w))) && (!st.qn || v._text.includes(st.qn));
  function ivScore(list) {
    const s = Object.create(null);
    list.forEach((v) => {
      const [, cat, w] = IV_KIND[v.kind] || ['', 'partner', 1];
      v.powers.forEach((p) => {
        if (st.powers.size && !st.powers.has(p)) return;
        const r = (s[p] ||= { id: p, control: 0, partner: 0, hostile: 0, limit: 0, n: 0 });
        r[cat] += w * (TIER_W[v.tier ?? 2] || 0.5); r.n++;
      });
    });
    return Object.values(s).sort((a, b) => (b.control + b.partner) - (a.control + a.partner) || b.hostile - a.hostile);
  }
  /* ——— خط زمان ردیفی مشترک (نفوذ خارجی و رشته‌ها): محور راست‌به‌چپ هم‌اندازه صفحه، ستون برچسب ثابت،
     بزرگ‌نمایی، کارت شناور و برچسب کوتاه رخدادهای کلیدی بی‌هم‌پوشانی ——— */
  const SWIM_LW = 150;
  const ZOOMS = [1, 1.5, 2, 3, 4, 6];
  const tipAttr = (lines) => `data-tip="${esc(lines.filter(Boolean).join('\n'))}"`;
  function swimAxis(from, to, zoom, lw = SWIM_LW) {
    const span = Math.max(1, to - from);
    const avail = Math.max(420, ($('#stage')?.clientWidth || 1000) - 80 - lw);
    const px = ((avail - 40) / span) * zoom;
    const W = Math.round(span * px + 40);
    const x = (y) => 20 + (W - 40) * (1 - (Math.min(Math.max(y, from), to) - from) / span);
    return { from, to, span, px, W, x, zoom, lw };
  }
  function swimFrame(A, H, top) {
    let g = '';
    ERAS.filter((e) => (e.end ?? NOW) >= A.from && e.start <= A.to).forEach((e) => {
      const r = A.x(e.start), l = A.x(e.end ?? NOW), w = Math.max(0, r - l);
      g += `<rect x="${l}" y="0" width="${w}" height="${H}" fill="${e.color}" opacity=".08"/>`;
      if (w > 34) g += `<text x="${(l + r) / 2}" y="15" class="iveralbl" text-anchor="middle">${esc(w > 70 ? e.short || e.name : (e.short || e.name).slice(0, 4))}</text>`;
    });
    const step = [5, 10, 25, 50, 100].find((s) => s * A.px >= 46) || 100;
    for (let y = Math.ceil(A.from / step) * step; y <= A.to; y += step) {
      g += `<line x1="${A.x(y)}" x2="${A.x(y)}" y1="${top - 10}" y2="${H}" class="ivtick"/><text x="${A.x(y)}" y="${top - 14}" class="ivyr" text-anchor="middle">${fa(y)}</text>`;
    }
    return g;
  }
  // برچسب کوتاه بالای نشانه؛ اگر جا نبود زیر آن، و اگر آن‌جا هم نبود نمی‌آید (کارت شناور همیشه هست)
  function swimLabel(slots, x, cy, text, r) {
    const w = text.length * 6.6 + 8;
    for (const [k, y] of [['up', cy - r - 7], ['down', cy + r + 15]]) {
      const used = (slots[k] ||= []);
      if (!used.some(([a, b]) => x + w / 2 > a && x - w / 2 < b)) {
        used.push([x - w / 2, x + w / 2]);
        return `<text x="${x}" y="${y}" class="swim-klbl" text-anchor="middle">${esc(text)}</text>`;
      }
    }
    return '';
  }
  function swimHTML(A, rows, H, inner, top, rowH, act) {
    const zi = ZOOMS.indexOf(A.zoom);
    return `<div class="swim-tools"><button class="ibtn" data-act="${act}" data-z="-1" title="کوچک‌نمایی"${zi <= 0 ? ' disabled' : ''}>${ic('zoomOut')}</button>
        <button class="tbtn" data-act="${act}" data-z="0" title="هم‌اندازه صفحه">${fa(Math.round(A.zoom * 100))}٪</button>
        <button class="ibtn" data-act="${act}" data-z="1" title="بزرگ‌نمایی"${zi >= ZOOMS.length - 1 ? ' disabled' : ''}>${ic('zoomIn')}</button>
        <span class="hint">نشانگر را روی هر نشانه نگه دارید؛ با کلیک، جزئیات و منبع در ستون کناری می‌آید.</span></div>
      <div class="swim" style="--lw:${A.lw}px">
        <div class="swim-labels"><div style="height:${top}px"></div>${rows.map((r) => `<div class="swim-lbl${r.cls ? ' ' + r.cls : ''}" style="height:${rowH}px">${r.label}</div>`).join('')}</div>
        <div class="swim-scroll ivlane-wrap" dir="ltr"><svg class="ivlanes" width="${A.W}" height="${H}" viewBox="0 0 ${A.W} ${H}">${inner}</svg></div>
      </div>`;
  }
  const zoomStep = (cur, d) => (d === 0 ? 1 : ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.indexOf(cur) + d))] ?? 1);
  // جای اسکرول خط زمان: جعبه اسکرول dir=ltr است و سال‌های کهن‌تر در راست، کنار ستون نام‌ها.
  // پس از بزرگ‌نمایی یا تغییر پهنا، همان مرکز دیدنی می‌ماند؛ در نخستین نمایش، آغاز خط زمان کنار نام‌ها دیده می‌شود.
  const SWIM_VIEWS = new Set(['influence', 'threads', 'prisons']);
  let swimPending = null;
  function swimState() {
    const s = $('#stage .swim-scroll');
    return s && s.scrollWidth > s.clientWidth ? { frac: (s.scrollLeft + s.clientWidth / 2) / s.scrollWidth } : null;
  }
  function swimApply(state) {
    document.querySelectorAll('#stage .swim-scroll').forEach((s) => {
      const max = s.scrollWidth - s.clientWidth;
      if (max <= 0) return;
      s.style.scrollBehavior = 'auto';
      s.scrollLeft = state ? Math.max(0, Math.min(max, state.frac * s.scrollWidth - s.clientWidth / 2)) : max;
      s.style.scrollBehavior = '';
    });
  }

  function ivShape(v, cx, cy, c) {
    const cat = IV_KIND[v.kind]?.[1];
    const op = { 1: 1, 2: 0.88, 3: 0.6, 4: 0.4 }[v.tier ?? 2];
    const sel = st.sel && st.sel.kind === 'intervention' && st.sel.id === v.id;
    const ring = v.placed.length || v.removed.length ? `<circle cx="${cx}" cy="${cy}" r="14" class="ivring"/>` : '';
    const mark = cat === 'control' ? `<circle cx="${cx}" cy="${cy}" r="9" fill="${c}" class="ivc"/>`
      : cat === 'partner' ? `<circle cx="${cx}" cy="${cy}" r="8" fill="var(--panel)" stroke="${c}" stroke-width="3"/>`
      : cat === 'hostile' ? `<rect x="${cx - 7}" y="${cy - 7}" width="14" height="14" transform="rotate(45 ${cx} ${cy})" fill="${c}" class="ivh"/>`
      : `<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="3 2"/>`;
    const who = (ids, lbl) => (ids.length ? `${lbl}: ${ids.map((id) => P[id]?.name || id).join('، ')}` : '');
    const tip = tipAttr([v.title, `${fa(v.year)}${v.end ? '–' + fa(v.end) : ''} ش · ${v.powers.map((w) => PW[w]?.name || w).join(' و ')}`,
      `${IV_CAT[cat]?.name || ''}: ${IV_KIND[v.kind]?.[0] || v.kind} · اعتبار: ${TIERS[v.tier ?? 2]}`, who(v.placed, 'به قدرت رسید'), who(v.removed, 'برکنار شد')]);
    return `<g class="ivm${sel ? ' sel' : ''}" data-interv="${v.id}" opacity="${op}" ${tip} aria-label="${esc(v.title)}"><circle cx="${cx}" cy="${cy}" r="19" class="ivsel"/><circle cx="${cx}" cy="${cy}" r="16" class="ivhit"/>${ring}${mark}</g>`;
  }
  function ivLegend() {
    const sw = (inner) => `<svg viewBox="-15 -15 30 30" width="24" height="24">${inner}</svg>`;
    return `<div class="ivlegend">
      <span>${sw('<circle r="9" fill="var(--muted)"/>')}مهار</span>
      <span>${sw('<circle r="8" fill="var(--panel)" stroke="var(--muted)" stroke-width="3"/>')}همکاری</span>
      <span>${sw('<rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" fill="var(--muted)" stroke="var(--danger)" stroke-width="2"/>')}دشمنی</span>
      <span>${sw('<circle r="8" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="3 2"/>')}خودداری</span>
      <span>${sw('<circle r="13" fill="none" stroke="var(--ink)" stroke-width="1.5"/><circle r="7" fill="var(--muted)"/>')}کسی را گماشت یا برکنار کرد</span>
      <span>${sw('<line x1="-13" x2="13" y1="0" y2="0" stroke="var(--muted)" stroke-width="8" stroke-linecap="round" opacity=".35"/>')}بازه چندساله</span>
      <span class="muted">کم‌رنگی = اعتبار کمتر</span></div>`;
  }
  function ivLanes(list, rows, from, to) {
    if (!rows.length) return '<p class="empty">رخدادی در این بازه و با این فیلترها نیست.</p>';
    const A = swimAxis(from, to, st.ivZoom);
    const RH = 72, TOP = 48, H = TOP + rows.length * RH + 8;
    let g = swimFrame(A, H, TOP);
    rows.forEach((r, i) => {
      const cy = TOP + i * RH + RH / 2, c = PW[r.id]?.color || '#888';
      g += `<line x1="0" x2="${A.W}" y1="${TOP + (i + 1) * RH}" y2="${TOP + (i + 1) * RH}" class="ivrow"/><line x1="10" x2="${A.W - 10}" y1="${cy}" y2="${cy}" stroke="${c}" stroke-opacity=".25" stroke-width="1.5"/>`;
      const seen = Object.create(null), slots = {};
      let marks = '', labels = '';
      list.filter((v) => v.powers.includes(r.id)).forEach((v) => {
        const k = (seen[v.year] = (seen[v.year] ?? -1) + 1);
        const dy = k ? (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 11 : 0;
        if (v._end > v.year) marks += `<line x1="${A.x(v._end)}" x2="${A.x(v.year)}" y1="${cy + dy}" y2="${cy + dy}" stroke="${c}" stroke-width="8" stroke-linecap="round" opacity=".28"/>`;
        marks += ivShape(v, A.x(v.year), cy + dy, c);
        if ((v.placed.length || v.removed.length) && !dy) labels += swimLabel(slots, A.x(v.year), cy, `${IV_KIND[v.kind]?.[0] || ''} ${fa(v.year)}`, 14);
      });
      g += marks + labels;
    });
    const lrows = rows.map((r) => ({ label: `${powerChip(r.id)}<span class="muted sm">${fa(r.n)}</span>` }));
    return swimHTML(A, lrows, H, g, TOP, RH, 'iv-zoom');
  }
  function ivMatrix(list, rows, from, to) {
    const d0 = Math.floor(from / 10) * 10, decs = [];
    for (let d = d0; d <= to; d += 10) decs.push(d);
    if (decs.length < 3 || !rows.length) return '';
    const cell = (p, d) => {
      const s = ivScore(list.filter((v) => v.powers.includes(p) && v._end >= d && v.year <= d + 9)).find((r) => r.id === p);
      if (!s) return '<td></td>';
      const inf = s.control + s.partner, a = Math.min(85, Math.round(inf * 14));
      return `<td style="background:color-mix(in srgb, ${PW[p]?.color || '#888'} ${a}%, transparent)" title="${esc(PW[p]?.name)} · دهه ${fa(d)} · مهار ${fmt1(s.control)} · همکاری ${fmt1(s.partner)} · دشمنی ${fmt1(s.hostile)}">${inf ? `<b>${fmt1(inf)}</b>` : ''}${s.hostile ? `<i class="ivhost">−${fmt1(s.hostile)}</i>` : ''}</td>`;
    };
    return `<div class="table-wrap"><table class="ivmatrix"><thead><tr><th>قدرت</th>${decs.map((d) => `<th>${fa(d)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr><th>${powerChip(r.id)}</th>${decs.map((d) => cell(r.id, d)).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function ivLedger(list, from, to) {
    const heads = S.people.map((p) => ({ p, r: p.roles.find((r) => HEAD_RE.test(r.t) && Number.isFinite(r.from) && (r.to ?? NOW) >= from && r.from <= to) }))
      .filter((x) => x.r).sort((a, b) => a.r.from - b.r.from);
    if (!heads.length) return '';
    const evs = (id, key) => list.filter((v) => v[key].includes(id)).map((v) => `<button class="ivev" data-interv="${v.id}">${v.powers.map((w) => `<i class="dot sm" style="background:${PW[w]?.color}"></i>`).join('')}${esc(v.powers.map((w) => PW[w]?.name || w).join(' و '))} · ${fa(v.year)}</button>${tierBadge(v.tier)}`).join(' ');
    let none = 0;
    const rows = heads.map(({ p, r }) => {
      const put = evs(p.id, 'placed'), out = evs(p.id, 'removed');
      const ties = p.ties.filter((t) => CAMP_KINDS.has(t.kind) && tierOK(t.tier) && PW[t.power]?.bloc && (!st.powers.size || st.powers.has(t.power)));
      if (!put) none++;
      return `<tr class="${put ? 'ivput' : ''}"><td class="yr">${fa(r.from)}${r.to ? '–' + fa(r.to) : ''}</td><td>${personBtn(p.id)}</td><td class="sm">${esc(r.t)}</td>
        <td>${put || '<span class="muted sm">سند گماشتن خارجی ثبت نشده</span>'}</td><td>${out || ''}</td>
        <td>${ties.map((t) => `${powerChip(t.power)}<span class="sm muted">${TIE_KINDS[t.kind]}</span>${tierBadge(t.tier)}`).join(' ')}</td></tr>`;
    }).join('');
    return `<p class="muted sm">${fa(heads.length)} شاه، نایب‌السلطنه، نخست‌وزیر، رئیس‌جمهور و رهبر در این بازه؛ برای ${fa(heads.length - none)} نفر رخداد گماشتن به دست قدرت خارجی ثبت است، با سطح اعتبار کنارش. «پیوند شخصی» یعنی کارگزاری، دست‌نشاندگی، اتحاد، پناهندگی یا داد و ستد مستند خود فرد (تحصیل شمرده نمی‌شود).</p>
      <div class="table-wrap"><table class="stable ivledger"><thead><tr><th>سال</th><th>نام</th><th>مقام</th><th>به قدرت رسید با دست</th><th>برکنار شد با دست</th><th>پیوند شخصی با اردوگاه‌ها</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function ivCamps(from, to) {
    const eras = ERAS.filter((e) => (e.end ?? NOW) >= from && e.start <= to && e.start >= 1284);
    const cols = eras.map((e) => {
      const buckets = { west: [], east: [], both: [] };
      S.people.filter((p) => p.era === e.id).forEach((p) => {
        const ts = p.ties.filter((t) => CAMP_KINDS.has(t.kind) && tierOK(t.tier) && PW[t.power]?.bloc && (!st.powers.size || st.powers.has(t.power)));
        const bl = new Set(ts.map((t) => PW[t.power].bloc));
        if (!bl.size) return;
        const best = Math.min(...ts.map((t) => t.tier ?? 2));
        const item = `<span class="ivcamp-p">${personBtn(p.id)}${tierBadge(best)}</span>`;
        buckets[bl.size > 1 ? 'both' : [...bl][0]].push(item);
      });
      const n = buckets.west.length + buckets.east.length + buckets.both.length;
      return `<div class="ivcamp"><h5><span class="dot" style="background:${e.color}"></span>${esc(e.name)} <span class="muted sm">(${fa(n)})</span></h5>
        <div class="ivcamp-cols"><div><b class="ivbloc west">غرب: بریتانیا، آمریکا، آلمان، فرانسه، اسرائیل</b>${buckets.west.join('') || '<span class="muted sm">—</span>'}</div>
        <div><b class="ivbloc east">شرق: روسیه/شوروی، چین</b>${buckets.east.join('') || '<span class="muted sm">—</span>'}</div>
        ${buckets.both.length ? `<div><b class="ivbloc both">هر دو</b>${buckets.both.join('')}</div>` : ''}</div></div>`;
    });
    return cols.join('');
  }
  function renderInfluence() {
    const [from, to] = ivRangeYears();
    const list = IVS.filter((v) => ivVisible(v, from, to));
    const rows = ivScore(list);
    const top = rows.filter((r) => r.control + r.partner > 0);
    const hostile = rows.filter((r) => r.hostile > 0).sort((a, b) => b.hostile - a.hostile);
    const placedHard = list.filter((v) => v.placed.length && (v.tier ?? 2) <= 2);
    const lastPlaced = placedHard[placedHard.length - 1];
    const max = Math.max(1, ...rows.map((r) => r.control + r.partner + r.hostile));
    const bar = (r) => `<div class="ivbar"><span class="pn">${powerChip(r.id)}</span>
      <span class="track"><i class="c" style="width:${(r.control / max) * 100}%;background:${PW[r.id]?.color}"></i><i class="p" style="width:${(r.partner / max) * 100}%;--c:${PW[r.id]?.color}"></i><i class="h" style="width:${(r.hostile / max) * 100}%"></i></span>
      <span class="nums" title="مهار · همکاری · دشمنی · خودداری"><b>${fmt1(r.control)}</b> · ${fmt1(r.partner)} · <em>${fmt1(r.hostile)}</em>${r.limit ? ` · <u>${fmt1(r.limit)}</u>` : ''}</span></div>`;
    const myIds = new Set(['m-dominant-power', 'm-east-roots', 'm-two-camps', ...list.map((v) => v.mystery).filter(Boolean)]);
    const myst = S.mysteries.filter((m) => myIds.has(m.id));
    $('#stage').innerHTML = `
      <div class="toolbar"><h2>${ic('hand')} نفوذ خارجی</h2>
        ${IV_RANGES.map(([k, label]) => `<button class="tbtn${st.ivRange === k ? ' on' : ''}" data-act="iv-range" data-range="${k}">${label}</button>`).join('')}
        <span class="hint">${fa(from)}–${fa(to)} ش · ${fa(list.length)} رخداد</span></div>
      ${helpBox('هر نشانه یک کنش ثبت‌شده یک قدرت خارجی بر ایران است، با منبع و سطح اعتبار. «مهار» یعنی قدرت مستقیم کسی را بالا برد، برکنار کرد، کشور را اشغال کرد یا شبکه پنهان داشت؛ «همکاری» پیمان، نفت، سلاح و میانجی‌گری است؛ «دشمنی» تحریم و جنگ؛ «خودداری» جایی است که قدرت از دفاع سر باز زد. امتیاز هر قدرت = وزن نوع کنش (مهار ۲ تا ۳، دیگران ۱) × وزن اعتبار (مستند ۱، معتبر ۰٫۷۵، ادعا ۰٫۴، شایعه ۰٫۱۵). این امتیاز فقط آنچه را تاکنون ثبت شده می‌شمارد و حکم نهایی نیست؛ فیلتر اعتبار و قدرت در سربرگ اینجا هم کار می‌کند. روی هر نشانه کلیک کنید تا جزئیات و منبع در ستون کناری بیاید.')}
      <section class="ivsec"><h3>${ic('chart')} ترازوی نفوذ در این بازه</h3>
        <div class="ivverdict">
          <p>${top.length ? `بیشترین مهار و همکاری ثبت‌شده: <b>${top.slice(0, 2).map((r) => esc(PW[r.id]?.name)).join('، سپس ')}</b>.` : 'هیچ مهار یا همکاری ثبت نشده.'}
          ${hostile.length ? ` بیشترین دشمنی: <b>${esc(PW[hostile[0].id]?.name)}</b>.` : ''}
          ${lastPlaced ? ` آخرین گماشتن مستند یا معتبر به دست قدرت خارجی: <button class="lnk" data-interv="${lastPlaced.id}">${esc(lastPlaced.title)} (${fa(lastPlaced.year)})</button>${lastPlaced.year < 1357 && to > 1357 ? '؛ پس از ۱۳۵۷ هیچ گماشتنی در سطح مستند یا معتبر ثبت نشده است' : ''}.` : ' در این بازه هیچ گماشتنی در سطح مستند یا معتبر ثبت نشده است.'}
          <button class="lnk" data-view="threads">${ic('diagram')} همین پرسش برای ۶۰۰ سال، از آق‌قویونلو تا امروز: نمای «رشته‌ها»</button></p>
        </div>
        <div class="ivbars"><div class="ivbar head"><span>قدرت</span><span>${ic('hand')} مهار ▮ همکاری ▯ دشمنی</span><span>مهار · همکاری · <em>دشمنی</em> · <u>خودداری</u></span></div>${rows.map(bar).join('') || '<p class="empty">—</p>'}</div>
      </section>
      <section class="ivsec"><h3>${ic('gantt')} خط زمان دخالت‌ها، به تفکیک قدرت</h3>${ivLegend()}${ivLanes(list, rows, from, to)}</section>
      ${to - from >= 30 ? `<section class="ivsec"><h3>${ic('hourglass')} دهه به دهه</h3><p class="muted sm">عدد = امتیاز مهار و همکاری در آن دهه؛ <i class="ivhost">−n</i> = دشمنی. رنگ پررنگ‌تر یعنی نفوذ بیشتر.</p>${ivMatrix(list, rows, from, to)}</section>` : ''}
      <section class="ivsec"><h3>${crownSvg()} دفتر گماشتن: چه کسی، با دست چه کسی؟</h3>${ivLedger(list, from, to)}</section>
      <section class="ivsec"><h3>${ic('users')} دو اردوگاه: پیوندهای شخصی ثبت‌شده با غرب و شرق</h3>
        <p class="muted sm">فقط پیوند خود فرد شمرده می‌شود (کارگزاری، دست‌نشاندگی، اتحاد، پناهندگی، داد و ستد) و نه تحصیل یا دشمنی. پیمان دولت با دولت پیوند شخصی نیست. نبودن نام کسی یعنی سندی برای او ثبت نشده، نه اینکه بی‌طرف بوده.</p>
        <div class="ivcamps">${ivCamps(from, to)}</div></section>
      <section class="ivsec"><h3>${ic('question')} معماهای این بخش</h3><div class="mlist">${myst.map((m) => mysteryCard(m, false)).join('')}</div></section>`;
  }
  function interventionDetail(v) {
    const [kname, cat] = IV_KIND[v.kind] || [v.kind, ''];
    const plist = (ids, label) => (ids.length ? `<h4>${label}</h4><div class="d-list">${ids.map((id) => `<div class="row">${personBtn(id)}</div>`).join('')}</div>` : '');
    return `<div class="d-head"><span class="kind">${ic('hand')} دخالت خارجی</span>${closeBtn()}</div>
      <h2 class="d-title">${esc(v.title)}</h2>
      <div class="meta"><span>${fa(v.year)}${v.end ? '–' + fa(v.end) : ''} ش</span>${v.powers.map(powerChip).join('')}</div>
      <p><span class="ivkind ivk-${cat}">${esc(IV_CAT[cat]?.name || '')}: ${esc(kname)}</span> ${tierBadge(v.tier)}</p>
      ${v.note ? `<p class="summary">${esc(v.note)}</p>` : ''}
      ${plist(v.placed, 'به قدرت رسیدند')}${plist(v.removed, 'برکنار شدند')}${plist(v.people, 'دیگر افراد درگیر')}
      ${v.mystery && MY[v.mystery] ? `<h4>${ic('question')} معمای مرتبط</h4><div class="d-list"><button class="row" data-mystery="${v.mystery}">${esc(MY[v.mystery].title)}<span class="ms ms-${MY[v.mystery].status}">${MSTATUS[MY[v.mystery].status]}</span></button></div>` : ''}
      <h4>${ic('books')} منابع</h4>${srcList(v.src)}`;
  }

  /* ——— رشته‌های بلند (data/threads.js): بنیادها، شبکه‌ها و دست‌های بیرونی در ۵۰۰ سال ———
     هر گام به رکوردی موجود ارجاع می‌دهد؛ سطح اعتبار و منبع از همان رکورد خوانده می‌شود. */
  const THREADS = S.threads || [];
  const TH = idx(THREADS);
  const TH_KIND = { foundation: ['بنیاد ماندگار', '#8d5a2b'], network: ['شبکه و خاندان', '#2e7d6b'], foreign: ['دست بیرونی', '#3a6fd0'], pattern: ['الگوی رفتار قدرت', '#7a2e2e'] };
  const TH_VERDICT = { continuous: 'پیوسته تا امروز', shifted: 'جابه‌جا شد', broken: 'گسست', contested: 'محل مناقشه' };
  const thColor = (th) => (th.power && PW[th.power]?.color) || TH_KIND[th.kind]?.[1] || '#888';
  function thResolve(s) {
    const r = { tier: s.tier, src: s.src, text: s.t, open: null };
    const i = (s.ref || '').indexOf(':'), kind = s.ref ? s.ref.slice(0, i) : '', rest = s.ref ? s.ref.slice(i + 1) : '';
    if (kind === 'link') {
      const m = rest.match(/^([^>]+)>([^:]+):(\w+)$/);
      const l = m && S.links.find((x) => x.from === m[1] && x.to === m[2] && x.type === m[3]);
      if (l) { r.tier ??= l.tier; r.src ??= l.src; r.text ||= `${P[l.from]?.name} ← ${LINKS[l.type]?.name} → ${P[l.to]?.name}${l.note ? ': ' + l.note : ''}`; r.open = ['person', l.to]; }
    } else if (kind === 'iv' && IV[rest]) {
      const v = IV[rest]; r.tier ??= v.tier; r.src ??= v.src; r.text ||= v.title; r.open = ['interv', v.id];
    } else if (kind === 'my' && MY[rest]) {
      const m = MY[rest]; r.tier ??= 3; r.text ||= m.title; r.open = ['mystery', m.id]; r.mystery = m;
    } else if (kind === 'mask') {
      const [pid, n] = rest.split(':'); const mk = P[pid]?.masks?.[+n];
      if (mk) { r.tier ??= mk.tier; r.src ??= mk.src; r.text ||= `${mk.from} ← ${mk.to}`; r.open = ['person', pid]; }
    } else if (kind === 'tie') {
      const [pid, pw] = rest.split(':'); const t = (P[pid]?.ties || []).find((x) => x.power === pw);
      if (t) { r.tier ??= t.tier; r.src ??= t.src; r.text ||= t.note || TIE_KINDS[t.kind]; r.open = ['person', pid]; }
    }
    r.tier ??= 2; r.src ||= [];
    if (!r.open && (s.p || []).length) r.open = ['person', s.p[0]];
    return r;
  }
  const TH_OF = Object.create(null);
  THREADS.forEach((th) => {
    th.steps = (th.steps || []).slice().sort((a, b) => a.y - b.y);
    th.steps.forEach((s) => { s.p ||= []; s._r = thResolve(s); s.p.forEach((id) => { if (!(TH_OF[id] ||= []).includes(th)) TH_OF[id].push(th); }); });
    th._text = norm([th.name, th.question, th.summary, th.verdict?.t, ...th.steps.map((s) => s._r.text), ...th.steps.flatMap((s) => s.p.map((id) => P[id]?.name))].join(' '));
  });
  const thVisible = (th) => (!st.thKind || th.kind === st.thKind) && (!st.qn || th._text.includes(st.qn))
    && (!st.powers.size || !th.power || st.powers.has(th.power));

  // چه کسی پشت سر بود؟ پیوندهای شخصی (کارگزار، دست‌نشانده، متحد، داد و ستد، پناهنده؛ و حضور مأموران خارجی) و دخالت‌های «مهار» و «همکاری»
  const BEHIND_W = { agent: 3, client: 3, ally: 1, trade: 1, refuge: 0.5 };
  function powerSpan(p) {
    const rs = p.roles.filter((r) => Number.isFinite(r.from));
    if (rs.length) return [Math.min(...rs.map((r) => r.from)), Math.max(...rs.map((r) => r.to ?? (p.death === 'alive' ? NOW : r.from)))];
    if (p.active) return [p.active[0], p.active[1] ?? NOW];
    if (Number.isFinite(p.born)) return [p.born + 20, Math.min(p.died ?? NOW, p.born + 65)];
    if (Number.isFinite(p.died)) return [p.died - 20, p.died];
    return null;
  }
  function behindItems() {
    const out = [];
    S.people.forEach((p) => {
      const span = powerSpan(p);
      if (!span) return;
      // مأمور خارجی حاضر در ایران (گروه از نوع «قدرت خارجی») فقط «حضور» آن قدرت است؛ «مهار» فقط از ایرانیِ کارگزار یا دست‌نشانده
      const agentAbroad = G[p.groups[0]]?.kind === 'foreign';
      p.ties.forEach((t) => {
        const w = agentAbroad ? (t.kind === 'enemy' || t.kind === 'education' ? 0 : 1) : BEHIND_W[t.kind];
        if (!w || !tierOK(t.tier) || (st.powers.size && !st.powers.has(t.power))) return;
        out.push({ power: t.power, from: span[0], to: span[1], w: w * (TIER_W[t.tier ?? 2] || 0.5), control: !agentAbroad && (t.kind === 'agent' || t.kind === 'client'), who: p.id });
      });
    });
    IVS.forEach((v) => {
      const [, cat, w] = IV_KIND[v.kind] || [];
      if ((cat !== 'control' && cat !== 'partner') || !tierOK(v.tier)) return;
      v.powers.forEach((pw) => {
        if (st.powers.size && !st.powers.has(pw)) return;
        out.push({ power: pw, from: v.year, to: v._end, w: w * (TIER_W[v.tier ?? 2] || 0.5), control: cat === 'control', iv: v.id });
      });
    });
    return out;
  }
  function behindMatrix(items) {
    const B0 = 800, STEP = 25, bins = [];
    for (let b = B0; b <= NOW; b += STEP) bins.push(b);
    const agg = Object.create(null);
    items.forEach((it) => bins.forEach((b) => {
      if (it.to < b || it.from > b + STEP - 1) return;
      const r = (agg[it.power] ||= { id: it.power, total: 0, cells: {} });
      const c = (r.cells[b] ||= { w: 0, ctl: 0, who: new Set(), ivs: new Set() });
      c.w += it.w; r.total += it.w;
      if (it.control) c.ctl += it.w;
      if (it.who) c.who.add(it.who);
      if (it.iv) c.ivs.add(it.iv);
    }));
    const rows = Object.values(agg).sort((a, b) => b.total - a.total).slice(0, 14);
    if (!rows.length) return '<p class="empty">با این فیلترها پیوندی نیست.</p>';
    const max = Math.max(1, ...rows.flatMap((r) => Object.values(r.cells).map((c) => c.w)));
    const eraAt = (y) => ERAS.filter((e) => e.start <= y && (e.end ?? NOW) >= y).pop();
    const head = bins.map((b) => { const e = eraAt(b + 12); return `<th class="bhy"><i style="background:${e ? e.color : 'transparent'}" title="${esc(e ? e.name : '')}"></i>${fa(b)}</th>`; }).join('');
    const cell = (r, b) => {
      const c = r.cells[b];
      if (!c) return '<td class="bh"></td>';
      const a = Math.round(14 + 76 * Math.sqrt(c.w / max));
      const names = [...c.who].map((id) => P[id]?.name).filter(Boolean);
      const tip = tipAttr([`${PW[r.id]?.name || r.id} · ${fa(b)}–${fa(b + STEP - 1)} ش`,
        `مهار (کارگزار، دست‌نشانده، کودتا، اشغال…): ${fmt1(c.ctl)}`, `همکاری و حضور: ${fmt1(c.w - c.ctl)}`,
        names.length ? `افراد: ${names.slice(0, 6).join('، ')}${names.length > 6 ? ` و ${fa(names.length - 6)} تن دیگر` : ''}` : '',
        c.ivs.size ? `رخدادها: ${[...c.ivs].map((id) => IV[id]?.title).slice(0, 3).join('؛ ')}` : '']);
      return `<td class="bh${c.ctl ? ' ctl' : ''}" style="--c:${PW[r.id]?.color || '#888'};--a:${a}%" ${tip}>${c.ctl ? '<b>●</b>' : ''}</td>`;
    };
    return `<div class="table-wrap bh-wrap"><table class="bhmatrix"><thead><tr><th class="bhp">قدرت</th>${head}</tr></thead>
      <tbody>${rows.map((r) => `<tr><th class="bhp">${powerChip(r.id)}</th>${bins.map((b) => cell(r, b)).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function behindByEra(items) {
    const row = ({ e, ctl, part }) => `<div class="bherarow"><span class="era-chip" style="--c:${e.color}">${esc(e.short || e.name)}</span>
      <div><b class="bhlbl ctl">مهار مستند:</b> ${ctl.length ? ctl.map((r) => `${powerChip(r.id)}<span class="sm muted">${fmt1(r.ctl)}</span>`).join(' ') : '<span class="muted sm">هیچ مهار مستندی ثبت نشده</span>'}</div>
      <div><b class="bhlbl">همکاری و حضور:</b> ${part.length ? part.map((r) => `${powerChip(r.id)}<span class="sm muted">${fmt1(r.w - r.ctl)}</span>`).join(' ') : '<span class="muted sm">—</span>'}</div></div>`;
    return ERAS.map((e) => {
      const a = e.start, b = e.end ?? NOW, agg = {};
      items.forEach((it) => {
        if (it.to < a || it.from > b) return;
        const r = (agg[it.power] ||= { id: it.power, w: 0, ctl: 0 });
        r.w += it.w; if (it.control) r.ctl += it.w;
      });
      const rs = Object.values(agg);
      return row({ e, ctl: rs.filter((r) => r.ctl > 0).sort((x, y) => y.ctl - x.ctl).slice(0, 3), part: rs.filter((r) => r.w - r.ctl > 0.01).sort((x, y) => (y.w - y.ctl) - (x.w - x.ctl)).slice(0, 3) });
    }).join('');
  }

  function thMark(th, s, k, cx, cy, sel) {
    const c = thColor(th), r = s._r, solid = r.tier <= 2;
    const tip = tipAttr([`${fa(s.y)} ش · ${th.name}`, r.text, s.p.map((id) => P[id]?.name).filter(Boolean).join('، '),
      `اعتبار: ${TIERS[r.tier]}${s.k === 'break' ? ' · گسست یا کوشش برای بریدن' : ''}${s.k === 'claim' || r.mystery ? ' · ادعا / معما' : ''}`]);
    const shape = s.k === 'break'
      ? `<rect x="${cx - 7}" y="${cy - 7}" width="14" height="14" rx="2" fill="var(--panel)" stroke="var(--danger)" stroke-width="2.5"/><path d="M${cx - 4} ${cy - 4}L${cx + 4} ${cy + 4}M${cx + 4} ${cy - 4}L${cx - 4} ${cy + 4}" stroke="var(--danger)" stroke-width="2.2"/>`
      : s.k === 'claim' || r.mystery
        ? `<circle cx="${cx}" cy="${cy}" r="9" fill="var(--panel)" stroke="${c}" stroke-width="2.2" stroke-dasharray="3 2"/><text x="${cx}" y="${cy + 4}" class="thq" text-anchor="middle">؟</text>`
        : `<circle cx="${cx}" cy="${cy}" r="${solid ? 8.5 : 8}" fill="${solid ? c : 'var(--panel)'}" stroke="${c}" stroke-width="${solid ? 2 : 2.5}" class="thc"/>`;
    return `<g class="ivm thm${sel ? ' sel' : ''}" data-thread="${th.id}" data-step="${k}" ${tip}><circle cx="${cx}" cy="${cy}" r="19" class="ivsel"/><circle cx="${cx}" cy="${cy}" r="16" class="ivhit"/>${shape}</g>`;
  }
  function threadLanes(list) {
    if (!list.length) return '<p class="empty">رشته‌ای با این فیلترها نیست.</p>';
    const from = Math.floor((Math.min(...list.flatMap((t) => t.steps.map((s) => s.y))) - 15) / 10) * 10;
    const A = swimAxis(from, NOW, st.thZoom, 210);
    const RH = 78, TOP = 48, H = TOP + list.length * RH + 8;
    let g = swimFrame(A, H, TOP);
    list.forEach((th, i) => {
      const cy = TOP + i * RH + RH / 2, c = thColor(th);
      g += `<line x1="0" x2="${A.W}" y1="${TOP + (i + 1) * RH}" y2="${TOP + (i + 1) * RH}" class="ivrow"/>`;
      let lines = '', marks = '', labels = '';
      const slots = {};
      const xs = th.steps.map((s) => A.x(s.y));
      th.steps.forEach((s, k) => {
        if (k) {
          const p = th.steps[k - 1], weak = s._r.tier > 2 || p._r.tier > 2 || s.k || s._r.mystery;
          lines += `<line x1="${xs[k - 1]}" x2="${xs[k]}" y1="${cy}" y2="${cy}" stroke="${s.k === 'break' ? 'var(--danger)' : c}" stroke-width="${weak ? 2 : 4}" ${weak ? 'stroke-dasharray="5 4"' : ''} stroke-opacity=".75"/>`;
        }
        const sel = st.sel && st.sel.kind === 'thread' && st.sel.id === th.id && st.thStep === k;
        marks += thMark(th, s, k, xs[k], cy, sel);
        labels += swimLabel(slots, xs[k], cy, fa(s.y), 10);
      });
      if (th.verdict?.kind === 'continuous') lines += `<line x1="${A.x(NOW)}" x2="${xs[xs.length - 1]}" y1="${cy}" y2="${cy}" stroke="${c}" stroke-width="2" stroke-dasharray="1 4" stroke-opacity=".7"/>`;
      g += lines + marks + labels;
    });
    const rows = list.map((th) => ({ cls: 'multi', label: `<button class="thname" data-thread="${th.id}" style="--c:${thColor(th)}">${esc(th.name)}</button><span class="thv thv-${th.verdict?.kind}">${TH_VERDICT[th.verdict?.kind] || ''}</span>` }));
    return swimHTML(A, rows, H, g, TOP, RH, 'th-zoom');
  }
  function thLegend() {
    const sw = (inner) => `<svg viewBox="-15 -15 30 30" width="24" height="24">${inner}</svg>`;
    return `<div class="ivlegend">
      <span>${sw('<circle r="8.5" fill="var(--muted)" stroke="var(--muted)" stroke-width="2"/>')}مستند یا معتبر</span>
      <span>${sw('<circle r="8" fill="var(--panel)" stroke="var(--muted)" stroke-width="2.5"/>')}ادعا یا شایعه</span>
      <span>${sw('<circle r="9" fill="var(--panel)" stroke="var(--muted)" stroke-width="2.2" stroke-dasharray="3 2"/><text y="4" text-anchor="middle" style="font-size:11px;font-weight:900;fill:var(--muted)">؟</text>')}معما</span>
      <span>${sw('<rect x="-7" y="-7" width="14" height="14" rx="2" fill="var(--panel)" stroke="var(--danger)" stroke-width="2.5"/><path d="M-4 -4L4 4M4 -4L-4 4" stroke="var(--danger)" stroke-width="2.2"/>')}گسست یا کوشش برای بریدن</span>
      <span>${sw('<line x1="-13" x2="13" y1="0" y2="0" stroke="var(--muted)" stroke-width="4"/>')}پیوند مستند</span>
      <span>${sw('<line x1="-13" x2="13" y1="0" y2="0" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 4"/>')}پیوند ضعیف</span>
      <span>${sw('<line x1="-13" x2="13" y1="0" y2="0" stroke="var(--muted)" stroke-width="2" stroke-dasharray="1 4"/>')}ادامه تا امروز</span></div>`;
  }
  function threadCard(th, hi) {
    const [kname] = TH_KIND[th.kind] || [th.kind];
    const open = (r) => {
      if (!r.open) return '';
      const [k, id] = r.open;
      if (k === 'interv') return `<button class="lnk sm" data-interv="${id}">${ic('hand')} رخداد</button>`;
      if (k === 'mystery') return `<button class="lnk sm" data-mystery="${id}">${ic('question')} معما <span class="ms ms-${MY[id].status}">${MSTATUS[MY[id].status]}</span></button>`;
      return '';
    };
    return `<article class="thcard" id="thc-${th.id}" style="--c:${thColor(th)}">
      <header><button class="thtitle" data-thread="${th.id}">${esc(th.name)}</button><span class="thkind">${esc(kname)}</span><span class="thv thv-${th.verdict?.kind}">${TH_VERDICT[th.verdict?.kind] || ''}</span></header>
      <p class="claim"><b>پرسش:</b> ${esc(th.question)}</p>
      <p class="summary">${esc(th.summary)}</p>
      <div class="thverdict"><b>آنچه داده تاکنون نشان می‌دهد:</b> ${esc(th.verdict?.t || '')}</div>
      <ol class="thsteps">${th.steps.map((s, k) => `<li class="${s.k ? 'k-' + s.k : ''}${s._r.mystery ? ' k-claim' : ''}${k === hi ? ' hi' : ''}" data-thread="${th.id}" data-step="${k}">
        <span class="yr">${fa(s.y)}</span>
        <div><div class="sttext">${s.k === 'break' ? '<span class="sttag brk">گسست</span>' : ''}${s.k === 'claim' || s._r.mystery ? '<span class="sttag clm">ادعا</span>' : ''}${esc(s._r.text)}</div>
          ${s.p.length ? `<div class="mpeople">${s.p.map(personBtn).join('')}</div>` : ''}
          <div class="mmeta">${tierBadge(s._r.tier)}${srcList(s._r.src)}${open(s._r)}</div></div></li>`).join('')}</ol>
    </article>`;
  }
  function renderThreads() {
    const list = THREADS.filter(thVisible);
    const items = behindItems();
    const kinds = Object.entries(TH_KIND).map(([k, [n, c]]) => `<button class="tchip${st.thKind === k ? ' on' : ''}" data-act="th-kind" data-kind="${k}" style="--c:${c}">${n} (${fa(THREADS.filter((t) => t.kind === k).length)})</button>`).join('');
    $('#stage').innerHTML = `
      <div class="toolbar"><h2>${ic('diagram')} رشته‌های بلند: آنچه زیر رژیم‌ها ماند</h2><span class="hint">${fa(list.length)} رشته · ${fa(list.reduce((a, t) => a + t.steps.length, 0))} گام</span></div>
      ${helpBox('رژیم‌ها عوض شدند؛ اینجا آنچه زیر آن‌ها ماند دنبال می‌شود: بنیادها (مانند تشیع دولتی صفوی)، شبکه‌ها و خاندان‌ها، دست قدرت‌های بیرونی و الگوهای رفتار قدرت. هر گام یک رکورد ثبت‌شده در داده است، با سطح اعتبار و منبع. پیوند پررنگ یعنی هر دو سر مستند یا معتبرند؛ نقطه‌چین یعنی ادعا، معما یا گسست. جدول «چه کسی پشت سر بود» فقط پیوندها و دخالت‌های ثبت‌شده را می‌شمارد؛ دوره‌ای که بیشتر پژوهش شده، پیوند بیشتری نشان می‌دهد. داوری درباره درستی باورهای دینی بیرون از توان سند است؛ اینجا فقط ادعاهای تاریخی سنجش‌پذیر (اجبار، نسب، واردات روحانیت، پول و فرمان بیگانه) آمده است.')}
      <section class="ivsec"><h3>${ic('globe')} چه کسی پشت سر بود؟ قدرت‌های بیرونی در ۶۰۰ سال</h3>
        <p class="muted sm">هر خانه ۲۵ سال است. رنگ پررنگ‌تر = پیوند و دخالت ثبت‌شده بیشتر. <b>●</b> = دست‌کم یک سند «مهار»: کارگزار یا دست‌نشانده مستند، کودتا، گماشتن، اشغال، دولت دست‌نشانده یا پرداخت پنهان. نشانگر را روی هر خانه نگه دارید تا نام‌ها و رخدادها بیاید. پیوند شخصی تاریخ ندارد و در سراسر دوره قدرت همان فرد شمرده می‌شود؛ مأموران خارجی حاضر در ایران فقط «حضور» شمرده می‌شوند، نه «مهار».</p>
        ${behindMatrix(items)}
        <h4 class="bhh">دوره به دوره: مهار در برابر همکاری</h4>
        <div class="bhera">${behindByEra(items)}</div></section>
      <section class="ivsec"><h3>${ic('gantt')} رشته‌ها روی یک خط زمان</h3>
        <div class="types">${`<button class="tchip${!st.thKind ? ' on' : ''}" data-act="th-kind" data-kind="">همه (${fa(THREADS.length)})</button>`}${kinds}</div>
        ${thLegend()}${threadLanes(list)}</section>
      <section class="thcards">${list.map((th) => threadCard(th, st.sel && st.sel.kind === 'thread' && st.sel.id === th.id ? st.thStep : -1)).join('') || '<p class="empty">رشته‌ای پیدا نشد.</p>'}</section>`;
  }
  function threadDetail(th) {
    return `<div class="d-head"><span class="kind">${ic('diagram')} رشته بلند</span>${closeBtn()}</div>${threadCard(th, st.thStep ?? -1)}
      <p class="muted sm"><button class="lnk" data-view="threads">${ic('gantt')} دیدن همه رشته‌ها روی خط زمان</button></p>`;
  }

  /* ——— زندان، تبعید و حصر (data/prisons.js): چه کسی، کجا، به دست چه کسی، با چه کسانی ———
     هم‌بندی = یک جای ثبت‌شده و سال‌های هم‌پوشان، یا هم‌بند مستند (with). نشانه‌ها فرضیه‌اند برای سنجش، نه حکم. */
  const PRISON = idx(S.prisons || []);
  const JAILS = (S.jails || []).slice();
  const J_KIND = { prison: 'زندان', fortress: 'قلعه', house: 'حصر خانگی', exile: 'تبعید', internment: 'بازداشت بیگانه', hostage: 'گروگان', captive: 'اسارت' };
  // [نام، گونه]: n عادی | s نشانه‌ای که باید سنجیده شود | d مرگ در بند
  const J_OUT = {
    released: ['آزاد شد', 'n'], pardon: ['عفو', 's'], repent: ['آزادی با توبه‌نامه', 's'], amnesty: ['آزادی همگانی یا با سقوط زندان‌بان', 'n'],
    escape: ['فرار', 's'], exchange: ['تحویل یا مبادله', 's'], deal: ['آزادی برای خدمت به آزادکننده', 's'], power: ['از بند یک‌راست به قدرت', 's'],
    transfer: ['سپرده به زندان‌بان بعدی', 'n'], executed: ['اعدام', 'd'], killed: ['کشته در بند', 'd'], died: ['مرگ در بند', 'd'],
    ongoing: ['هنوز در بند', 'n'], unknown: ['پایان نامعلوم', 'n'],
  };
  const J_RANGES = [['modern', 'سده اخیر', 1299, null], ['qajar', 'قاجار و مشروطه', 1168, 1304], ['early', 'آق‌قویونلو تا زند', 840, 1180], ['all', 'همه', 840, null]];
  const J_SIG = { out: 'آزادی خاص', confess: 'اعتراف علنی', foreign: 'بند بیگانه', sec: 'از بند به امنیت یا قضا', silenced: 'مرگ در بند' };
  const J_OF = Object.create(null);
  JAILS.forEach((j) => {
    j.with ||= []; j.src ||= [];
    j._dated = Number.isFinite(j.from);
    j._end = j.to ?? (j.out === 'ongoing' ? NOW : j.from);
    j._openEnd = j.to == null && j.out !== 'ongoing';
    j._foreign = !G[j.by] && !!PW[j.by];
    (J_OF[j.who] ||= []).push(j);
    chk(P[j.who], `فرد ناشناخته «${j.who}» در زندان‌ها`);
    chk(G[j.by] || PW[j.by], `زندان‌بان ناشناخته «${j.by}» برای ${j.who}`);
    if (j.at) chk(PRISON[j.at], `جای حبس ناشناخته «${j.at}» برای ${j.who}`);
    chkSrc(j.src, `زندان ${j.who}`);
    cite(j.src, `person:${j.who}`);
  });
  const jByYear = (a, b) => (a.from ?? 9999) - (b.from ?? 9999) || (a._end ?? 0) - (b._end ?? 0);
  JAILS.sort(jByYear);
  Object.values(J_OF).forEach((l) => l.sort(jByYear));
  const jPlace = (j) => (j.at ? PRISON[j.at]?.name || j.at : j.place || 'جای نامعلوم');
  const jJailer = (j) => G[j.by]?.name || PW[j.by]?.name || j.by;
  const jColor = (j) => (j._foreign ? PW[j.by]?.color : E[G[j.by]?.era]?.color) || '#888';
  const jYears = (j) => (!j._dated ? (j.when || 'بی‌تاریخ') : `${fa(j.from)}${j.out === 'ongoing' ? '–اکنون' : j.to == null ? '–؟' : j.to !== j.from ? '–' + fa(j.to) : ''}`);
  const jOut = (j) => J_OUT[j.out] || [j.out, 'n'];
  const jailerChip = (j) => (j._foreign ? powerChip(j.by) : `<button class="gchip jchip" data-group="${esc(j.by)}" style="--c:${jColor(j)}">${esc(jJailer(j))}</button>`);
  const overlaps = (a, b) => a._dated && b._dated && a.from <= b._end && b.from <= a._end;
  S.people.forEach((p) => { if (J_OF[p.id]) p._text += norm(J_OF[p.id].map((j) => `زندان ${J_KIND[j.kind]} ${jPlace(j)} ${jJailer(j)}`).join(' ')); });

  // هم‌بندان یک حبس: هم‌بند مستند، یا همان جای ثبت‌شده در سال‌های هم‌پوشان
  function jMates(j) {
    const s = new Set(j.with);
    JAILS.forEach((k) => {
      if (k.who === j.who) return;
      if (j.at && k.at === j.at && overlaps(j, k)) s.add(k.who);
      if (k.with.includes(j.who) && (k._dated && j._dated ? overlaps(j, k) : !!j.at && j.at === k.at)) s.add(k.who);
    });
    s.delete(j.who);
    return [...s].filter((id) => P[id]);
  }
  // خوشه‌های زمانی: حبس‌هایی که زنجیروار هم‌پوشانی دارند؛ فقط خوشه‌های دست‌کم دو نفره
  function jClusters(list) {
    const out = [];
    let cur = null;
    list.filter((j) => j._dated).sort(jByYear).forEach((j) => {
      if (cur && j.from <= cur.to) { cur.items.push(j); cur.to = Math.max(cur.to, j._end); }
      else { cur = { from: j.from, to: j._end, items: [j] }; out.push(cur); }
    });
    return out.map((c) => ({ ...c, people: [...new Set(c.items.map((j) => j.who))] })).filter((c) => c.people.length > 1);
  }
  const eraIdx = (id) => ERAS.findIndex((e) => e.id === id);
  const laterRole = (pid, after) => (P[pid]?.roles || []).filter((r) => Number.isFinite(r.from) && r.from > after && !/(گروگان|تبعید)/.test(r.t)).sort((a, b) => a.from - b.from)[0];
  const SEC_RE = /(ساواک|اطلاعات|امنیت|سپاه|دادستان|قضاییه|دادگاه|حاکم شرع|شهربانی|نظمیه|انتظامی|بسیج)/;

  function jSignals() {
    const rows = [];
    JAILS.forEach((j) => {
      const [oname, otype] = jOut(j);
      if (otype === 's') rows.push({ j, k: 'out', t: oname });
      if (j.confess) rows.push({ j, k: 'confess', t: 'اعتراف یا توبه علنی در بند' });
      if (j._foreign) rows.push({ j, k: 'foreign', t: `در بند ${PW[j.by]?.name || j.by}` });
      // مرگ در بند از دوره مشروطه به بعد، که دادگاه و قانون جزا معیار داوری است
      if ((j.out === 'killed' || j.out === 'died') && j._dated && j.from >= 1285) rows.push({ j, k: 'silenced', t: `${oname}، پیش از آزادی یا بی‌دادرسی مستقل` });
    });
    Object.entries(J_OF).forEach(([pid, l]) => {
      const first = l.find((j) => j._dated);
      const r = first && (P[pid]?.roles || []).filter((x) => Number.isFinite(x.from) && x.from > first.from && SEC_RE.test(x.t)).sort((a, b) => a.from - b.from)[0];
      if (r) rows.push({ j: first, k: 'sec', t: `بعدها: ${r.t} (${fa(r.from)})` });
    });
    return rows.filter((r) => tierOK(r.j.tier)).sort((a, b) => jByYear(b.j, a.j));
  }

  function jMark(A, j, cy) {
    const c = jColor(j), [oname, otype] = jOut(j);
    const xr = A.x(Math.max(j.from, A.from)), xl = A.x(Math.min(j._end + 1, A.to));
    const w = Math.max(10, xr - xl), x = xr - w;
    const soft = j.kind === 'exile' || j.kind === 'house';
    const op = { 1: 1, 2: 0.92, 3: 0.6, 4: 0.4 }[j.tier ?? 2];
    const dash = j._openEnd || (j.tier ?? 2) > 2 ? ' stroke-dasharray="4 3"' : '';
    let end = '';
    if (otype === 'd') end = `<path d="M${x - 5} ${cy - 5}L${x + 5} ${cy + 5}M${x + 5} ${cy - 5}L${x - 5} ${cy + 5}" class="jx"/>`;
    else if (otype === 's') end = `<rect x="${x - 4.5}" y="${cy - 4.5}" width="9" height="9" transform="rotate(45 ${x} ${cy})" class="jsig"/>`;
    else if (j.out === 'ongoing') end = `<path d="M${x - 8} ${cy}L${x} ${cy - 6}L${x} ${cy + 6}z" fill="${c}"/>`;
    const conf = j.confess ? `<circle cx="${x + w / 2}" cy="${cy - 12}" r="4" class="jconf"/>` : '';
    const mates = jMates(j).map((id) => P[id]?.name);
    const tip = tipAttr([P[j.who]?.name || j.who, `${jYears(j)} ش · ${J_KIND[j.kind] || j.kind} · ${jPlace(j)}`, `زندان‌بان: ${jJailer(j)}${j._foreign ? ' (قدرت بیرونی)' : ''}`,
      `پایان: ${oname}${j.confess ? ' · اعتراف علنی' : ''}`, mates.length ? `هم‌بند: ${mates.join('، ')}` : '',
      j.note ? (j.note.length > 170 ? j.note.slice(0, 170) + '…' : j.note) : '', `اعتبار: ${TIERS[j.tier ?? 2]}`]);
    return `<g class="ivm jm" data-person="${j.who}" opacity="${op}" ${tip}><rect x="${x - 4}" y="${cy - 13}" width="${w + 8}" height="26" class="ivhit"/>`
      + `<rect x="${x}" y="${cy - 7}" width="${w}" height="14" rx="4" fill="${c}" fill-opacity="${soft ? 0.25 : 0.88}" stroke="${j._foreign ? 'var(--ink)' : c}" stroke-width="${j._foreign ? 2.4 : 1.5}"${dash}/>${end}${conf}</g>`;
  }
  function jailLanes(list, from, to) {
    const byP = new Map();
    list.forEach((j) => { if (!byP.has(j.who)) byP.set(j.who, []); byP.get(j.who).push(j); });
    const rows = [...byP.entries()];
    if (!rows.length) return '<p class="empty">در این بازه و با این فیلترها حبسی ثبت نشده است.</p>';
    const A = swimAxis(from, to, st.jZoom, 180);
    const RH = 32, TOP = 48, H = TOP + rows.length * RH + 8;
    let g = swimFrame(A, H, TOP);
    rows.forEach(([, js], i) => {
      const cy = TOP + i * RH + RH / 2;
      g += `<line x1="0" x2="${A.W}" y1="${TOP + (i + 1) * RH}" y2="${TOP + (i + 1) * RH}" class="ivrow"/>`;
      js.forEach((j) => { g += jMark(A, j, cy); });
    });
    return swimHTML(A, rows.map(([pid]) => ({ label: personBtn(pid) })), H, g, TOP, RH, 'j-zoom');
  }
  function jLegend(list) {
    const sw = (inner) => `<svg viewBox="-15 -15 30 30" width="24" height="24">${inner}</svg>`;
    const eras = ERAS.filter((e) => list.some((j) => !j._foreign && G[j.by]?.era === e.id));
    const fps = [...new Set(list.filter((j) => j._foreign).map((j) => j.by))];
    return `<div class="ivlegend"><span class="muted">رنگ = زندان‌بان:</span>${eras.map((e) => `<span><i class="dot" style="background:${e.color}"></i>${esc(e.short || e.name)}</span>`).join('')}
      ${fps.map((w) => `<span><i class="dot" style="background:${PW[w]?.color};box-shadow:0 0 0 2px var(--ink)"></i>${esc(PW[w]?.name)}</span>`).join('')}</div>
      <div class="ivlegend">
      <span>${sw('<rect x="-13" y="-6" width="26" height="12" rx="4" fill="var(--muted)" fill-opacity=".88"/>')}زندان، قلعه، اسارت</span>
      <span>${sw('<rect x="-13" y="-6" width="26" height="12" rx="4" fill="var(--muted)" fill-opacity=".25" stroke="var(--muted)" stroke-width="1.5"/>')}تبعید یا حصر</span>
      <span>${sw('<rect x="-13" y="-6" width="26" height="12" rx="4" fill="var(--muted)" fill-opacity=".88" stroke="var(--ink)" stroke-width="2.4"/>')}در بند قدرت بیرونی</span>
      <span>${sw('<rect x="-13" y="-6" width="26" height="12" rx="4" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 3"/>')}پایان نامعلوم یا ادعا</span>
      <span>${sw('<path d="M-6 -6L6 6M6 -6L-6 6" class="jx"/>')}اعدام یا مرگ در بند</span>
      <span>${sw('<rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" class="jsig"/>')}آزادی خاص: عفو، توبه، فرار، معامله، از بند به قدرت</span>
      <span>${sw('<circle r="5" class="jconf"/>')}اعتراف علنی</span></div>`;
  }
  function jRangeYears() {
    const r = J_RANGES.find(([k]) => k === st.jRange) || J_RANGES[0];
    const ys = JAILS.filter((j) => j._dated);
    const from = r[2] ?? Math.min(...ys.map((j) => j.from)), to = r[3] ?? NOW;
    return [Math.floor(from / 5) * 5 - 5, Math.min(NOW, to + 3)];
  }
  function jailerTable(list) {
    const by = new Map();
    list.forEach((j) => { if (!by.has(j.by)) by.set(j.by, []); by.get(j.by).push(j); });
    const rows = [...by.entries()].map(([id, js]) => {
      const people = [...new Set(js.map((j) => j.who))];
      const era = E[G[id]?.era];
      // «بعدها»: فرد در دوره‌ای پس از دوره زندان‌بان ثبت شده و نقشی از پایان آن دوره به بعد دارد
      const after = era?.end != null ? era.end - 1 : null;
      const later = after != null ? people.filter((pid) => eraIdx(P[pid]?.era) > eraIdx(era.id) && laterRole(pid, after)) : [];
      const cnt = { n: 0, s: 0, d: 0 };
      js.forEach((j) => { cnt[jOut(j)[1]]++; });
      const tot = js.length;
      const fromY = Math.min(...js.filter((j) => j._dated).map((j) => j.from)), toY = Math.max(...js.filter((j) => j._dated).map((j) => j._end));
      return { id, js, people, later, cnt, tot, fromY, toY, after };
    }).sort((a, b) => a.fromY - b.fromY);
    return `<div class="table-wrap"><table class="stable ivledger jtable"><thead><tr><th>زندان‌بان</th><th>سال‌ها</th><th>حبس / نفر</th><th>چگونه بیرون آمدند</th><th>نقش بعدی، پس از دوره زندان‌بان</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${jailerChip(r.js[0])}</td><td class="yr">${Number.isFinite(r.fromY) ? `${fa(r.fromY)}–${fa(r.toY)}` : '—'}</td><td>${fa(r.tot)} / ${fa(r.people.length)}</td>
        <td><span class="jmix"><i class="jo-n" style="flex:${r.cnt.n}" title="آزادی عادی یا نامعلوم: ${fa(r.cnt.n)}"></i><i class="jo-s" style="flex:${r.cnt.s}" title="آزادی خاص: ${fa(r.cnt.s)}"></i><i class="jo-d" style="flex:${r.cnt.d}" title="اعدام یا مرگ در بند: ${fa(r.cnt.d)}"></i></span>
          <span class="sm muted">${fa(r.cnt.d)} مرگ · ${fa(r.cnt.s)} آزادی خاص</span></td>
        <td>${r.later.length ? `<div class="mpeople">${r.later.map((pid) => { const lr = laterRole(pid, r.after); return `<span class="jlater">${personBtn(pid)}<span class="sm muted">${esc(lr.t)} ${fa(lr.from)}</span></span>`; }).join('')}</div>` : '<span class="muted sm">—</span>'}</td></tr>`).join('')}
      </tbody></table></div>`;
  }
  function jClusterCards(groups, head) {
    const cards = [];
    groups.forEach(([key, js]) => {
      jClusters(js).forEach((c) => {
        cards.push(`<div class="jclus" style="--c:${jColor(c.items[0])}"><h5>${head(key, c)}<span class="yr">${fa(c.from)}${c.to !== c.from ? '–' + fa(c.to) : ''}</span></h5>
          <div class="mpeople">${c.people.map((pid) => { const js2 = c.items.filter((j) => j.who === pid); const lr = laterRole(pid, Math.max(...js2.map((j) => j._end)));
            return `<span class="jlater">${personBtn(pid)}<span class="sm muted">${js2.map(jYears).join('، ')}${lr ? ` · بعدها: ${esc(lr.t)} ${fa(lr.from)}` : ''}</span></span>`; }).join('')}</div></div>`);
      });
    });
    return cards.length ? `<div class="jclusters">${cards.join('')}</div>` : '<p class="empty">—</p>';
  }
  function renderPrisons() {
    const [from, to] = jRangeYears();
    const vis = JAILS.filter((j) => tierOK(j.tier) && (!st.qn || P[j.who]?._text.includes(st.qn)) && (!st.powers.size || !j._foreign || st.powers.has(j.by)));
    const inRange = vis.filter((j) => j._dated && j._end >= from && j.from <= to);
    const people = new Set(vis.map((j) => j.who));
    const savak = [...new Set(vis.filter((j) => j.by === 'savak').map((j) => j.who))];
    const savakLater = savak.filter((pid) => eraIdx(P[pid]?.era) > eraIdx('pahlavi2') && laterRole(pid, 1356));
    const foreign = vis.filter((j) => j._foreign);
    const sigAll = jSignals().filter((r) => vis.includes(r.j));
    const sig = sigAll.filter((r) => !st.jSig || r.k === st.jSig);
    const sigChips = `<div class="types"><button class="tchip${!st.jSig ? ' on' : ''}" data-act="j-sig" data-k="">همه (${fa(sigAll.length)})</button>${Object.entries(J_SIG).map(([k, n]) => `<button class="tchip${st.jSig === k ? ' on' : ''}" data-act="j-sig" data-k="${k}"><span class="jtag jt-${k}">${n}</span> ${fa(sigAll.filter((r) => r.k === k).length)}</button>`).join('')}</div>`;
    const byAt = new Map(), byJailer = new Map();
    vis.forEach((j) => {
      if (j.at) { if (!byAt.has(j.at)) byAt.set(j.at, []); byAt.get(j.at).push(j); }
      if (!byJailer.has(j.by)) byJailer.set(j.by, []); byJailer.get(j.by).push(j);
    });
    const explicit = vis.filter((j) => j.with.length).map((j) => `<span class="jlater">${personBtn(j.who)}<span class="sm muted">با ${j.with.map((id) => esc(P[id]?.name || id)).join('، ')} · ${jYears(j)} · ${esc(jPlace(j))}</span></span>`);
    $('#stage').innerHTML = `
      <div class="toolbar"><h2>${ic('bars')} زندان، تبعید و حصر</h2>
        ${J_RANGES.map(([k, label]) => `<button class="tbtn${st.jRange === k ? ' on' : ''}" data-act="j-range" data-range="${k}">${label}</button>`).join('')}
        <span class="hint">${fa(vis.length)} حبس · ${fa(people.size)} نفر · ${fa(PRISON ? Object.keys(PRISON).length : 0)} زندان ثبت‌شده</span></div>
      ${helpBox('هر نوار یک دوره در بند است: زندان، قلعه، حصر خانگی، تبعید، بازداشت به دست قدرت بیگانه، گروگان یا اسیر؛ با سال‌ها، جا، زندان‌بان، چگونگی پایان، سطح اعتبار و منبع. زندان جای آشنایی، بازجویی، توبه‌نامه و جذب است؛ برای همین هم‌بندها، آزادی‌های خاص (عفو، توبه، فرار، معامله، از بند به قدرت)، اعتراف‌های علنی، بند بیگانه و مرگ پیش از دادگاه جدا نشان داده می‌شوند. این‌ها «نشانه» برای پژوهش بیشترند، نه حکم جاسوسی؛ هر ادعای جاسوسی باید معمایی با شاهد موافق و مخالف باشد. هم‌بندی فقط وقتی محاسبه می‌شود که جای حبس ثبت شده و سال‌ها هم‌پوشان باشند؛ «هم‌دوره در بند یک زندان‌بان» ضعیف‌تر است و فقط هم‌زمانی را نشان می‌دهد. نبودن نام کسی یعنی حبسی برای او ثبت نشده، نه اینکه هرگز در بند نبوده.')}
      <section class="ivsec"><h3>${ic('chart')} چکیده</h3>
        <div class="kpis">
          <div class="kpi">${ic('bars')}<b>${fa(vis.length)}</b><span>دوره در بند</span></div>
          <div class="kpi">${ic('users')}<b>${fa(people.size)}</b><span>نفر</span></div>
          <div class="kpi">${ic('globe')}<b>${fa(foreign.length)}</b><span>در بند قدرت بیرونی</span></div>
          <div class="kpi">${ic('skull')}<b>${fa(vis.filter((j) => jOut(j)[1] === 'd').length)}</b><span>اعدام یا مرگ در بند</span></div>
        </div>
        ${savak.length ? `<p class="ivverdict">${fa(savak.length)} نفر در بند ساواک ثبت شده‌اند؛ <b>${fa(savakLater.length)} نفرشان</b> پس از ۱۳۵۷ در جمهوری اسلامی مقام گرفتند: ${savakLater.map(personBtn).join(' ')}. زندان شاه مدرسه و شبکه‌ساز حاکمان بعدی بود.</p>` : ''}
      </section>
      <section class="ivsec"><h3>${ic('gantt')} خط زمان: هر ردیف یک نفر</h3>${jLegend(inRange)}${jailLanes(inRange, from, to)}</section>
      <section class="ivsec"><h3>${ic('users')} هم‌بندها: یک زندان، یک زمان</h3>
        <p class="muted sm">جای حبس ثبت‌شده و سال‌های هم‌پوشان. سال‌ها در حد سال‌اند؛ هم‌پوشانی سال یعنی ممکن است هم‌زمان بوده باشند، نه قطعاً در یک بند.</p>
        ${jClusterCards([...byAt.entries()], (at) => `${ic('bars')} ${esc(PRISON[at]?.name || at)}${PRISON[at]?.city ? ` <span class="sm muted">${esc(PRISON[at].city)}</span>` : ''}`)}
        ${explicit.length ? `<h4 class="bhh">هم‌بندی مستند در منابع</h4><div class="mpeople">${explicit.join('')}</div>` : ''}</section>
      <section class="ivsec"><h3>${ic('hourglass')} هم‌دوره در بند یک زندان‌بان</h3>
        <p class="muted sm">کسانی که هم‌زمان در بند یک دستگاه بودند، هرجا که بودند؛ و اینکه بعدها به کجا رسیدند.</p>
        ${jClusterCards([...byJailer.entries()], (by, c) => `${jailerChip(c.items[0])}`)}</section>
      <section class="ivsec"><h3>${ic('warn')} نشانه‌ها برای سنجش</h3>
        <p class="muted sm">هر ردیف پرسشی است که باید با سند پاسخ داده شود: چرا او آزاد شد و دیگران نه؟ اعترافش چه بود و زیر چه فشاری؟ در بند بیگانه با چه کسی آشنا شد؟ چه کسی پیش از دادگاه خاموش شد؟ جدیدترها بالاتر.</p>${sigChips}
        <div class="table-wrap"><table class="stable ivledger"><thead><tr><th>نشانه</th><th>سال</th><th>نام</th><th>بند</th><th>چرا</th><th>اعتبار</th></tr></thead><tbody>
        ${sig.map((r) => `<tr><td><span class="jtag jt-${r.k}">${J_SIG[r.k]}</span></td><td class="yr">${jYears(r.j)}</td><td>${personBtn(r.j.who)}</td><td class="sm">${esc(J_KIND[r.j.kind])} · ${esc(jPlace(r.j))} · ${jailerChip(r.j)}</td><td class="sm">${esc(r.t)}${r.j.mystery && MY[r.j.mystery] ? ` <button class="lnk sm" data-mystery="${r.j.mystery}">${ic('question')} معما</button>` : ''}</td><td>${tierBadge(r.j.tier)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">—</td></tr>'}
        </tbody></table></div></section>
      <section class="ivsec"><h3>${ic('hand')} زندان‌بان‌ها: چه کسی را گرفتند و آن‌ها بعدها به کجا رسیدند</h3>
        <p class="muted sm">«نقش بعدی» فقط برای کسانی آمده که در دوره‌ای پس از دوره زندان‌بان ثبت شده‌اند؛ نخستین نقش آن‌ها از پایان آن دوره به بعد.</p>${jailerTable(vis)}</section>
      <section class="ivsec"><h3>${ic('books')} دفتر کامل</h3>
        <div class="table-wrap"><table class="stable ivledger"><thead><tr><th>سال</th><th>نام</th><th>گونه</th><th>جا</th><th>زندان‌بان</th><th>پایان</th><th>هم‌بند</th><th>اعتبار و منبع</th></tr></thead><tbody>
        ${vis.map((j) => { const [on, ot] = jOut(j); const m = jMates(j); return `<tr><td class="yr">${jYears(j)}</td><td>${personBtn(j.who)}</td><td class="sm">${esc(J_KIND[j.kind] || j.kind)}</td><td class="sm">${esc(jPlace(j))}</td><td>${jailerChip(j)}</td>
          <td><span class="jout jo-${ot}">${esc(on)}</span>${j.confess ? '<span class="jout jo-s">اعتراف علنی</span>' : ''}</td><td>${m.map((id) => `<button class="lnk sm" data-person="${id}">${esc(P[id]?.name)}</button>`).join('، ')}</td><td>${tierBadge(j.tier)}${srcList(j.src)}</td></tr>`; }).join('')}
        </tbody></table></div></section>`;
  }
  function jailItem(j) {
    const [oname, otype] = jOut(j);
    const m = jMates(j);
    return `<li class="jitem${tierOK(j.tier) ? '' : ' faded'}" style="--c:${jColor(j)}">
      <div class="jhead"><span class="yr">${jYears(j)}</span><b>${esc(J_KIND[j.kind] || j.kind)}</b><span class="sm">${esc(jPlace(j))}</span>${jailerChip(j)}</div>
      <div><span class="jout jo-${otype}">${esc(oname)}</span>${j.confess ? '<span class="jout jo-s">اعتراف علنی</span>' : ''}</div>
      ${j.note ? `<p class="sm">${esc(j.note)}</p>` : ''}
      ${m.length ? `<div class="mpeople"><span class="sm muted">هم‌بند:</span>${m.map(personBtn).join('')}</div>` : ''}
      <div class="mmeta">${tierBadge(j.tier)}${srcList(j.src)}${j.mystery && MY[j.mystery] ? `<button class="lnk sm" data-mystery="${j.mystery}">${ic('question')} معما <span class="ms ms-${MY[j.mystery].status}">${MSTATUS[MY[j.mystery].status]}</span></button>` : ''}</div></li>`;
  }

  /* ——— ستون جزئیات با تاریخچه بازگشت ——— */
  function renderDetailNav() {
    const b = hist.back[hist.back.length - 1], f = hist.fwd[hist.fwd.length - 1];
    $('#detail-nav').innerHTML = `<button class="ibtn" data-act="back"${b !== undefined ? '' : ' disabled'} title="${b !== undefined ? 'بازگشت به: ' + esc(selName(b.sel)) : 'بازگشت'}">${ic('arrowRight')}</button>`
      + `<button class="ibtn" data-act="fwd"${f !== undefined ? '' : ' disabled'} title="${f !== undefined ? 'جلو: ' + esc(selName(f.sel)) : 'جلو'}">${ic('arrowLeft')}</button>`
      + (b !== undefined ? `<button class="backlbl" data-act="back" title="بازگشت">${esc(selName(b.sel))}</button>` : '');
  }
  function renderDetail() {
    const d = $('#detail');
    const sel = st.sel;
    if (!sel) d.innerHTML = globalDetail();
    else if (sel.kind === 'person' && P[sel.id]) d.innerHTML = personDetail(P[sel.id]);
    else if (sel.kind === 'era' && E[sel.id]) d.innerHTML = eraDetail(E[sel.id]);
    else if (sel.kind === 'group' && G[sel.id]) d.innerHTML = groupDetail(G[sel.id]);
    else if (sel.kind === 'mystery' && MY[sel.id]) d.innerHTML = `<div class="d-head"><span class="kind">${ic('question')} معما</span><button class="ibtn" data-act="unselect" title="بستن">${ic('xmark')}</button></div>${mysteryCard(MY[sel.id], true)}`;
    else if (sel.kind === 'source' && SRC[sel.id]) d.innerHTML = sourceDetail(SRC[sel.id]);
    else if (sel.kind === 'intervention' && IV[sel.id]) d.innerHTML = interventionDetail(IV[sel.id]);
    else if (sel.kind === 'thread' && TH[sel.id]) d.innerHTML = threadDetail(TH[sel.id]);
    else d.innerHTML = globalDetail();
    renderDetailNav();
  }
  const closeBtn = () => `<button class="ibtn" data-act="unselect" title="بستن">${ic('xmark')}</button>`;
  function globalDetail() {
    const s = summarize(S.people);
    return `<div class="d-head"><span class="kind">${ic('chart')} چکیده کل</span></div>
      <h2 class="d-title">شجره‌نامه قدرت در ایران</h2>
      <p class="muted">${fa(S.people.length)} نفر، ${fa(S.links.length)} پیوند، ${fa(S.mysteries.length)} معما، ${fa(S.sources.length)} منبع در ${fa(S.eras.length)} دوره. همه سال‌ها خورشیدی (هجری شمسی) است؛ تبدیل از میلادی در سطح سال انجام شده و ممکن است یک سال جابه‌جا باشد.</p>
      ${summaryHTML(s)}
      <h4>سطوح اعتبار</h4>
      <ul class="plain"><li>${tierBadge(1)} سند دست اول، آرشیو رسمی، فهرست تحریم، حکم دادگاه</li><li>${tierBadge(2)} پژوهش دانشگاهی یا چند منبع مستقل</li><li>${tierBadge(3)} یک منبع یا منبع جانب‌دار</li><li>${tierBadge(4)} شایعه؛ نگه داشته می‌شود تا با منابع سنجیده شود</li></ul>
      <h4>دوره‌ها</h4>
      <div class="d-list">${ERAS.map((e) => `<button class="row" data-era="${e.id}"><span class="dot" style="background:${e.color}"></span>${esc(e.name)}<span class="st st-${e.status}">${ESTATUS[e.status] || ''}</span></button>`).join('')}</div>`;
  }
  function personDetail(p) {
    const era = eraOf(p);
    const rel = [...(OUT[p.id] || []).map((l) => ({ l, other: l.to, label: LINKS[l.type]?.out })), ...(IN[p.id] || []).map((l) => ({ l, other: l.from, label: LINKS[l.type]?.in }))]
      .filter((x) => tierOK(x.l.tier));
    const byType = {};
    rel.forEach((x) => { (byType[x.l.type] ||= []).push(x); });
    const myst = S.mysteries.filter((m) => m.people.includes(p.id));
    const por = PORTRAITS[p.id];
    return `<div class="d-head"><span class="kind">${ic('users')} فرد</span>${closeBtn()}</div>
      <div class="d-hero">
        <div class="portrait${por ? ' zoomable' : ''}" style="--c:${pColor(p)}"${por ? ` data-zoom="${p.id}" title="نمایش تصویر بزرگ"` : ''}>${por ? `<img src="assets/portraits/${p.id}.jpg" alt="${esc(p.name)}">` : `<b>${esc(initial(p))}</b>`}</div>
        <div class="d-hero-text">
          <h2 class="d-title">${esc(p.name)}${crown(p)}</h2>
          ${KING[p.id] ? `<p class="kingline${KING[p.id].claim ? ' claim' : ''}">${crownSvg()}${esc(kingTitle(KING[p.id]))}${p._rule ? ` — ${ruleText(p)} ش` : ''}</p>` : p._rule ? `<p class="kingline">${esc(p._rule.t)} — ${ruleText(p)} ش</p>` : ''}
          ${p.alt.length ? `<p class="alt">${p.alt.map(esc).join('، ')}</p>` : ''}
          <div class="meta"><span>${life(p)} ش</span>${era ? `<button class="era-chip" data-era="${era.id}" style="--c:${era.color}">${esc(era.short || era.name)}</button>` : ''}</div>
        </div>
      </div>
      ${por ? `<p class="credit">تصویر: ${esc(por.file || 'ویکی‌مدیا کامانز')} — ${esc(por.license || 'ویکی‌مدیا کامانز')}</p>` : ''}
      <div class="meta">${p.groups.map((g) => (G[g] ? `<button class="gchip" data-group="${g}">${esc(G[g].name)}</button>` : '')).join('')}</div>
      <div class="relbox">${ic('worship')}${p.rel.map((r, i) => `${i ? '<span class="rarrow">←</span>' : ''}<button class="rchip big" data-rel="${r}" style="--c:${RL[r]?.color || '#999'}">${esc(relName(r))}</button>`).join('')}${p.faith ? `<p class="sm muted">${esc(p.faith)}</p>` : ''}</div>
      <p class="death ${VIOLENT.has(p.death) ? 'violent' : ''}">${VIOLENT.has(p.death) ? ic('skull') : ''}<b>${DEATH[p.death] || 'نامعلوم'}</b>${p.deathNote ? ` — ${esc(p.deathNote)}` : ''}</p>
      ${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ''}
      ${p.origin ? `<dl class="facts"><dt>تبار و خاستگاه</dt><dd>${esc(p.origin)}</dd></dl>` : ''}
      ${p.masks.length ? `<h4>${ic('masks')} تغییر نقاب</h4><ol class="masks">${p.masks.map((m) => `<li class="${tierOK(m.tier) ? '' : 'faded'}"><div class="mfrom">${esc(m.from)}</div><div class="marrow">${m.year ? fa(m.year) + ' ' : ''}⟵</div><div class="mto">${esc(m.to)}</div>${m.note ? `<p class="muted sm">${esc(m.note)}</p>` : ''}<div class="mmeta">${tierBadge(m.tier)}${srcList(m.src)}</div></li>`).join('')}</ol>` : ''}
      ${p.roles.length ? `<h4>${ic('badge')} نقش‌ها</h4><ul class="plain roles">${p.roles.map((r) => `<li>${esc(r.t)}${r.from || r.to ? ` <span class="yr">${r.from ? fa(r.from) : '؟'}–${r.to ? fa(r.to) : '؟'}</span>` : ''}</li>`).join('')}</ul>` : ''}
      ${p.ties.length ? `<h4>${ic('globe')} ریشه‌ها و پیوندهای بیرونی</h4><ul class="plain ties">${p.ties.map((t) => `<li class="${tierOK(t.tier) ? '' : 'faded'}">${powerChip(t.power)}<span class="tkind${t.kind === 'enemy' ? ' enemy' : ''}">${TIE_KINDS[t.kind] || t.kind}</span>${tierBadge(t.tier)}${t.note ? `<div class="sm">${esc(t.note)}</div>` : ''}${srcList(t.src)}</li>`).join('')}</ul>` : ''}
      ${(J_OF[p.id] || []).length ? `<h4>${ic('bars')} زندان، تبعید و حصر</h4><ol class="jlist">${J_OF[p.id].map(jailItem).join('')}</ol>` : ''}
      ${(TH_OF[p.id] || []).length ? `<h4>${ic('diagram')} در رشته‌های بلند</h4><div class="d-list">${TH_OF[p.id].map((th) => { const k = th.steps.findIndex((s) => s.p.includes(p.id)); return `<button class="row" data-thread="${th.id}" data-step="${k}"><i class="dot sm" style="background:${thColor(th)}"></i><span>${esc(th.name)}</span><span class="sm muted">${fa(th.steps[k].y)}</span></button>`; }).join('')}</div>` : ''}
      ${(IV_OF[p.id] || []).length ? `<h4>${ic('hand')} دخالت‌های خارجی مرتبط</h4><div class="d-list">${IV_OF[p.id].map((v) => `<button class="row${tierOK(v.tier) ? '' : ' faded'}" data-interv="${v.id}">${v.powers.map((w) => `<i class="dot sm" style="background:${PW[w]?.color}"></i>`).join('')}<span>${fa(v.year)} · ${esc(v.title)}</span><span class="sm ${v.placed.includes(p.id) ? 'ivtag-put' : v.removed.includes(p.id) ? 'ivtag-out' : 'muted'}">${v.placed.includes(p.id) ? 'به قدرت رسید' : v.removed.includes(p.id) ? 'برکنار شد' : 'درگیر'}</span>${tierBadge(v.tier)}</button>`).join('')}</div>` : ''}
      ${rel.length ? `<h4>${ic('link')} پیوندها با دیگران</h4>${Object.keys(LINKS).filter((k) => byType[k]).map((k) => `<div class="relgroup"><div class="reltype lk-${k}"><i></i>${LINKS[k].name}</div><ul class="plain">${byType[k].map((x) => `<li><span class="rl">${esc(x.label)}:</span> ${personBtn(x.other)} ${P[x.other] ? relChip(P[x.other]) : ''} ${tierBadge(x.l.tier)}${x.l.note ? `<span class="sm muted"> — ${esc(x.l.note)}</span>` : ''}${srcList(x.l.src)}</li>`).join('')}</ul></div>`).join('')}` : ''}
      ${myst.length ? `<h4>${ic('question')} معماهای مرتبط</h4><div class="d-list">${myst.map((m) => `<button class="row" data-mystery="${m.id}">${esc(m.title)}<span class="ms ms-${m.status}">${MSTATUS[m.status]}</span></button>`).join('')}</div>` : ''}
      ${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div>` : ''}
      ${p.src.length ? `<h4>${ic('books')} منابع</h4>${srcList(p.src)}` : ''}
      <div class="d-actions">${tbtn('trail', 'route', 'ردپا')}${tbtn('locate', 'gantt', 'در گانت')}${tbtn('h-from-sel', 'sitemap', 'در سلسله‌مراتب')}</div>`;
  }
  function eraDetail(e) {
    const people = S.people.filter((p) => p.era === e.id);
    const groups = S.groups.filter((g) => g.era === e.id);
    const myst = S.mysteries.filter((m) => m.era === e.id);
    return `<div class="d-head"><span class="kind">${ic('hourglass')} دوره</span>${closeBtn()}</div>
      <h2 class="d-title"><span class="dot lg" style="background:${e.color}"></span>${esc(e.name)}</h2>
      <div class="meta"><span>${fa(e.start)}–${e.end ? fa(e.end) : 'امروز'} ش</span><span class="st st-${e.status}">${ESTATUS[e.status] || ''}</span></div>
      <p class="summary">${esc(e.summary)}</p>
      ${people.length ? summaryHTML(summarize(people)) : '<p class="empty">هنوز کسی در این دوره ثبت نشده است.</p>'}
      ${groups.length ? `<h4>${ic('users')} گروه‌ها</h4><div class="d-list">${groups.map((g) => `<button class="row" data-group="${g.id}">${g.power ? `<span class="dot sm" style="background:${PW[g.power]?.color}"></span>` : ''}${esc(g.name)}<span class="cnt">${fa(people.filter((p) => p.groups.includes(g.id)).length)}</span></button>`).join('')}</div>` : ''}
      ${e.agenda && e.agenda.length ? `<h4>${ic('question')} پرسش‌های پژوهشی باز</h4><ul class="plain agenda">${e.agenda.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
      ${myst.length ? `<h4>معماها</h4><div class="d-list">${myst.map((m) => `<button class="row" data-mystery="${m.id}">${esc(m.title)}<span class="ms ms-${m.status}">${MSTATUS[m.status]}</span></button>`).join('')}</div>` : ''}`;
  }
  function groupDetail(g) {
    const people = S.people.filter((p) => p.groups.includes(g.id)).sort((a, b) => (a._start ?? 0) - (b._start ?? 0));
    const era = E[g.era];
    return `<div class="d-head"><span class="kind">${ic('users')} ${GKIND[g.kind] || 'گروه'}</span>${closeBtn()}</div>
      <h2 class="d-title">${esc(g.name)}</h2>
      <div class="meta">${era ? `<button class="era-chip" data-era="${era.id}" style="--c:${era.color}">${esc(era.short || era.name)}</button>` : ''}${g.power ? powerChip(g.power) : ''}</div>
      <p class="summary">${esc(g.summary || '')}</p>
      ${people.length ? summaryHTML(summarize(people)) : ''}
      <h4>اعضا</h4><div class="d-list">${people.map((p) => `<button class="row" data-person="${p.id}">${avatar(p, 'xs')}${esc(p.name)}${crown(p)}${badges(p)}${relDot(p)}<span class="yr">${life(p)}</span></button>`).join('') || '<p class="empty">—</p>'}</div>`;
  }
  function sourceDetail(s) {
    const refs = [...(CITES[s.id] || [])].map((k) => k.split(':'));
    return `<div class="d-head"><span class="kind">${ic('books')} منبع</span>${closeBtn()}</div>
      <h2 class="d-title">${esc(s.title)}</h2>
      <dl class="facts"><dt>نویسنده</dt><dd>${esc(s.author)}</dd><dt>سال</dt><dd>${esc(s.year)}</dd><dt>نوع</dt><dd>${SKIND[s.kind] || esc(s.kind)}</dd><dt>زبان</dt><dd>${esc(s.lang || '—')}</dd>${s.where ? `<dt>دسترسی</dt><dd>${esc(s.where)}</dd>` : ''}</dl>
      <p class="summary"><b>سوگیری:</b> ${esc(s.bias || '—')}</p>
      <p>${s.checked ? '<span class="ok-tag">با متن تطبیق داده شده</span>' : '<span class="no-tag">هنوز با متن تطبیق داده نشده</span>'}</p>
      <h4>ارجاع‌ها (${fa(refs.length)})</h4>
      <div class="d-list">${refs.map(([k, id]) => (k === 'person' ? `<button class="row" data-person="${id}">${P[id] ? avatar(P[id], 'xs') : ''}${esc(P[id]?.name || id)}</button>`
        : k === 'intervention' ? `<button class="row" data-interv="${id}">دخالت خارجی: ${esc(IV[id]?.title || id)}</button>`
        : `<button class="row" data-mystery="${id}">معما: ${esc(MY[id]?.title || id)}</button>`)).join('')}</div>`;
  }

  /* ——— پانویس ——— */
  function renderFoot() {
    const vis = S.people.filter(matches).length;
    $('#foot').innerHTML = `<span>${ic('users')} نمایش ${fa(vis)} از ${fa(S.people.length)} نفر</span>
      <span>${ic('hourglass')} سال‌ها خورشیدی · امسال ${fa(NOW)}</span>
      <span>${ic('books')} ${fa(S.sources.filter((s) => s.checked).length)}/${fa(S.sources.length)} منبع تطبیق‌شده</span>
      ${issues.length ? `<details class="issues"><summary>${ic('warn')} ${fa(issues.length)} ارجاع ناقص در داده</summary><ul>${issues.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></details>` : `<span class="ok-tag">${ic('check')} ارجاع‌ها سالم است</span>`}`;
  }

  /* ——— ستون‌های کناری: جمع‌شدن و تغییر اندازه ——— */
  function applyPanels() {
    const L = $('#layout');
    L.style.setProperty('--navw', st.navC ? '44px' : st.navW + 'px');
    L.style.setProperty('--detw', st.detC ? '44px' : st.detW + 'px');
    $('#nav').classList.toggle('collapsed', st.navC);
    $('#detail-panel').classList.toggle('collapsed', st.detC);
  }

  /* ——— کشیدن: تغییر اندازه ستون‌ها و جابه‌جایی نمودار ——— */
  let drag = null, suppressClick = false;
  document.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    const sp = ev.target.closest('.splitter');
    if (sp) {
      const which = sp.dataset.split;
      if ((which === 'nav' && st.navC) || (which === 'detail' && st.detC)) return;
      ev.preventDefault();
      drag = { kind: 'split', which, x: ev.clientX, w: which === 'nav' ? st.navW : st.detW };
      document.body.classList.add('resizing');
      return;
    }
    const w = ev.target.closest('#chartwrap');
    if (w && !ev.target.closest('[data-hfold],[data-hdeep]')) {
      // جلوی انتخاب متن و کشیدن بومی تصویر/پیوند را می‌گیرد؛ کلیک همچنان رخ می‌دهد.
      if (!ev.target.closest('input, select, textarea')) ev.preventDefault();
      drag = { kind: 'pan', w, x: ev.clientX, y: ev.clientY, sl: w.scrollLeft, st: w.scrollTop, moved: false };
    }
  });
  document.addEventListener('dragstart', (ev) => { if (ev.target.closest && ev.target.closest('#chartwrap')) ev.preventDefault(); });
  document.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const dx = ev.clientX - drag.x;
    if (drag.kind === 'split') {
      // ستون راهبری در راست است: کشیدن به چپ پهن‌ترش می‌کند. ستون جزئیات در چپ است: کشیدن به راست.
      const w = Math.max(220, Math.min(760, drag.which === 'nav' ? drag.w - dx : drag.w + dx));
      if (drag.which === 'nav') st.navW = w; else st.detW = w;
      applyPanels();
      return;
    }
    const dy = ev.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) { drag.moved = true; drag.w.classList.add('panning'); }
    drag.w.scrollLeft = drag.sl - dx;
    drag.w.scrollTop = drag.st - dy;
  });
  document.addEventListener('pointerup', () => {
    if (!drag) return;
    if (drag.kind === 'split') { document.body.classList.remove('resizing'); store.set('navW', st.navW); store.set('detW', st.detW); }
    else if (drag.moved) { drag.w.classList.remove('panning'); suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); }
    drag = null;
  });
  document.addEventListener('click', (ev) => { if (suppressClick) { ev.preventDefault(); ev.stopPropagation(); suppressClick = false; } }, true);
  document.addEventListener('dblclick', (ev) => {
    const sp = ev.target.closest('.splitter');
    if (!sp) return;
    if (sp.dataset.split === 'nav') st.navW = 300; else st.detW = 380;
    store.set('navW', st.navW); store.set('detW', st.detW);
    applyPanels();
  });

  /* ——— چرخه نمایش ——— */
  function renderStage() {
    renderViews();
    const full = st.full && FULLABLE.has(st.view);
    $('#stage').classList.toggle('full', full);
    document.body.classList.toggle('has-full', full);
    ({ overview: renderOverview, hier: renderHier, tree: renderTree, trail: renderTrail, mysteries: renderMysteries, sources: renderSources, influence: renderInfluence, threads: renderThreads, prisons: renderPrisons })[st.view]();
    if (SWIM_VIEWS.has(st.view)) { swimApply(swimPending); swimPending = null; }
  }
  // پهنای خط زمان هنگام نمایش از پهنای صحنه گرفته می‌شود؛ با باز و بسته شدن ستون‌ها یا کشیدن جداکننده دوباره ساخته می‌شود
  let stageW = 0, stageT = null;
  if (window.ResizeObserver) new ResizeObserver(([e]) => {
    const w = Math.round(e.contentRect.width);
    if (Math.abs(w - stageW) < 16) return;
    const first = !stageW;
    stageW = w;
    if (first || !SWIM_VIEWS.has(st.view)) return;
    clearTimeout(stageT);
    stageT = setTimeout(() => {
      const stg = $('#stage'), top = stg.scrollTop;
      swimPending = swimState();
      renderStage();
      stg.style.scrollBehavior = 'auto'; stg.scrollTop = top; stg.style.scrollBehavior = '';
    }, 120);
  }).observe($('#stage'));
  function renderAll() { applyPanels(); renderPickers(); renderNav(); renderStage(); renderDetail(); renderFoot(); }
  function syncHash() {
    const h = new URLSearchParams();
    h.set('v', st.view);
    if (st.sel) h.set('s', `${st.sel.kind}:${st.sel.id}`);
    try { history.replaceState(null, '', '#' + h.toString()); } catch (e) { /* file:// در برخی مرورگرها */ }
  }
  function readHash() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (VIEWS.some(([v]) => v === h.get('v'))) st.view = h.get('v');
    const s = h.get('s');
    if (s) { const i = s.indexOf(':'); st.sel = { kind: s.slice(0, i), id: s.slice(i + 1) }; }
  }
  const sameSel = (a, b) => (!a && !b) || (a && b && a.kind === b.kind && a.id === b.id);
  function scrollChartTo(x, y) {
    const w = $('#chartwrap');
    if (!w) return;
    const left = x - w.clientWidth / 2, top = Math.max(0, y - w.clientHeight / 2);
    // پرش‌های بلند (بیش از دو صفحه) بی‌درنگ؛ جابه‌جایی کوتاه نرم
    const far = Math.abs(top - w.scrollTop) > w.clientHeight * 2 || Math.abs(left - w.scrollLeft) > w.clientWidth * 2;
    w.scrollTo({ left, top, behavior: far ? 'auto' : 'smooth' });
  }
  function centerOn(id) {
    if (st.view === 'overview') { const pl = lastLayout && lastLayout.placed[id]; if (pl) scrollChartTo(pl.r - 120, pl.y); }
    else if (st.view === 'hier') { const n = lastHier && lastHier.pos[id]; if (n) scrollChartTo(n.cx * st.hZoom, (n.y + HH / 2) * st.hZoom); }
    else if (st.view === 'tree') treeReveal(id);
  }
  function centerOnEra(id) {
    const w = $('#chartwrap');
    const box = lastLayout && lastLayout.eraBoxes.find((b) => b.e.id === id);
    if (w && box) w.scrollTo({ left: box.r - w.clientWidth + 40, behavior: 'smooth' });
  }
  /* opts.fromChart: کلیک از داخل نمودار؛ نمودار جابه‌جا نمی‌شود. opts.hist: حرکت در تاریخچه؛ چیزی به تاریخچه افزوده نمی‌شود. */
  function select(kind, id, opts = {}) {
    const next = kind ? { kind, id } : null;
    const d = $('#detail');
    if (!opts.hist && !sameSel(st.sel, next)) { hist.back.push({ sel: st.sel, scroll: d.scrollTop }); if (hist.back.length > 100) hist.back.shift(); hist.fwd = []; }
    st.sel = next;
    syncHash();
    renderNav(); renderDetail();
    d.scrollTop = opts.scroll || 0;
    if (st.view === 'tree') { treeMarkSel(); if (kind === 'person' && !opts.fromChart) treeReveal(id); }
    else if (['overview', 'hier', 'trail'].includes(st.view)) renderStage();
    if (kind === 'person' && (!opts.fromChart || st.view === 'hier')) centerOn(id);
    if (!opts.fromChart) {
      if (kind === 'era' && st.view === 'overview') centerOnEra(id);
    }
    if (st.detC && next && st.full) { st.detC = false; applyPanels(); }
  }
  function goHistory(dir) {
    const from = dir === 'back' ? hist.back : hist.fwd;
    const to = dir === 'back' ? hist.fwd : hist.back;
    if (!from.length) return;
    const entry = from.pop();
    to.push({ sel: st.sel, scroll: $('#detail').scrollTop });
    if (entry.sel) select(entry.sel.kind, entry.sel.id, { hist: true, scroll: entry.scroll });
    else select(null, null, { hist: true, scroll: entry.scroll });
  }
  /* حافظه هر نما: جای اسکرول و انتخابی که هنگام ترک نما برقرار بود. اگر انتخاب از آن پس عوض نشده، همان جا برمی‌گردد. */
  const viewMem = store.get('viewMem', {});
  const selKey = () => (st.sel ? `${st.sel.kind}:${st.sel.id}` : '');
  function viewScroller() { return $('#chartwrap') || $('#stage'); }
  function saveViewMem() {
    const s = viewScroller();
    if (!s) return;
    viewMem[st.view] = { x: s.scrollLeft, y: s.scrollTop, sel: selKey() };
    store.set('viewMem', viewMem);
  }
  function restoreViewMem() {
    const m = viewMem[st.view], s = viewScroller();
    if (m && s && m.sel === selKey()) { s.scrollLeft = m.x; s.scrollTop = m.y; return; }
    if (st.sel && st.sel.kind === 'person') centerOn(st.sel.id);
  }
  window.addEventListener('beforeunload', saveViewMem);
  function setView(v) { saveViewMem(); st.view = v; st.pk = null; syncHash(); renderStage(); restoreViewMem(); }
  function refilter() { renderPickers(); renderNav(); renderStage(); renderFoot(); }
  const saveSet = (k, set) => store.set(k, [...set]);
  function setAllTreeDetails(open) { document.querySelectorAll('#treelist details').forEach((d) => { d.open = open; }); }

  /* ——— پنجره تصویر: تصویر بزرگ (full/) و در نبودش همان تصویر کوچک ——— */
  function openPortrait(id) {
    const p = P[id], por = PORTRAITS[id];
    if (!p || !por) return;
    let m = $('#modal');
    if (!m) { m = document.createElement('div'); m.id = 'modal'; m.className = 'modal'; document.body.appendChild(m); }
    m.innerHTML = `<figure class="modal-card" role="dialog" aria-modal="true" aria-label="${esc(p.name)}">
      <button class="ibtn modal-x" data-act="modal-close" title="بستن (Esc)">${ic('xmark')}</button>
      <img src="assets/portraits/full/${id}.jpg" alt="${esc(p.name)}">
      <figcaption><b>${esc(p.name)}</b>${crown(p)}<span class="yr">${life(p)} ش</span>
        ${KING[id] ? `<span class="kingline">${esc(kingTitle(KING[id]))}</span>` : ''}
        <span class="credit">${esc(por.file)} — ${esc(por.license)}</span></figcaption></figure>`;
    m.querySelector('img').addEventListener('error', (e) => { e.target.src = `assets/portraits/${id}.jpg`; }, { once: true });
    m.hidden = false;
    document.body.classList.add('modal-open');
  }
  function closePortrait() {
    const m = $('#modal');
    if (!m || m.hidden) return false;
    m.hidden = true; m.innerHTML = '';
    document.body.classList.remove('modal-open');
    return true;
  }

  document.addEventListener('click', (ev) => {
    if (ev.target.id === 'modal' || ev.target.closest('[data-act="modal-close"]')) { closePortrait(); return; }
    if (ev.target.closest('#modal')) return;
    const zt = ev.target.closest('[data-zoom]');
    if (zt) openPortrait(zt.dataset.zoom);
    if (st.pk && !ev.target.closest('.picker')) { st.pk = null; renderPickers(); }
    const t = ev.target.closest('[data-act],[data-view],[data-fold],[data-hfold],[data-hdeep],[data-tdeep],[data-power],[data-rel],[data-type],[data-mstatus],[data-tag],[data-person],[data-era],[data-group],[data-mystery],[data-source],[data-interv],[data-thread]');
    if (!t) return;
    const d = t.dataset;
    if (t.closest('summary') && t.tagName !== 'SUMMARY' && (d.act || d.person || d.tdeep)) ev.preventDefault();
    if (d.tdeep) return treeDeep(d.tdeep);
    const fromChart = !!t.closest('#chartwrap, #treelist');
    if (d.act) {
      const a = d.act;
      if (a === 'zoom-in' || a === 'zoom-out') { st.zoom = Math.max(1, Math.min(16, st.zoom + (a === 'zoom-in' ? 1 : -1))); store.set('zoom', st.zoom); renderStage(); }
      else if (a === 'hzoom-in' || a === 'hzoom-out') { st.hZoom = Math.max(0.2, Math.min(1.8, Math.round((st.hZoom + (a === 'hzoom-in' ? 0.1 : -0.1)) * 10) / 10)); store.set('hZoom', st.hZoom); renderStage(); }
      else if (a === 'h-fit') hierFit();
      else if (a === 'center') { if (st.sel && st.sel.kind === 'person') centerOn(st.sel.id); }
      else if (a === 'full') { st.full = !st.full; renderStage(); }
      else if (a === 'tl-expand') { st.tlFold.clear(); saveSet('tlFold', st.tlFold); renderStage(); }
      else if (a === 'tl-fold-groups') { st.tlFold = new Set([...st.tlFold].filter((k) => k.startsWith('e:'))); S.groups.forEach((g) => st.tlFold.add('g:' + g.id)); ERAS.forEach((e) => st.tlFold.add(`g:${e.id}:other`)); saveSet('tlFold', st.tlFold); renderStage(); }
      else if (a === 'tl-fold-eras') { ERAS.forEach((e) => st.tlFold.add('e:' + e.id)); saveSet('tlFold', st.tlFold); renderStage(); }
      else if (a === 'h-expand') { st.hFold.clear(); saveSet('hFold', st.hFold); renderStage(); }
      else if (a === 'h-collapse') { st.hFold = new Set(S.people.map((p) => p.id)); saveSet('hFold', st.hFold); renderStage(); }
      else if (a === 'h-secondary') { st.hSecondary = !st.hSecondary; store.set('hSecondary', st.hSecondary); renderStage(); }
      else if (a === 'h-from-sel') { if (st.sel && st.sel.kind === 'person') { st.hRoot = st.sel.id; chartView = null; setView('hier'); } }
      else if (a === 'tree-mode-power' || a === 'tree-mode-line') { st.treeMode = a === 'tree-mode-line' ? 'line' : 'power'; store.set('treeMode', st.treeMode); renderStage(); if (st.sel && st.sel.kind === 'person') treeReveal(st.sel.id); }
      else if (a === 'iv-range') { st.ivRange = d.range; store.set('ivRange', st.ivRange); renderStage(); }
      else if (a === 'iv-zoom') { swimPending = swimState(); st.ivZoom = zoomStep(st.ivZoom, +d.z); store.set('ivZoom', st.ivZoom); renderStage(); }
      else if (a === 'th-zoom') { swimPending = swimState(); st.thZoom = zoomStep(st.thZoom, +d.z); store.set('thZoom', st.thZoom); renderStage(); }
      else if (a === 'th-kind') { st.thKind = d.kind || ''; renderStage(); }
      else if (a === 'j-range') { st.jRange = d.range; store.set('jRange', st.jRange); renderStage(); }
      else if (a === 'j-zoom') { swimPending = swimState(); st.jZoom = zoomStep(st.jZoom, +d.z); store.set('jZoom', st.jZoom); renderStage(); }
      else if (a === 'j-sig') { st.jSig = d.k || ''; const y = $('#stage').scrollTop; renderStage(); $('#stage').scrollTop = y; }
      else if (a === 'tree-expand') setAllTreeDetails(true);
      else if (a === 'tree-collapse') setAllTreeDetails(false);
      else if (a === 'masks') { st.masks = !st.masks; refilter(); }
      else if (a === 'violent') { st.violent = !st.violent; refilter(); }
      else if (a === 'clear') { st.q = ''; st.qn = ''; $('#q').value = ''; st.powers.clear(); st.rels.clear(); st.masks = false; st.violent = false; st.maxTier = 4; st.pk = null; refilter(); renderDetail(); }
      else if (a === 'pk') { st.pk = st.pk === d.pk ? null : d.pk; renderPickers(); }
      else if (a === 'pk-all' || a === 'pk-none') {
        const set = d.kind === 'power' ? st.powers : st.rels;
        set.clear();
        if (a === 'pk-all') document.querySelectorAll(`[data-pkval="${d.kind}"]`).forEach((i) => set.add(i.value));
        refilter();
      }
      else if (a === 'unselect') select(null);
      else if (a === 'back') goHistory('back');
      else if (a === 'fwd') goHistory('fwd');
      else if (a === 'trail') setView('trail');
      else if (a === 'locate') setView('overview');
      else if (a === 'theme') toggleTheme();
      else if (a === 'toggle-nav') { st.navC = !st.navC; store.set('navC', st.navC); applyPanels(); }
      else if (a === 'toggle-detail') { st.detC = !st.detC; store.set('detC', st.detC); applyPanels(); }
      else if (a === 'nav-expand') { ERAS.forEach((e) => { st.open.add('era:' + e.id); groupKeysOfEra(e.id).forEach((k) => st.open.add(k)); }); saveSet('open', st.open); renderNav(); }
      else if (a === 'nav-collapse') { st.open.clear(); saveSet('open', st.open); renderNav(); }
      else if (a === 'era-groups') {
        const keys = groupKeysOfEra(d.eraId);
        if (keys.some((k) => st.open.has(k))) keys.forEach((k) => st.open.delete(k));
        else { st.open.add('era:' + d.eraId); keys.forEach((k) => st.open.add(k)); }
        saveSet('open', st.open); renderNav();
      }
      return;
    }
    if (d.view) return setView(d.view);
    if (d.fold) { st.tlFold.has(d.fold) ? st.tlFold.delete(d.fold) : st.tlFold.add(d.fold); saveSet('tlFold', st.tlFold); return renderStage(); }
    if (d.hdeep && lastHier) {
      const ids = subtreeIds(d.hdeep, lastHier.T);
      const opening = !deepOpen(d.hdeep, lastHier.T);
      if (opening) ids.forEach((x) => st.hFold.delete(x)); else ids.forEach((x) => st.hFold.add(x));
      saveSet('hFold', st.hFold);
      renderStage();
      if (opening) centerOn(d.hdeep);
      return;
    }
    if (d.hfold) {
      const opening = st.hFold.delete(d.hfold);
      if (!opening) st.hFold.add(d.hfold);
      saveSet('hFold', st.hFold);
      renderStage();
      if (opening) centerOn(d.hfold);
      return;
    }
    if (d.power) { st.powers.has(d.power) ? st.powers.delete(d.power) : st.powers.add(d.power); return refilter(); }
    if (d.rel) { st.rels.has(d.rel) ? st.rels.delete(d.rel) : st.rels.add(d.rel); return refilter(); }
    if (d.type) { st.types.has(d.type) ? st.types.delete(d.type) : st.types.add(d.type); return renderStage(); }
    if (d.mstatus !== undefined) { st.mstatus = d.mstatus; return renderStage(); }
    if (d.tag) { st.q = d.tag; st.qn = norm(d.tag); $('#q').value = d.tag; return refilter(); }
    if (d.person) return select('person', d.person, { fromChart });
    if (d.era) return select('era', d.era, { fromChart });
    if (d.group) return select('group', d.group, { fromChart });
    if (d.mystery) return select('mystery', d.mystery);
    if (d.source) return select('source', d.source);
    if (d.interv) {
      select('intervention', d.interv);
      if (st.view === 'influence') document.querySelectorAll('.ivm').forEach((g) => g.classList.toggle('sel', g.dataset.interv === d.interv));
    }
    if (d.thread) {
      st.thStep = d.step != null ? +d.step : undefined;
      select('thread', d.thread);
      if (st.view === 'threads') {
        document.querySelectorAll('.thm').forEach((g) => g.classList.toggle('sel', g.dataset.thread === d.thread && +g.dataset.step === st.thStep));
        document.querySelectorAll('.thsteps li').forEach((li) => li.classList.toggle('hi', li.dataset.thread === d.thread && +li.dataset.step === st.thStep));
      }
    }
  });
  document.addEventListener('toggle', (ev) => {
    const el = ev.target;
    if (el.matches && el.matches('details[data-sum]')) { st.sumOpen = el.open; store.set('sumOpen', st.sumOpen); return; }
    if (!el.dataset || !el.dataset.key || filtersActive()) return;
    if (el.open) st.open.add(el.dataset.key); else st.open.delete(el.dataset.key);
    saveSet('open', st.open);
  }, true);
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset && t.dataset.pkval) {
      const k = t.dataset.pkval;
      if (k === 'tier') { st.maxTier = +t.value; refilter(); renderDetail(); return; }
      const set = k === 'power' ? st.powers : st.rels;
      if (t.checked) set.add(t.value); else set.delete(t.value);
      refilter();
    } else if (t.id === 'hroot') { st.hRoot = t.value; chartView = null; renderStage(); }
  });
  let qTimer = null;
  document.addEventListener('input', (ev) => {
    if (ev.target.id !== 'q') return;
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { st.q = ev.target.value; st.qn = norm(st.q); refilter(); }, 140);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === '/' && document.activeElement !== $('#q')) { ev.preventDefault(); $('#q').focus(); }
    else if (ev.key === 'Escape') {
      if (closePortrait()) return;
      if (st.pk) { st.pk = null; renderPickers(); }
      else if (st.full) { st.full = false; renderStage(); }
      else if (document.activeElement === $('#q') && st.q) { $('#q').value = ''; st.q = ''; st.qn = ''; refilter(); }
      else select(null);
    } else if (ev.altKey && ev.key === 'ArrowRight') goHistory('back');
    else if (ev.altKey && ev.key === 'ArrowLeft') goHistory('fwd');
  });
  /* کارت شناور فوری برای نشانه‌های data-tip (به جای title کند مرورگر) */
  const vtip = document.createElement('div');
  vtip.className = 'vtip'; vtip.hidden = true; vtip.setAttribute('role', 'tooltip');
  document.body.appendChild(vtip);
  const placeTip = (ev) => {
    const r = vtip.getBoundingClientRect(), pad = 14;
    let x = ev.clientX - r.width - pad, y = ev.clientY + pad;
    if (x < 8) x = ev.clientX + pad;
    if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - pad;
    vtip.style.left = `${Math.max(8, x)}px`; vtip.style.top = `${Math.max(8, y)}px`;
  };
  document.addEventListener('mouseover', (ev) => {
    const t = ev.target.closest && ev.target.closest('[data-tip]');
    if (!t) { vtip.hidden = true; return; }
    vtip.textContent = t.getAttribute('data-tip');
    vtip.hidden = false; placeTip(ev);
  });
  document.addEventListener('mousemove', (ev) => { if (!vtip.hidden) placeTip(ev); });
  document.addEventListener('scroll', () => { vtip.hidden = true; }, true);

  document.addEventListener('wheel', (ev) => {
    if (!ev.ctrlKey || !ev.target.closest('#chartwrap')) return;
    ev.preventDefault();
    if (st.view === 'hier') {
      const w = $('#chartwrap'), r = w.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top, z0 = st.hZoom;
      const px = (w.scrollLeft + mx) / z0, py = (w.scrollTop + my) / z0;
      st.hZoom = Math.max(0.2, Math.min(1.8, Math.round((z0 + (ev.deltaY < 0 ? 0.1 : -0.1)) * 10) / 10));
      store.set('hZoom', st.hZoom);
      renderStage();
      // نقطه زیر موس پس از بزرگ‌نمایی همان‌جا می‌ماند.
      const n = $('#chartwrap');
      if (n) { n.scrollLeft = px * st.hZoom - mx; n.scrollTop = py * st.hZoom - my; }
      return;
    }
    else { st.zoom = Math.max(1, Math.min(16, st.zoom + (ev.deltaY < 0 ? 1 : -1))); store.set('zoom', st.zoom); }
    renderStage();
  }, { passive: false });

  function applyTheme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next); store.set('theme', next);
  }
  applyTheme(store.get('theme', null));

  // آیکون‌های ثابت سربرگ و ستون‌ها
  document.querySelectorAll('[data-ic]').forEach((el) => { el.insertAdjacentHTML('afterbegin', ic(el.dataset.ic)); });

  window.addEventListener('hashchange', () => { readHash(); renderAll(); if (st.sel && st.sel.kind === 'person') centerOn(st.sel.id); });

  readHash();
  renderAll();
  restoreViewMem();
})();
