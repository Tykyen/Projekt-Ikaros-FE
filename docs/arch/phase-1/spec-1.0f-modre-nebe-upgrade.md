# Spec 1.0f — Modré nebe visual upgrade (heraldic ornament tier)

**Datum:** 2026-05-09
**Status:** ✅ Implementováno
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.0f
**Závisí na:** 1.0 ✅, 1.0b ✅ (původní pilot modre-nebe), 1.1 ✅
**Reference:** Obrázek 1 z chatu 2026-05-09 (target), obrázek 2 (current state)
**Skill kontext:** Tato spec vznikla aktivací skillu `frontend-design` — záměrně volíme distinct, non-generic estetiku.

---

## 0. Strategie a scope

Modré nebe je **pilot** luxusního theme systému (spec 1.0b). Aktuální stav vypadá dobře, ale ve srovnání s referenčním obrázkem mu chybí:

- **Heraldická / ilumino-rukopisová vrstva** — ornátové rohy a centrální diamondy na hranách panelů, double-stroke gold borders, top-of-page ornamental band v hlavičce
- **Ceremoniální typografie** — kaligrafické flourishe pod logem, výraznější section titulky s diamond-line motivem, script signature divider ve welcome card
- **Cobalt highlight orchestrace** — silnější glow na aktivním nav (`Úvodník`), cobalt PJ chip, cobalt highlight na „Projektu Ikaros." v nadpisu
- **Drobnosti** — beer ikona v Dimenzionální hospodě (vypadá jako trash → vizuální/CSS bug k ověření), `Zobrazit vše →` v zlaté „pill" kapsule

**Zásah je striktně omezen na selektor `[data-theme="modre-nebe"]`.** Ostatní themata zůstávají netknutá. Žádné globální tokeny, žádné nové komponenty (kromě **interních CSS pseudo-element ornamentů** přes inline SVG data-URI), žádné nové PNG/WebP soubory.

### Aesthetic direction (frontend-design skill)

**Aesthetic:** _illuminated manuscript × space-opera observatory_ — ornate gold filigree na deep midnight blue glass, kaligrafická typografie, ceremoniální heraldika. Inspirace: Pre-Raphaelite illuminated manuscripts × astrolabe brass × Versailles mirror hall. **Differentiating motif:** opakující se „diamond + horizontal gradient line" vokabulář napříč hlavičkou, panely, section titles a navigačními oddělovači — jediný unifying gesture.

### Co existuje a re-použijeme

- `IkarosLayout` (header + 3-sloupcový shell, drawer mobile) ✅
- `CornerOrnament` (4 pozice — `tl/tr/bl/br`) ✅ — modre-nebe ho aktuálně skrývá, **odkrýt a restylovat**
- `themes/themes/modre-nebe/{index.ts, decorations.css}` ✅
- `data-frame-panel="sidebar|right|card|novinky"` selektory ✅
- `data-andel-medallion` slot ✅
- Asset pipeline `npm run themes:optimize` ✅ (žádný nový asset, takže nepoužíváme)
- PJ badge logika v `IkarosLayout.tsx` ✅ (jen styling chip)
- Fonts: `Cinzel Decorative`, `Cinzel`, `Lora`, `Great Vibes` (v tokenech jako `--font-script`) ✅

### Co se mění

| Soubor | Druh změny | Rozsah |
|---|---|---|
| `themes/themes/modre-nebe/decorations.css` | **kompletní přepis** (z ~70 → ~280 řádků) | hlavní zásah |
| `themes/themes/modre-nebe/index.ts` | drobné token doplňky (ornament SVG fill var, header band height, divider colors) | ~10–15 nových řádků |
| `IkarosLayout.module.css` | volitelné drobné tweak proměnných (jen pokud je nutné odemknout overflow/spacing pro ornamenty) | minimal |
| `src/shared/ui/CornerOrnament/CornerOrnament.module.css` | **NIC** — ponecháno, modre-nebe override per `[data-theme]` selektorem | – |

### Co se NEMĚNÍ

- Žádná změna `CornerOrnament.tsx` (komponenta) ani její CSS modul (sdílená)
- Žádný nový React komponent
- Žádná změna `IkarosLayout.tsx` struktury (logika PJ badge / beer ikona / section titly už je)
- Žádný nový PNG/WebP soubor
- Žádná změna 20 ostatních themat
- Žádná změna BE, datových modelů, API, rout, textů
- Žádná změna `DashboardPage.tsx` ani `IkarosCard`

---

## 1. Cíl

Po načtení s `themeId === 'modre-nebe'` má UI vypadat jako **heraldicky orámovaný kosmický portál**:

1. **Header band** — full-width horizontal gold filigree under header (gradient line + central diamond), corner ornaments v levém/pravém horním rohu hlavičky
2. **Logo block** — větší andel medailon v kruhovém zlatém rámu vlevo, „Projekt Ikaros" calligraphic text + flourish underline (Cinzel Decorative + Great Vibes flourish glyph nebo SVG flourish)
3. **Panely (sidebar, right, welcome, novinky, chat-rooms)** — všechny dostanou:
   - 4× corner ornament (zlatý filigree SVG, ne jen rotated square jako dnes)
   - 2× center ornament (top + bottom horizontal edge — diamond + side gradient lines)
   - Inner double-stroke gold border (vnější + vnitřní rule)
4. **Section titles** (`NAVIGACE`, `VESMÍRY`, `CHAT (n)`, `MOJE SVĚTY`, …) — `◆ ━━━ TITLE ━━━ ◆` styl: vycentrované, uppercase, letter-spacing 0.18em, gold color, gradient lines po stranách s centrálními cobalt diamondy
5. **Nav items** (sidebar primary + worlds + chat rooms) — výraznější aktivní stav s cobalt left-edge accent + cobalt glow halo + světlejší text
6. **PJ chip** — cobalt-to-cyan gradient pill, gold border, světlý text, malé letter-spacing — styling existujícího `<span data-pj-badge>PJ</span>`
7. **Welcome card** — celý rámec heraldicky ornátový (corner + center ornaments), kaligrafický horizontal divider před signaturou, „Projektu Ikaros." cobalt highlight s glow
8. **Novinky card** — stejný ornátový rámec, ikona + nadpis + zlaté `+ PŘIDAT NOVINKU` button vpravo, prázdný stav text
9. **`Zobrazit vše →`** — zlatá ohraničená pill button-like kapsule, hover glow
10. **Active nav glow** — `Úvodník` (active route) má cobalt halo přes celé pole + glow text

**Mimo rozsah:** animované točení astrolabu, animované flourishe (statické ornamenty), externí SVG soubory (ornamenty inline jako data-URI v CSS), externí fonty navíc.

---

## 2. Design tokens — `themes/themes/modre-nebe/index.ts`

### Doplnit (cca 12 nových řádků)

```ts
// ── Ornament fill colors (use in inline SVG data-URI substitution) ──
'--ornament-gold':         '#d6aa45',
'--ornament-gold-bright':  '#ffd36a',
'--ornament-cyan':         '#25d0e6',

// ── Header band ──
'--header-band-h':         '4px',         // horizontal rule under header
'--header-divider-w':      '60%',         // šířka centrálního zlatého glow lines

// ── Panel double-stroke border inset ──
'--panel-inner-border':    'rgba(214, 170, 69, 0.32)',  // vnitřní rule, jemnější
'--panel-inner-inset':     '6px',                        // odstup vnitřního rule

// ── Section title divider gradient ──
'--section-divider':       'linear-gradient(90deg, transparent 0%, rgba(214,170,69,0.6) 50%, transparent 100%)',
```

Stávající luxury tokeny zůstávají beze změny (cobalt accent, glass surface, glow gold/cyan).

### Žádné token změny u ostatních témat

`index.ts` jiných themat se **nedotýká** — doplňky jsou pouze v `modre-nebe/index.ts`.

---

## 3. Decorations CSS — `themes/themes/modre-nebe/decorations.css`

**Kompletní přepis.** Aktuálně ~70 řádků; cíl ~280 řádků v 11 sekcích. Vše scoped přes `[data-theme="modre-nebe"]`.

### 3.1. Root + atmosférický overlay

Beze změny logiky — `background-color` fallback + `::before` viewport overlay s `var(--theme-bg-overlay)`.

### 3.2. Header band — full-width gold filigree under header

```
[data-theme="modre-nebe"] header {
  position: relative;
  border-bottom: 1px solid var(--theme-border-soft);
}

/* Gold gradient rule + center diamond above the rule */
[data-theme="modre-nebe"] header::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -1px;
  height: var(--header-band-h);
  background:
    /* central diamond (inline SVG data-URI, gold filigree) */
    center / 14px no-repeat
    url("data:image/svg+xml;utf8,<svg ...></svg>"),
    /* gradient rule */
    linear-gradient(90deg, transparent 0%, rgba(214,170,69,0.5) 30%, rgba(214,170,69,0.85) 50%, rgba(214,170,69,0.5) 70%, transparent 100%);
  pointer-events: none;
}
```

Plus 2× pseudo na rozích headeru (mnohem subtler než panely — jen filigree corner element):

```
[data-theme="modre-nebe"] header::before {
  /* TL + TR corner filigree — using mask/background combo s SVG data-URI */
  /* — alternativně dva oddělené wrappery, viz impl. plán */
}
```

**Impl. detail (do plánu):** zda použít jeden `::after` se dvěma `background-image` (left+right) NEBO přidat pomocný `<span>` ornaments do hlavičky. Prefere CSS-only.

### 3.3. Logo block

```
[data-theme="modre-nebe"] header [class*="logoImg"] {
  width: var(--asset-logo-w);  /* 220px */
  height: var(--header-h);
  background-image: var(--asset-logo);
  background-size: contain;
  background-position: left center;
  background-repeat: no-repeat;
}

/* Calligraphic flourish under logo wordmark — inline SVG na ::after */
[data-theme="modre-nebe"] header [class*="logo"]::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 8px;
  height: 8px;
  background: center / contain no-repeat
    url("data:image/svg+xml;utf8,<svg viewBox='0 0 240 8' ...><path d='M2 4 Q 60 0 120 4 T 238 4' stroke='gold' fill='none'/></svg>");
}
```

(Pokud `[class*="logo"]` na ::after vstoupí do konfliktu se Link href — řeší se `::after` na `[class*="logoImg"]` místo wrapper Linka. Detail pro impl. plán.)

### 3.4. Panely — double-stroke gold border + ornaments

```
[data-theme="modre-nebe"] [data-frame-panel="sidebar"],
[data-theme="modre-nebe"] [data-frame-panel="right"],
[data-theme="modre-nebe"] [data-frame-panel="card"],
[data-theme="modre-nebe"] [data-frame-panel="novinky"] {
  position: relative;
  background: var(--theme-surface);
  backdrop-filter: blur(8px);
  border: 1px solid var(--theme-border);
  border-radius: 18px;
  isolation: isolate;
  /* outer shadow (depth) + inset inner gold rule (double-stroke effect) */
  box-shadow:
    0 4px 24px rgba(0,0,0,0.55),
    inset 0 0 0 1px transparent,
    inset 0 0 0 7px transparent,
    inset 0 0 0 8px var(--panel-inner-border);
}

/* Top-center diamond + side gradient lines (replicates header band motif inside panel edges) */
[data-theme="modre-nebe"] [data-frame-panel="sidebar"]::before,
[data-theme="modre-nebe"] [data-frame-panel="right"]::before,
[data-theme="modre-nebe"] [data-frame-panel="card"]::before,
[data-theme="modre-nebe"] [data-frame-panel="novinky"]::before {
  content: '';
  position: absolute;
  top: -1px; left: 12%; right: 12%;
  height: 14px;
  background:
    center / 12px no-repeat
    url("data:image/svg+xml;utf8,<svg ...diamond...></svg>"),
    linear-gradient(90deg, transparent 0%, rgba(214,170,69,0.6) 25%, transparent 50%, rgba(214,170,69,0.6) 75%, transparent 100%);
  pointer-events: none;
}

/* Bottom mirror */
[data-theme="modre-nebe"] [data-frame-panel="..."]::after { /* analogous, bottom: -1px */ }
```

### 3.5. CornerOrnament — modre-nebe variant (un-hide + restyle)

**Klíčová změna oproti stávajícímu stavu** — dnes modre-nebe schovává `[class*="ornament"] { display: none }`. **Smaže se** to pravidlo.

Místo rotated square diamondu se na corner přidá **inline SVG data-URI** (zlatý filigree corner ornament — tvar např. tří soustředných `L`-shape arc fragmentů s rosetkou):

```
[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"] {
  display: block;
  width: 32px;
  height: 32px;
  background: center / contain no-repeat
    url("data:image/svg+xml;utf8,<svg viewBox='0 0 32 32'>...filigree corner glyph...</svg>");
  /* default position (TL) — others rotated via [data-position] */
}
[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"][data-position="tr"] { transform: scaleX(-1); }
[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"][data-position="bl"] { transform: scaleY(-1); }
[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"][data-position="br"] { transform: scale(-1, -1); }
```

(`data-position` je už v `CornerOrnament.tsx` na ř. 14 — je to public API komponenty, žádná změna komponenty není nutná.)

### 3.6. Section title — `◆ ━━━ TITLE ━━━ ◆`

```
[data-theme="modre-nebe"] [class*="sectionTitle"] {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--theme-heading);
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  text-shadow: 0 0 10px var(--theme-glow-gold);
  padding: 8px 0;
}

[data-theme="modre-nebe"] [class*="sectionTitle"]::before,
[data-theme="modre-nebe"] [class*="sectionTitle"]::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--section-divider);
  position: relative;
}

/* small cyan diamond at line ends (inline SVG fill cobalt) */
/* Implementation detail: SVG data-URI s paths v ::before/::after pomocí background overlay */
```

### 3.7. Nav items + active state

```
[data-theme="modre-nebe"] [class*="navItem"] {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--theme-border-soft);
  border-radius: 10px;
  background: rgba(8, 14, 28, 0.45);
  color: var(--theme-text);
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.82rem;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 200ms ease, color 160ms ease;
}

[data-theme="modre-nebe"] [class*="navItem"]:hover {
  border-color: var(--theme-border);
  background: var(--theme-nav-hover-bg);
  box-shadow: inset 3px 0 0 var(--theme-accent-bright);
}

[data-theme="modre-nebe"] [class*="navItemActive"] {
  background: var(--theme-nav-active-bg);
  border-color: var(--theme-border-cyan);
  color: var(--theme-text);
  box-shadow:
    inset 3px 0 0 var(--theme-accent-cyan),
    0 0 18px var(--theme-glow-cyan);
}

[data-theme="modre-nebe"] [class*="navItemActive"] [class*="navItemIcon"] {
  filter: drop-shadow(0 0 8px var(--theme-glow-cyan));
  color: var(--theme-accent-cyan);
}
```

### 3.8. PJ badge

```
[data-theme="modre-nebe"] [data-pj-badge] {
  display: inline-flex; align-items: center;
  height: 18px;
  padding: 0 7px;
  margin-left: 8px;
  border: 1px solid var(--theme-border-cyan);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(37,208,230,0.30), rgba(37,208,230,0.10));
  color: var(--theme-accent-bright);
  font-family: var(--font-display);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  box-shadow: 0 0 10px var(--theme-glow-cyan);
}
```

### 3.9. Welcome card — heraldic frame + script divider + cobalt highlight

```
/* Welcome card uses [data-frame-panel="card"] — dostane stejné corner+center ornaments z 3.4/3.5 */

/* Andel medallion — beze změny rozměrů, jen vyšší glow */
[data-theme="modre-nebe"] [data-andel-medallion] {
  width: 220px; height: 235px;
  background-image: var(--asset-andel-medallion);
  background-size: contain; background-repeat: no-repeat; background-position: center;
  filter: drop-shadow(0 0 22px var(--theme-glow-gold));
}

/* "Projektu Ikaros." cobalt highlight — span s class .titleAccent (existuje v DashboardPage.module.css?) */
[data-theme="modre-nebe"] [class*="titleAccent"] {
  color: var(--theme-accent-cyan);
  text-shadow: 0 0 14px var(--theme-glow-cyan);
}

/* Script divider before signature */
[data-theme="modre-nebe"] [class*="welcome"] [class*="signature"]::before {
  content: '';
  display: block;
  margin: 18px auto 12px;
  width: 60%;
  height: 12px;
  background: center / contain no-repeat
    url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 12'><path d='M2 6 Q60 0 100 6 T 198 6' stroke='%23d6aa45' fill='none' stroke-width='1'/><circle cx='100' cy='6' r='2' fill='%2325d0e6'/></svg>");
  opacity: 0.85;
}

[data-theme="modre-nebe"] [class*="signature"] {
  font-family: var(--font-script);
  font-size: 1.5rem;
  color: var(--theme-accent-cyan);
  text-align: center;
}
```

**Impl. ověření:** přesné názvy class na DashboardPage welcome card (`titleAccent`, `signature`) — viz `src/pages/DashboardPage/DashboardPage.module.css`. Pokud se liší, plán je aktualizuje. Pokud span `.titleAccent` neexistuje, doplnit ho do JSX (jednořádková změna v `DashboardPage.tsx`).

### 3.10. „Zobrazit vše →" zlaté pill kapsle

```
[data-theme="modre-nebe"] [class*="showAllLink"] {
  display: inline-flex; align-items: center;
  margin-top: 8px;
  padding: 6px 14px;
  border: 1px solid var(--theme-border);
  border-radius: 999px;
  background: rgba(214, 170, 69, 0.06);
  color: var(--theme-accent-bright);
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: background 160ms, box-shadow 200ms;
}

[data-theme="modre-nebe"] [class*="showAllLink"]:hover {
  background: rgba(214, 170, 69, 0.14);
  box-shadow: 0 0 14px var(--theme-glow-gold);
}
```

### 3.11. Header buttons (POŠTA, UŽIVATELÉ, theme switcher, TYKY, ODHLÁSIT)

```
[data-theme="modre-nebe"] [class*="headerBtn"] {
  border: 1px solid var(--theme-border-soft);
  background: rgba(5, 10, 24, 0.55);
  border-radius: 10px;
  padding: 8px 14px;
  font-family: var(--font-display);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--theme-text);
  transition: border-color 160ms, box-shadow 200ms, background 160ms;
}

[data-theme="modre-nebe"] [class*="headerBtn"]:hover {
  border-color: var(--theme-border);
  box-shadow: 0 0 12px var(--theme-glow-gold);
  background: rgba(214, 170, 69, 0.08);
}

[data-theme="modre-nebe"] [class*="headerBtnActive"] {
  border-color: var(--theme-border-cyan);
  box-shadow: 0 0 12px var(--theme-glow-cyan);
}
```

---

## 4. Komponentové změny — minimální

### `IkarosLayout.tsx`

**Bez změny.** Logika beer ikony, PJ badge, section titlů — všechno už je. Jen pokud se při impl. potvrdí, že ikona Beer renderuje špatně (vypadá jako trash):
- ověř import `Beer` z `lucide-react` (ř. 17 — OK)
- ověř, že je `<Beer size={18} />` viditelná → je možné, že v current screenshotu byla špatná velikost / barva přes CSS, opraví se v 3.7 / 3.11 styling

### `DashboardPage.tsx`

**Možná drobnost.** Pokud span s class `titleAccent` ještě neobaluje text „Projektu Ikaros." nebo class `signature` neexistuje na podpisové větě — drobná JSX úprava (jeden span). Ověřit při impl. plánu.

### `CornerOrnament.tsx` + `CornerOrnament.module.css`

**Žádná změna.** Modre-nebe override jen přes `[data-theme="modre-nebe"]` selektor v decorations.css.

---

## 5. Assety

**Žádné nové assety.** Všechny ornamenty (corner filigree, center diamond, header band, calligraphic flourish, script divider) jsou **inline SVG data-URI v CSS** — žádný nový soubor v `public/themes/...`.

Stávající `public/themes/modre-nebe/decor/{logo.webp, andel-medallion.webp}` zůstávají beze změny.

---

## 6. Responsive

Dodržet pravidla z `base.md`:
- Mobile ≤768px: drawer sidebar + jednoduchý header band (corner ornaments hlavičky se schovají, jen středový diamond)
- Tablet 769–1024px: 2-sloupcový (sidebar + main), pravý panel pod
- Desktop >1024px: plný 3-sloupcový s ornaments na každém panelu

Center top/bottom ornaments na panelech: na mobilu menší (8px diamond místo 12px), aby nepůsobily přeplněně.

**Po dokončení implementace povinně skill `mobil-desktop`** dle base.md.

---

## 7. Akcepční kritéria

Implementace je hotová pouze pokud:

1. ✅ Po `?theme=modre-nebe` se UI vizuálně přibližuje obrázku 1 z chatu:
   - Header má gold gradient rule + central diamond pod sebou
   - Logo: andel medallion + Cinzel Decorative wordmark + flourish underline
   - Všechny panely (sidebar, right, welcome, novinky) mají 4× corner filigree + 2× center diamond + double-stroke inner border
   - Section titulky `◆ ━━ NAVIGACE ━━ ◆` (gold gradient lines + cobalt diamondy)
   - `Úvodník` aktivní stav: cobalt halo + cobalt edge accent + ikona glow
   - PJ chip cobalt-cyan gradient pill
   - Welcome card: cobalt highlight „Projektu Ikaros.", script divider, Great Vibes signatura
   - `Zobrazit vše →` jako zlatá pill kapsle
   - Header tlačítka uppercase letter-spacing, gold border, hover gold glow
2. ✅ Beer ikona u „Dimenzionální hospoda" je viditelná jako Beer (ne trash)
3. ✅ Mobile ≤768px se nic nerozbije, drawer + sloupce pod sebou, ornamenty graceful
4. ✅ Tablet 769–1024px funguje
5. ✅ Ostatních 20 témat je netknutých (vizuální regrese 0)
6. ✅ Žádná změna BE, datových modelů, API, rout, textů
7. ✅ Žádný nový PNG/WebP soubor
8. ✅ Žádné nové globální `:root` tokeny ani globální CSS třídy (vše scoped)
9. ✅ Žádná změna `CornerOrnament.tsx` ani jeho `.module.css`
10. ✅ `npm run lint`, `npm run lint:colors`, `npm run test:run`, `npm run build`
11. ✅ `mobil-desktop` skill po implementaci

---

## 8. Otevřené body / risks

| # | Risk | Mitigace |
|---|---|---|
| R1 | Class selektory `[class*="..."]` jsou křehké (CSS Modules hashing) | Existující kód už pattern používá (decorations.css ř. 42) — ověřeno, že Vite produkční build hash zachová substring; pokud ne, fallback na `data-frame-panel`/`data-pj-badge`/přidat data-* atributy v JSX |
| R2 | Inline SVG data-URI v CSS jsou dlouhé řádky | Akceptovatelné — single-purpose CSS soubor, lepší než 4 nové soubory v `public/`; budeme používat `%23` místo `#` pro Firefox bezpečnost |
| R3 | `CornerOrnament` má sdílený `position: absolute` v module.css — restyling jen přes background-image | Není konflikt — module CSS zachovává pozicování + size; modre-nebe override jen přidá `background-image` a transform |
| R4 | Beer ikona malá/podobná trash | Stačí ověřit `size={18}` (kód má), případně zvětšit přes `[data-theme="modre-nebe"] [class*="navItemIcon"] svg { width: 20px }` |
| R5 | `titleAccent` / `signature` class neexistuje v DashboardPage | Při impl. plánu zjistit; pokud chybí, přidat span do JSX (drobnost ~2 řádky) |
| R6 | `backdrop-filter: blur(8px)` + těžké pseudo-elementy → výkon | Měříme — pokud při motion/scroll padá FPS < 50, zmenšíme blur na 6px nebo přesuneme ornament na samostatný `will-change: transform` layer |
| R7 | Inline SVG ornaments musí ladit aesthetic — generic „diamond" vypadá kýčovitě | Frontend-design skill: filigree corner = víceřádková křivková kompozice (ne čtverec), tvar inspirován art nouveau / illuminated manuscript corner pieces; cobalt diamond v centrech jako kontrast |
| R8 | Vyšší specificita `[data-theme="modre-nebe"]` přebíjí utility classes — riziko odlomení | Změny **přidávají** vlastnosti, neodebírají; existující app má modre-nebe jako pilot, takže příklady přebití existují |

---

## 9. Implementační orchestrace (multi-agent rozdělení)

Spec je rozdělitelný do 4 paralelních work streamů, které mohou běžet jako oddělení agenti v impl. plánu:

| Stream | Scope | Soubory |
|---|---|---|
| **A — Tokens + base panely** | sekce 2, 3.1, 3.4, 3.5 | `index.ts`, `decorations.css` (sekce A) |
| **B — Header + logo** | sekce 3.2, 3.3, 3.11 | `decorations.css` (sekce B) |
| **C — Section titles + nav + PJ + Zobrazit vše** | sekce 3.6, 3.7, 3.8, 3.10 | `decorations.css` (sekce C) |
| **D — Welcome card + signature + DashboardPage drobnost** | sekce 3.9, případná JSX úprava | `decorations.css` (sekce D), volitelně `DashboardPage.tsx` |

V `plan-1.0f.md` rozpracujeme přesné diff-y a sekvenci. Inline SVG ornament glyfy (corner filigree, central diamond, header flourish, script divider) navrhne stream D s frontend-design wisdom; ostatní streamy je pak aplikují.

---

## 10. Po dokončení

- Zaškrtnout v `roadmap-fe.md` — nový bod **1.0f — Modré nebe heraldic upgrade**
- Volitelně doplnit `purpose.md`, `decisions.md`, `ai-notes.md`
- Případné dluhy v `docs/dluhy.md` (např. R1 → trvalejší fix přes data-* attribut hooks v JSX, pokud `[class*=...]` selhá v build)

---

**Schválení:** ⏳ Čeká na PJ. Po souhlasu napíšu **`plan-1.0f.md`** s konkrétními diff-y, inline SVG glyfy a sekvencí kroků (vč. paralelního multi-agent rozvržení). Teprve po schválení plánu začnu kód.
