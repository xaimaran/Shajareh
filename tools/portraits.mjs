// دریافت تصویر افراد از ویکی‌پدیای انگلیسی (تصویر اصلی مقاله در ویکی‌مدیا کامانز).
// استفاده: node tools/portraits.mjs tools/portraits/e02-safavid.tsv
// ورودی: هر سطر «شناسه<TAB>عنوان مقاله انگلیسی». خروجی: تصویر در assets/portraits/<id>.jpg
// و گزارش «شناسه<TAB>نام پرونده<TAB>مجوز<TAB>هنرمند» در خروجی استاندارد. فایل list.js را تغییر نمی‌دهد؛
// آن فایل پس از بازبینی گزارش (حذف نقشه، پرچم، سکه و تصویر نادرست) با دست به‌روز می‌شود.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets', 'portraits');
mkdirSync(outDir, { recursive: true });
const UA = { 'User-Agent': 'shajare-research/1.0 (personal offline research; contact via local project)' };
const API = 'https://en.wikipedia.org/w/api.php';

const rows = readFileSync(process.argv[2], 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));
// نام پرونده‌هایی که تقریباً هرگز چهره نیستند. سکه‌هایی که نامشان این واژه‌ها را ندارد از این صافی رد می‌شوند،
// پس خروجی را همیشه با چشم بازبینی کنید.
const NOT_PORTRAIT = /(flag|map|coin|ashrafi|dirham|_arms|arms\.|coat[_ ]of[_ ]arms|emblem|seal|tughra|logo|locator|territor|empire|dynasty|signature|tomb|mausoleum|mosque|shrine|palace|viaggio|title[_ ]page|\.svg$)/i;

// ویکی‌مدیا درخواست‌های پشت‌سرهم را با 429 رد می‌کند: میان درخواست‌ها مکث و در صورت 429 تلاش دوباره با انتظار بیشتر
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fetchRetry = async (url) => {
  // خطای شبکه (قطع یا وقفه اتصال) هم مثل 429 با انتظار بیشتر دوباره آزموده می‌شود
  for (let i = 0; i < 6; i++) {
    await sleep(1500 + i * 4000);
    try {
      const r = await fetch(url, { headers: UA });
      if (r.status !== 429) return r;
    } catch (e) { if (i === 5) return { ok: false, status: e.code || 'network' }; }
  }
  return { ok: false, status: 429 };
};
const get = async (params) => {
  const u = new URL(API);
  Object.entries({ format: 'json', formatversion: '2', ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetchRetry(u);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

for (let i = 0; i < rows.length; i += 40) {
  const batch = rows.slice(i, i + 40);
  const res = await get({ action: 'query', redirects: '1', prop: 'pageimages', piprop: 'name|thumbnail', pithumbsize: '320', titles: batch.map((b) => b[1]).join('|') });
  const alias = new Map();
  (res.query.normalized || []).forEach((n) => alias.set(n.from, n.to));
  (res.query.redirects || []).forEach((n) => alias.set(n.from, n.to));
  const resolve = (t) => { let x = t; for (let k = 0; k < 4 && alias.has(x); k++) x = alias.get(x); return x; };
  const pages = new Map((res.query.pages || []).map((p) => [p.title, p]));
  const found = [];
  for (const [id, title] of batch) {
    const page = pages.get(resolve(title));
    if (!page || page.missing) { console.log(`${id}\t-\tبی‌مقاله\t${title}`); continue; }
    if (!page.pageimage || !page.thumbnail) { console.log(`${id}\t-\tبی‌تصویر\t${page.title}`); continue; }
    if (NOT_PORTRAIT.test(page.pageimage)) { console.log(`${id}\t${page.pageimage}\tرد: غیرچهره\t${page.title}`); continue; }
    found.push({ id, file: page.pageimage, thumb: page.thumbnail.source, title: page.title });
  }
  if (!found.length) continue;
  const meta = await get({ action: 'query', prop: 'imageinfo', iiprop: 'extmetadata|url', iiurlwidth: '900', iiextmetadatafilter: 'LicenseShortName|Artist', titles: found.map((f) => 'File:' + f.file).join('|') });
  const lic = new Map();
  (meta.query.pages || []).forEach((p) => {
    const ii = p.imageinfo && p.imageinfo[0];
    const m = ii && ii.extmetadata;
    const artist = m && m.Artist ? m.Artist.value.replace(/<[^>]+>/g, '').trim().slice(0, 80) : '';
    lic.set(p.title.replace(/^File:/, '').replace(/ /g, '_'), { license: m && m.LicenseShortName ? m.LicenseShortName.value : 'نامعلوم', artist, big: ii && (ii.thumburl || ii.url) });
  });
  mkdirSync(join(outDir, 'full'), { recursive: true });
  for (const f of found) {
    const l = lic.get(f.file.replace(/ /g, '_')) || { license: 'نامعلوم', artist: '' };
    // تصویر کوچک برای آواتار و تصویر بزرگ (۹۰۰ پیکسل) برای نمایش در پنجره
    for (const [url, dest] of [[f.thumb, join(outDir, `${f.id}.jpg`)], [l.big, join(outDir, 'full', `${f.id}.jpg`)]]) {
      if (!url || existsSync(dest)) continue;
      const r = await fetchRetry(url);
      if (!r.ok) { console.log(`${f.id}\t${f.file}\tخطای دریافت ${r.status}\t${f.title}`); continue; }
      writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    }
    console.log(`${f.id}\t${f.file}\t${l.license}\t${l.artist}`);
  }
}
