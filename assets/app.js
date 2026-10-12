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
    ['influence', 'hand', 'نفوذ خارجی'], ['trail', 'route', 'ردپا'], ['mysteries', 'question', 'معماها'], ['sources', 'books', 'منابع'],
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
    ivRange: store.get('ivRange', 'century'),
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
  const selName = (s) => (!s ? 'چکیده کل' : s.kind === 'person' ? P[s.id]?.name : s.kind === 'era' ? E[s.id]?.name : s.kind === 'group' ? G[s.id]?.name : s.kind === 'mystery' ? MY[s.id]?.title : s.kind === 'source' ? SRC[s.id]?.title : s.kind === 'intervention' ? IV[s.id]?.title : '') || '';

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
  function ivShape(v, cx, cy, c) {
    const cat = IV_KIND[v.kind]?.[1];
    const op = { 1: 1, 2: 0.85, 3: 0.55, 4: 0.35 }[v.tier ?? 2];
    const sel = st.sel && st.sel.kind === 'intervention' && st.sel.id === v.id;
    const ring = v.placed.length || v.removed.length ? `<circle cx="${cx}" cy="${cy}" r="11" class="ivring"/>` : '';
    const mark = cat === 'control' ? `<circle cx="${cx}" cy="${cy}" r="7" fill="${c}" class="ivc"/>`
      : cat === 'partner' ? `<circle cx="${cx}" cy="${cy}" r="6" fill="var(--panel)" stroke="${c}" stroke-width="2.5"/>`
      : cat === 'hostile' ? `<rect x="${cx - 5.5}" y="${cy - 5.5}" width="11" height="11" transform="rotate(45 ${cx} ${cy})" fill="${c}" class="ivh"/>`
      : `<circle cx="${cx}" cy="${cy}" r="6" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="2 2"/>`;
    return `<g class="ivm${sel ? ' sel' : ''}" data-interv="${v.id}" opacity="${op}"><title>${esc(`${fa(v.year)}${v.end ? '–' + fa(v.end) : ''} · ${v.title} · ${IV_KIND[v.kind]?.[0] || v.kind} · ${TIERS[v.tier ?? 2]}`)}</title><circle cx="${cx}" cy="${cy}" r="14" class="ivsel"/>${ring}${mark}</g>`;
  }
  function ivLegend() {
    const sw = (inner) => `<svg viewBox="-12 -12 24 24" width="20" height="20">${inner}</svg>`;
    return `<div class="ivlegend">
      <span>${sw('<circle r="7" fill="var(--muted)"/>')}مهار</span>
      <span>${sw('<circle r="6" fill="var(--panel)" stroke="var(--muted)" stroke-width="2.5"/>')}همکاری</span>
      <span>${sw('<rect x="-5.5" y="-5.5" width="11" height="11" transform="rotate(45)" fill="var(--muted)" stroke="var(--danger)" stroke-width="2"/>')}دشمنی</span>
      <span>${sw('<circle r="6" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="2 2"/>')}خودداری</span>
      <span>${sw('<circle r="10" fill="none" stroke="var(--ink)" stroke-width="1.5"/><circle r="5" fill="var(--muted)"/>')}کسی را گماشت یا برکنار کرد</span>
      <span class="muted">کم‌رنگی = اعتبار کمتر</span></div>`;
  }
  function ivLanes(list, rows, from, to) {
    if (!rows.length) return '<p class="empty">رخدادی در این بازه و با این فیلترها نیست.</p>';
    const LW = 150, RH = 38, TOP = 30, span = Math.max(1, to - from);
    const W = Math.max(620, span * 6);
    const x = (y) => 14 + W - ((Math.min(Math.max(y, from), to) - from) / span) * W;
    const H = TOP + rows.length * RH + 10;
    let g = '';
    ERAS.filter((e) => (e.end ?? NOW) >= from && e.start <= to).forEach((e) => {
      const r = x(e.start), l = x(e.end ?? NOW);
      g += `<rect x="${l}" y="0" width="${Math.max(0, r - l)}" height="${H}" fill="${e.color}" opacity=".07"/><text x="${(l + r) / 2}" y="12" class="iveralbl" text-anchor="middle">${esc(e.short || e.name)}</text>`;
    });
    for (let y = Math.ceil(from / 10) * 10; y <= to; y += 10) g += `<line x1="${x(y)}" x2="${x(y)}" y1="18" y2="${H}" class="ivtick"/><text x="${x(y)}" y="27" class="ivyr" text-anchor="middle">${fa(y)}</text>`;
    rows.forEach((r, i) => {
      const cy = TOP + i * RH + RH / 2, c = PW[r.id]?.color || '#888';
      g += `<line x1="10" x2="${W + 18}" y1="${cy}" y2="${cy}" class="ivrow"/><text x="${W + LW + 10}" y="${cy + 4}" text-anchor="start" class="ivplbl" fill="${c}">${esc(PW[r.id]?.name || r.id)}</text>`;
      const seen = Object.create(null);
      list.filter((v) => v.powers.includes(r.id)).forEach((v) => {
        const k = (seen[v.year] = (seen[v.year] ?? -1) + 1);
        const dy = k ? (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 8 : 0;
        if (v._end > v.year) g += `<line x1="${x(v._end)}" x2="${x(v.year)}" y1="${cy + dy}" y2="${cy + dy}" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity=".3"/>`;
        g += ivShape(v, x(v.year), cy + dy, c);
      });
    });
    return `<div class="ivlane-wrap"><svg class="ivlanes" direction="rtl" width="${W + LW + 20}" height="${H}" viewBox="0 0 ${W + LW + 20} ${H}">${g}</svg></div>`;
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
          ${lastPlaced ? ` آخرین گماشتن مستند یا معتبر به دست قدرت خارجی: <button class="lnk" data-interv="${lastPlaced.id}">${esc(lastPlaced.title)} (${fa(lastPlaced.year)})</button>${lastPlaced.year < 1357 && to > 1357 ? '؛ پس از ۱۳۵۷ هیچ گماشتنی در سطح مستند یا معتبر ثبت نشده است' : ''}.` : ' در این بازه هیچ گماشتنی در سطح مستند یا معتبر ثبت نشده است.'}</p>
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
    ({ overview: renderOverview, hier: renderHier, tree: renderTree, trail: renderTrail, mysteries: renderMysteries, sources: renderSources, influence: renderInfluence })[st.view]();
  }
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
    const t = ev.target.closest('[data-act],[data-view],[data-fold],[data-hfold],[data-hdeep],[data-tdeep],[data-power],[data-rel],[data-type],[data-mstatus],[data-tag],[data-person],[data-era],[data-group],[data-mystery],[data-source],[data-interv]');
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
