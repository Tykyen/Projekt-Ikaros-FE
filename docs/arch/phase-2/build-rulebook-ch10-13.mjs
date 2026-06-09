// Rulebook kapitoly 10-13 — parsuje rulebook-content.md (sekce 10-13) na seed stránky.
// MAGIE = sub-hub (Seznam + menu 21 typů s obrázky) + 21 typů jako stránky (Ostatní,
//   hero obrázek + popis + Stupně + QuickRef). PROGRAMOVÁNÍ + JAZYKY = bohaté stránky.
// Výstup: <repo-BE>/migration/rulebook-ch10-13-data.json(.gz). Spec: rulebook-graficke-zpracovani.md.
//
// Spuštění: node docs/arch/phase-2/build-rulebook-ch10-13.mjs

import fs from 'node:fs';
import zlib from 'node:zlib';

const SRC = 'c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/docs/arch/phase-2/rulebook-content.md';
const OUT = 'C:/Matrix/ProjektIkaros/Projekt-ikaros/migration/rulebook-ch10-13-data.json';
const RULEBOOK_WEBP = new Set(
  fs.readdirSync('c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/public/rulebook').filter((f) => f.endsWith('.webp')),
);

const fold = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
const IMG_FIX = { 'ovladani-energie': 'ovladani-magie.webp' }; // slug -> webp kde se liší
function imgFor(slug) {
  const f = IMG_FIX[slug] || slug + '.webp';
  return RULEBOOK_WEBP.has(f) ? '/rulebook/' + f : undefined;
}

// --- markdown -> HTML (h3/h4, seznamy, blockquote, odstavce, inline) ---
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(t) {
  let s = esc(t);
  s = s.replace(/`([^`]+)`/g, (_, x) => '<code>' + x + '</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, x) => '<strong>' + x + '</strong>');
  s = s.replace(/\*([^*]+)\*/g, (_, x) => '<em>' + x + '</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => '<a href="' + url + '">' + txt + '</a>');
  return s;
}
function mdToHtml(lines) {
  const out = [];
  let para = [], list = null;
  const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const flushList = () => { if (list) { out.push('<' + list.tag + '>' + list.items.map((it) => '<li>' + inline(it) + '</li>').join('') + '</' + list.tag + '>'); list = null; } };
  const flushAll = () => { flushPara(); flushList(); };
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], line = raw.replace(/\s+$/, ''), t = line.trim();
    if (!t || t === '---') { flushAll(); continue; }
    const h3 = t.match(/^###\s+(.*)/);
    if (h3) { flushAll(); out.push('<h3>' + inline(h3[1]) + '</h3>'); continue; }
    if (/^##\s/.test(t)) { flushAll(); continue; }
    const fullBold = t.match(/^\*\*([^*]+)\*\*$/); // celý řádek tučně (Stupně) -> H4
    if (fullBold) { flushAll(); out.push('<h4>' + inline(fullBold[1]) + '</h4>'); continue; }
    const bq = t.match(/^>\s?(.*)/);
    if (bq) {
      flushAll();
      if (/K ověření PJ/i.test(bq[1])) { while (i + 1 < lines.length && /^>\s?/.test(lines[i + 1].trim())) i++; continue; }
      out.push('<blockquote><p>' + inline(bq[1]) + '</p></blockquote>');
      continue;
    }
    const li = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
    if (li) { flushPara(); const tag = /\d+\./.test(li[2]) ? 'ol' : 'ul'; if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; } list.items.push(li[3]); continue; }
    if (/^\s+\S/.test(raw) && list && list.items.length) list.items[list.items.length - 1] += ' ' + t;
    else { flushList(); para.push(t); }
  }
  flushAll();
  return out.join('');
}
// rozdělí tělo typu magie na popis (před **Stupně**) a stupně (texty bez čísla)
function splitLevels(lines) {
  const si = lines.findIndex((l) => /^\*\*Stupně\*\*\s*$/.test(l.trim()));
  if (si < 0) return { desc: lines, levels: [] };
  const desc = lines.slice(0, si);
  const stripMd = (t) => t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1');
  const levels = [];
  for (const l of lines.slice(si + 1)) {
    const m = l.trim().match(/^[-*]\s+(?:\d+\s*[—–-]\s*)?(.+)/);
    if (m && m[1]) levels.push(stripMd(m[1].trim()));
  }
  return { desc, levels };
}

// první věta plain textu (pro QuickRef)
function firstSentence(lines) {
  for (const l of lines) {
    const t = l.trim();
    if (!t || t.startsWith('#') || t.startsWith('>') || t.startsWith('-') || /^\*\*/.test(t) || t === '---') continue;
    const plain = t.replace(/\*\*?([^*]+)\*\*?/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    const m = plain.match(/^.*?[.!?](\s|$)/);
    return (m ? m[0] : plain).trim();
  }
  return '';
}

// --- načti zdroj, rozděl kapitoly ---
const allLines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);
const heads = [];
allLines.forEach((l, i) => { const m = l.match(/^##\s+(\d+)\.\s+(.*)/); if (m) heads.push({ i, num: +m[1] }); });
const chapterLines = (num) => { const s = heads.find((h) => h.num === num), n = heads.find((h) => h.num === num + 1); return allLines.slice(s.i + 1, n ? n.i : allLines.length); };
// rozděl tělo kapitoly podle ### na {title, lines}
function splitByH3(lines) {
  const idx = []; lines.forEach((l, i) => { const m = l.match(/^###\s+(.*)/); if (m) idx.push({ i, title: m[1].trim() }); });
  const intro = lines.slice(0, idx.length ? idx[0].i : lines.length);
  const sections = idx.map((h, k) => ({ title: h.title, lines: lines.slice(h.i + 1, idx[k + 1] ? idx[k + 1].i : lines.length) }));
  return { intro, sections };
}

const pages = [];
let order = 10;

// --- 10 Magická pravidla: sub-hub + 21 typů ---
{
  const { intro, sections } = splitByH3(chapterLines(10));
  const menu = sections.map((sec, k) => {
    const slug = fold(sec.title);
    return { label: sec.title, href: slug, order: k, imageUrl: imgFor(slug) };
  });
  pages.push({ slug: 'magicka-pravidla', title: 'Magická pravidla', type: 'Seznam', order: order++, imageUrl: '/rulebook/magicka-pravidla.webp', content: mdToHtml(intro), menu });
  sections.forEach((sec) => {
    const slug = fold(sec.title);
    const { desc, levels } = splitLevels(sec.lines);
    const p = { slug, title: sec.title, type: 'Ostatní', order: order++, content: mdToHtml(desc), quickRef: firstSentence(desc) };
    if (levels.length) p.customData = { magicLevels: JSON.stringify(levels) };
    const img = imgFor(slug); if (img) p.imageUrl = img;
    pages.push(p);
  });
}

// --- 11 Programování: bohatá stránka ---
{
  const lines = chapterLines(11);
  pages.push({ slug: 'programovani', title: 'Programování', type: 'Ostatní', order: order++, imageUrl: '/rulebook/programovani-hub.webp', content: mdToHtml(lines), quickRef: firstSentence(lines) });
}
// --- 12 Jazyková politika, 13 Jazykové rodiny ---
for (const [num, slug, title, webp] of [[12, 'jazykova-politika', 'Jazyková politika', null], [13, 'jazykove-rodiny', 'Jazykové rodiny', 'jazykove-rodiny.webp']]) {
  const lines = chapterLines(num);
  const p = { slug, title, type: 'Ostatní', order: order++, content: mdToHtml(lines), quickRef: firstSentence(lines) };
  if (webp && RULEBOOK_WEBP.has(webp)) p.imageUrl = '/rulebook/' + webp;
  pages.push(p);
}

const menuItems = [
  { label: 'Magická pravidla', href: 'magicka-pravidla', order: 9 },
  { label: 'Programování', href: 'programovani', order: 10 },
  { label: 'Jazyková politika', href: 'jazykova-politika', order: 11 },
  { label: 'Jazykové rodiny', href: 'jazykove-rodiny', order: 12 },
];

const data = { pages, menuItems };
fs.writeFileSync(OUT, JSON.stringify(data));
fs.writeFileSync(OUT + '.gz', zlib.gzipSync(JSON.stringify(data)));

console.log('=== rulebook ch10-13 build (graficky) ===');
console.log('stránek celkem:', pages.length, '(1 sub-hub magie + 21 typů + programování + 2 jazyky)');
const hub = pages.find((p) => p.slug === 'magicka-pravidla');
console.log('magie sub-hub menu:', hub.menu.length, 'typů | s obrázkem:', hub.menu.filter((m) => m.imageUrl).length);
const noImg = pages.filter((p) => p.type === 'Ostatní' && !p.imageUrl).map((p) => p.slug);
console.log('typy bez obrázku:', noImg.length ? noImg.join(', ') : '(žádné)');
const withLevels = pages.filter((p) => p.customData && p.customData.magicLevels);
console.log('typy s LevelSpine stupni:', withLevels.length, '/ 21');
console.log('\nVzorek typu (Alchymie):');
const al = pages.find((p) => p.slug === 'alchymie');
console.log('  img:', al.imageUrl, '| quickRef:', al.quickRef);
console.log('  stupně (LevelSpine):', al.customData ? JSON.parse(al.customData.magicLevels).length : 0);
console.log('  stupeň 1:', al.customData ? JSON.parse(al.customData.magicLevels)[0] : '-');
console.log('  content start:', al.content.slice(0, 120));
console.log('\nVystup:', OUT);
