/* هسته داده شجره‌نامه — فقط ثبت‌کننده است. داده‌ها در فایل‌های دیگر پوشه data/ نوشته می‌شوند.
   ترتیب بارگذاری در index.html: core.js ← religions.js ← powers.js ← sources.js ← eras.js ← فایل‌های دوره (e01-…, e02-…)
   همه سال‌ها خورشیدی (هجری شمسی) هستند. */
window.SH = (function () {
  const store = { religions: [], powers: [], sources: [], eras: [], groups: [], people: [], links: [], mysteries: [], dynasties: [], interventions: [], threads: [], prisons: [], jails: [], releases: [] };
  const add = (key) => (...items) => { items.forEach((it) => store[key].push(it)); };
  return {
    store,
    religion: add('religions'),
    power: add('powers'),
    source: add('sources'),
    era: add('eras'),
    group: add('groups'),
    person: add('people'),
    link: add('links'),
    mystery: add('mysteries'),
    dynasty: add('dynasties'),
    intervention: add('interventions'),
    thread: add('threads'),
    prison: add('prisons'),
    jail: add('jails'),
    release: add('releases'),
  };
})();
