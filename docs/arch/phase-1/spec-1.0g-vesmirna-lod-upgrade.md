# Spec 1.0g — Vesmírná loď visual upgrade

**Datum:** 2026-05-09
**Status:** ⏳ Čeká na schválení
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.0g
**Závisí na:** 1.0 ✅, 1.0b modré nebe ✅, 1.0c zlatý standard ✅, 1.0d sci-fi ✅, 1.0e bílá ✅, 1.0f modré nebe heraldic ✅
**Reference:** `01 vesmirna-lod current.png` (current — minimální chrome), `02 vesmirna-lod cíl.png` (target — bohatý HUD frame s welcome card, slim industrial topbar)

---

## 0. Princip — vojenský hangár, ne futuristický command bridge

`sci-fi` skin (1.0d) je **futuristický command HUD** — hairline cyan/magenta, holografická elegance, glass + scanlines.

`vesmirna-lod` musí být **odlišný originální skin** (memory rule: žádné sdílení/recyklace ornamentů mezi tématy). Estetický záměr:

> **Vojenský hangár vesmírné lodi — industriální plate panely, rivetované rohy, amber warning accenty na cyan modré.**

Inspirace: USCSS Nostromo (Alien) palubní HUD, EVE Online stanice, Helldivers operační konzole. Ne Star Trek, ne Mass Effect Citadel.

**Strict isolation:** vše scoped přes `[data-theme="vesmirna-lod"]`. Zbylých 20 témat = nulová regrese.

---

## 1. Cíl — vizuální popis

Po načtení s `themeId === 'vesmirna-lod'` má dashboard vypadat jako **velitelská konzole vojenské vesmírné lodi** dle `02 cíl.png` se zachováním identity vesmirna-lod (cyan + amber, žádný magenta):

- **Background** — **ZACHOVAT současný** (`/themes/backgrounds/vesmirna-lod.webp` — hangár interiér s loďmi)
- **Logo banner** — **ZACHOVAT současný** (`/themes/vesmirna-lod/decor/logo.webp`), pouze upravit cyan glow/blend pro slim topbar
- **Andel medailon** — **ZACHOVAT současný** (`/themes/vesmirna-lod/decor/andel-medallion.webp`); rámeček minimální — **pouze 4 cyan rivet body v rozích slot containeru**, žádný plný plate (jewelry-in-toolbox riziko, audit 1.0g)
- **Atmosférický overlay** — radial cyan top-left + radial amber bottom-right + linear darken (zachovat současné, jen stronger)
- **Topbar** — slim 56px (jako sci-fi), **industrial chamfered buttons** (5-úhelník — jeden roh ořezaný), uppercase + letter-spacing, amber accent na hover; selektor témat má amber inner ring
- **Glass panely** (sidebar, right, card, novinky) — **plate-metal** vzhled: `linear-gradient` cyan-tinted dark + **chamfered border** (CSS `clip-path` na 1 nebo 2 rozích), **rivet body** (4× malé cyan tečky podél vnitřní hrany), inset cyan glow
- **Rohy panelů** — žádné minimalistické L-brackety jako teď. Místo nich **industrial corner plate**: kovový plát s 2 rivetami. TL roh = cyan plate, BR roh = amber warning plate (diagonal žlutočerný proužek). **Amber budget cap (audit): max 2 amber výskyty per panel** — corner plate BR + section title chevron. Žádné další amber accenty na panelu samém.
- **Welcome card** — **dominantní min-height 60vh** (jako sci-fi), velký frame s amber "CARGO BAY" stencil number "01" v rohu (čistě CSS pseudo-element), medailon vlevo s plate-metal frame
- **Section title** — amber stencil uppercase text **chevron pouze vlevo** (`>>> NAVIGACE`, ne sandwich `>>> X <<<` — audit 1.0g, méně busy), cyan rule pod ním, žádné `◆` ani `━━━`
- **NavItem** — industrial 3D btn3d s plate-metal pozadím; aktivní = full cyan fill + amber 3px left border + cyan glow; hover = subtle amber border tint
- **Pravý panel items** — kompaktnější (jako sci-fi), ale glob/diskuze ikony zůstávají z lucide
- **Novinky panel** — plate-metal frame, "+ PŘIDAT NOVINKU" tlačítko amber outline
- **PJ badge** — cyan chip s amber inner ring (industrial dual-tone)
- **Welcome heading** — `Vítej v Projektu Ikaros.` s **cyan highlight + amber underline** (data-stripe)
- **Signature** — Rajdhani italic + amber glow, end-marker = 4× amber malé čtverce (industrial code marker, ne magenta jako sci-fi)
- **Reduced motion** — žádné animace (skin je staticky industriální, nemá živost sci-fi magenta pulse)

**Mimo rozsah:**
- Změna backgroundu, loga, anděl medailonu (uživatel explicitně řekl: nechci měnit)
- Animace hangárových světel (out of scope — stačí statický overlay)
- Edit shared komponent (`IkarosLayout`, `IkarosCard`, `CornerOrnament`)
- Ostatní témata

---

## 2. Token model — `themes/themes/vesmirna-lod/index.ts` (plný přepis)

Replikujeme luxury token schema z 1.0d (sci-fi), upravujeme paletu na **cyan + amber** (současné `--accent` cyan zachováme jako primary, přidáme amber jako secondary místo magenta).

### Luxury tokeny

```ts
// Atmosférický overlay — cyan top-left + amber bottom-right
'--theme-bg-overlay':
  'radial-gradient(circle at 18% 22%, rgba(0, 184, 232, 0.18) 0%, transparent 40%), ' +
  'radial-gradient(circle at 85% 80%, rgba(232, 160, 32, 0.14) 0%, transparent 35%), ' +
  'linear-gradient(180deg, rgba(4, 8, 14, 0.45) 0%, rgba(4, 8, 14, 0.65) 100%)',

// Glass surfaces — plate metal cyan-tinted
'--theme-surface':         'rgba(8, 16, 26, 0.82)',
'--theme-surface-strong':  'rgba(4, 10, 18, 0.94)',
'--theme-surface-soft':    'rgba(14, 28, 44, 0.55)',

// Borders — cyan dominant + amber secondary (ne magenta)
'--theme-border':          'rgba(0, 184, 232, 0.72)',
'--theme-border-soft':     'rgba(0, 184, 232, 0.30)',
'--theme-border-amber':    'rgba(232, 160, 32, 0.62)',
'--theme-border-cyan':     'rgba(0, 184, 232, 0.55)',

// Text — světlejší cyan-tinted
'--theme-text':         '#d6e6f2',
'--theme-text-muted':   '#7a98ad',
'--theme-heading':      '#5dd5ff',

// Accents — cyan primary, amber secondary
'--theme-accent':          '#00b8e8',
'--theme-accent-bright':   '#5dd5ff',
'--theme-accent-cyan':     '#00b8e8',
'--theme-accent-amber':    '#e8a020',          // dual-tone secondary
'--theme-accent-amber-bright': '#ffc24a',

// Glow
'--theme-glow-cyan':         'rgba(0, 184, 232, 0.45)',
'--theme-glow-cyan-strong':  'rgba(0, 184, 232, 0.70)',
'--theme-glow-amber':        'rgba(232, 160, 32, 0.42)',
'--theme-glow-amber-strong': 'rgba(232, 160, 32, 0.65)',
'--theme-glow-magenta':      'rgba(232, 160, 32, 0.42)',  // alias amber → magenta token kvůli kompat
'--theme-glow-gold':         'rgba(232, 160, 32, 0.42)',  // alias amber
'--theme-shadow':            'rgba(0, 4, 8, 0.88)',

// Nav interactive
'--theme-nav-hover-bg':   'rgba(0, 184, 232, 0.12)',
'--theme-nav-active-bg':  'linear-gradient(90deg, rgba(0, 184, 232, 0.32) 0%, rgba(8, 22, 36, 0.55) 100%)',
```

### Layout chrome

```ts
'--header-h':            '56px',          // slim (z 88px)
'--header-bg':           '#040810',
'--frame-pad-y':         '40px',
'--frame-pad-x':         '18px',
'--sidebar-w':           '280px',

'--asset-logo-w':        '180px',
'--asset-logo-w-mobile': '150px',
'--logo-img-display':    'block',
'--logo-fallback-display':'none',
```

### Asset slots (zachovat existující + nové volitelné nav ikony)

```ts
const decor = '/themes/vesmirna-lod/decor';

// Existující — ZACHOVAT
'--asset-logo':            `url('${decor}/logo.webp')`,
'--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,

// Nové nav ikony (viz sekce 4) — 7 ikon, kompletní pokrytí sidebaru
'--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
'--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
'--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
'--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
'--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
'--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
'--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
```

### Legacy tokeny

Mapování na luxury (zachovat funkčnost btn3d, IkarosLayout, formulářů):

```ts
'--bg-primary':       '#040810',
'--bg-secondary':     '#0a141e',
'--bg-card':          'var(--theme-surface)',
'--bg-card-hover':    'var(--theme-surface-soft)',
'--accent':           'var(--theme-accent)',
'--accent-bright':    'var(--theme-accent-bright)',
'--accent-soft':      'var(--theme-border-soft)',
'--accent-dim':       '#005878',
'--text-primary':     'var(--theme-text)',
'--text-secondary':   'var(--theme-text-muted)',
'--text-muted':       '#4d6878',
'--border':           'var(--theme-border-soft)',
'--border-subtle':    'rgba(0, 184, 232, 0.16)',
'--border-strong':    'var(--theme-border)',
'--success':          '#3ecf8e',
'--warning':          '#e8a020',
'--danger':           '#f06060',
'--info':             'var(--theme-accent)',
// soft + focus rings — zachovat ze současného vesmirna-lod beze změny
```

### Typography

```ts
'--font-logo':    '"Orbitron", "Russo One", sans-serif',
'--font-display': '"Rajdhani", "Exo 2", sans-serif',
'--font-body':    '"Roboto Condensed", "Roboto", sans-serif',
'--font-script':  '"Rajdhani", system-ui, sans-serif',
```

(Zachovat současné — `Orbitron + Rajdhani + Roboto Condensed` industriálně sedí.)

---

## 3. `decorations.css` — strukturální plán

Plný přepis (současné má jen 78 řádků). Pattern z 1.0d sci-fi, přepracovaný pro industrial look.

### Sekce

1. **Root + atmosférický overlay** — `[data-theme="vesmirna-lod"][data-shell="ikaros"]::before` s `--theme-bg-overlay`
2. **Topbar** — slim 56px, double-rule pod headerem (cyan main + amber secondary 4px offset)
3. **Logo banner** — `mix-blend-mode: screen` + cyan glow (jako sci-fi, ale na současný asset)
4. **Glass panely** — `linear-gradient` cyan-tinted + `backdrop-filter: blur(10px)` + `border` cyan + inset cyan glow + **chamfered top-right corner** (`clip-path: polygon(...)` ořez 14px×14px na TR)
5. **Industrial corner plates (TL + BR)** — místo bracketů:
   - **TL plate** = `::before` 36×24px, cyan plate-metal (`linear-gradient` cyan-dark) + 2× rivet body (radial cyan dot pozice TL, BR rohu plate)
   - **BR plate** = `::after` 36×24px, **amber warning stripe** (`repeating-linear-gradient(45deg, amber 0 4px, black 4px 8px)`) + amber drop-shadow
6. **Rivety podél hran panelů** — `[data-frame-panel] [class*="cornerOrnament"]` reaktivace na **malé cyan rivetové body** (radial cyan, ne magenta pulse) ve 4 rozích, žádná animace
7. **Welcome card — dominantní** — `min-height: 60vh` (desktop) + amber stencil "CARGO BAY 01" pseudo-element TR
8. **Andel medailon — minimální rivet frame** — `[data-andel-medallion]` zachovat 240×240; přidat **pouze 4 cyan rivet body** (`::before` + 3× background-image radial gradient nebo wrap container s 4 absolute pseudo-pozicemi) v rozích slot containeru. Žádný plný plate, žádný amber. Cíl: nepřebít delicate cyan glowing andel.
9. **Section title** — amber stencil uppercase + **chevron prefix POUZE vlevo** (`>>> NAVIGACE` přes `::before content`) + cyan rule pod (`::after`). Bez sandwich-suffix.
10. **NavItem (btn3d)** — plate-metal pozadí + cyan border, aktivní = cyan fill + 3px amber left rule + cyan glow
11. **Pravý panel kompakt** — kopie sci-fi pattern (menší padding/font, gap 4px)
12. **Header buttons** — chamfered (`clip-path` 5-úhelník), uppercase letter-spacing 0.14em, hover = amber outline
13. **PJ badge** — cyan chip + amber inner ring (1px inset amber)
14. **Welcome heading + signature** — heading cyan glow + amber data-stripe podtržení; signature Rajdhani italic + 4× amber square end-marker (SVG inline)
15. **Focus-visible** — box-shadow cyan ring (totožné s sci-fi pattern, ne outline kvůli pseudoelementům)
16. **Mobile (≤768px)** — chamfery vyplé, rivety hidden, panely jen flat border + simple cyan inset shadow, andel medailon 180×180, signature menší. **Keep-on-mobile identity marker (audit 1.0g):** každý `[data-frame-panel]` si **zachová 2px amber left-edge stripe** (`border-left: 2px solid var(--theme-accent-amber)` nebo box-shadow inset 2px). Bez tohoto markeru skin na mobilu degraduje na obyčejný dark theme.
17. **Reduced motion** — `animation: none !important` (skin nemá pulse, ale safety guard)

**Žádné `@import` Google Fonts** — `Rajdhani` se už načítá v sci-fi `decorations.css`. Pokud uživatel přepíná mezi sci-fi a vesmirna-lod, font už je v cache; pokud ne, fallback `Russo One`/`Exo 2`/`Roboto Condensed` zvládne.

---

## 4. Nav ikony — kompletní set 7 assetů (celý sidebar)

Vesmirna-lod dostane vlastní industrial set 7 ikon pokrývajících kompletně levé sidebar nav. Pattern paralelní k bila skinu (10 assetů). Přínosy:

- Maximální originalita vůči sci-fi (sci-fi má 0 nav assetů, jen cyan glow CSS)
- Konzistentní industriální identita napříč celým menu — žádný mix lucide + custom
- Replikuje pattern bila skinu, kde komplet assety dramaticky zvyšují skin "fingerprint"

**Zapojení v CSS:** přepsat lucide ikonu přes `data-nav-key="<key>"` na `background-image: var(--asset-icon-<key>)` + `background-size: contain` + skrýt SVG potomka (`[data-theme="vesmirna-lod"] [data-nav-key] [class*="navItemIcon"] svg { display: none }`).

**`data-nav-key` atribut neexistuje** (ověřeno v `IkarosLayout.tsx` — NavItem ho nemá). Plan-1.0g checkpoint #1 = přidání atributu na 2 místa:
- `NavItemDef` typ: přidat `key: string` (povinný)
- `NavItem` JSX: `<NavLink data-nav-key={key} ...>`
- `PRIMARY_NAV` array: doplnit `key: 'uvodnik'|'napoveda'|'diskuze'|'clanky'|'galerie'|'vytvorit-svet'`
- Hospoda v `CHAT_ROOMS` map: přidat `data-nav-key={room.key}` na NavLink (key 'hospoda' už existuje)

Tento edit = **jediný šum mimo theme files**. Bez něho je investice 7 assetů zablokovaná → v plánu jako blocking checkpoint #1 PŘED generováním assetů.

### Specifikace ikon

| Pořadí | Soubor | Velikost | Námět |
|---|---|---|---|
| 1 | `icon-uvodnik.webp` | 256×256 | Uzavřená dvojitá hangárová vrata + cyan seam + amber warning stripe |
| 2 | `icon-vytvorit-svet.webp` | 256×256 | Planeta v industriálním construction scaffoldu + amber struts + cyan `+` marker |
| 3 | `icon-diskuze.webp` | 256×256 | Vojenský comm headset s boom mikrofonem + cyan transmit LED + amber rivety |
| 4 | `icon-clanky.webp` | 256×256 | Industrial datapad s cyan data lines + amber status indicator |
| 5 | `icon-galerie.webp` | 256×256 | Wall-mounted monitor s abstract image preview + amber LED |
| 6 | `icon-napoveda.webp` | 256×256 | Industrial info terminal s cyan stencil `?` + amber LED |
| 7 | `icon-hospoda.webp` | 256×256 | Steel tankard mug s cyan-lit pivem + amber rivety |

Detailní prompty (paleta, materiály, negativy, postprocessing) viz `public/themes/vesmirna-lod/decor/_asset-prompts.md` (vzniká současně se spec).

**Generátor:** Midjourney v6 nebo SDXL/Flux. Po vygenerování:
- PNG s transparentním pozadím
- Optimize: `cwebp -q 90 -alpha_q 100 input.png -o output.webp`
- Cílová velikost <30 KB per ikona (malý formát)

---

## 5. Akcepční kritéria

1. ✅ Po přepnutí na `vesmirna-lod` dashboard vypadá podle image 2, ale s vlastním cyan+amber industrial vzhledem (ne kopie sci-fi cyan+magenta)
2. ✅ Background, logo, andel medailon = beze změny souborů
3. ✅ Welcome card je dominantní (desktop ≥ 60vh)
4. ✅ Industrial corner plates (TL cyan, BR amber warning stripe) viditelné na všech 4 panelech
5. ✅ Topbar slim 56px, chamfered buttons, cyan/amber double-rule pod headerem
6. ✅ Section title má amber stencil + chevron prefix, ne sci-fi `━━━`
7. ✅ Žádný globální soubor není dotčen — diff omezen na `themes/themes/vesmirna-lod/{index.ts, decorations.css}` + případně 3 nové asset soubory + `_asset-prompts.md`
8. ✅ Mobile (≤768px) skin redukuje chrome (chamfery off, rivety hidden), zachovává čitelnost
9. ✅ Reduced motion respektován
10. ✅ Ostatní themes (modré nebe, zlatý standard, sci-fi, bílá, zbylých 16) = nulová regrese

---

## 6. Risks & decisions

- **Rivety podél hran** — pokud bude vypadat zahlceně, fall back na 1 rivetový pár v každém rohu (TL+BR)
- **Chamfered clip-path** — `box-shadow` přes clip-path není možný; vyžaduje wrapping nebo `filter: drop-shadow`. Akceptujeme drop-shadow.
- **Amber warning stripe** — pozor na kontrast s text; stripe pouze v BR rohu plate, ne přes celý border
- **Nav ikony — `data-nav-key` neexistuje, doplníme** (audit 1.0g): edit `IkarosLayout.tsx` přidá `key` field do `NavItemDef` + render `data-nav-key` na NavLink. Verifikace v plan-1.0g checkpoint #1.
- **Ikona hospoda (mug)** — pozor aby nepůsobila jako bila beer (lehká pohádková). Vesmirna-lod mug = kovová industriální + cyan glow tekutina
- **Konzistence 7 ikon** — vyšší riziko nesouladu (1 ikona špatná = celý set vypadá slátaně). Style guide v `_asset-prompts.md` musí být přísně dodržen; každý asset projde checklistem před commitnutím

---

## 7. Schválení

- [ ] Uživatel schválil spec
- [ ] Asset prompts dokument odsouhlasen
- [ ] Implementační plán (`plan-1.0g.md`) vytvořen a schválen
- [ ] Frontend-design audit proveden (memory: povinné při skinech, mezi spec a impl. plán)
- [ ] Implementace dokončena
- [ ] Roadmap aktualizován (`docs/roadmap-fe.md` → 1.0g ✅)
