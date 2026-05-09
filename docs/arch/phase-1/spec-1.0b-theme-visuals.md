# Spec 1.0b — Luxusní vizuál pilotního tématu „Modré nebe"

**Datum:** 2026-05-07
**Status:** ⏳ Čeká na schválení
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.0b
**Závisí na:** 1.0 (theme infrastruktura) ✅, 1.1 (Login + IkarosLayout shell) ✅
**Blokuje:** 1.0c (replikace na zbylých 20 témat)

---

## 0. Změna strategie oproti v1

Předchozí verze tohoto specu (commit `a54ebaa^`) navrhovala vyřezávat UI prvky (frame rámečky, header ikony, nav ikony, section dividery) z PNG `docs/themes/assets/Modré nebe.png` skriptem `extract-theme-decor.mjs` a vrstvit je zpět jako PNG překryvy nad HTML panely. Tento přístup byl implementován částečně a vede k vzhledu, který **nefunguje** — extrahované UI fragmenty působí jako lacino slepený screenshot, ne jako skutečný design.

**Nová strategie:** background obrázek (`/themes/backgrounds/modre-nebe.webp`) zůstává jediný PNG asset nesoucí atmosféru. Veškeré UI (panely, rámečky, tlačítka, ikony, dividery) se kreslí přes **skutečné HTML/CSS** — `border` + `box-shadow` + `backdrop-filter` + `pseudo-elements` + SVG ornamenty + lucide-react ikony. Výsledek je luxusní fantasy/sci-fi observatoř s glass-metallic panely, zlatým a tyrkysovým glow, ne montovaný screenshot.

### Co se ze starého přístupu zachovává

| Asset | Důvod | Cesta |
|---|---|---|
| `decor/logo.webp` | Anděl + wordmark „Projekt Ikaros" — vizuálně silná postava, CSS by ji nereplikoval | `public/themes/modre-nebe/decor/logo.webp` |
| `decor/andel-medallion.webp` | Anděl jako medailonek uvnitř welcome card | `public/themes/modre-nebe/decor/andel-medallion.webp` |
| `backgrounds/modre-nebe.webp` | Atmosféra — kosmické pozadí | `public/themes/backgrounds/modre-nebe.webp` |

### Co se zahazuje

| Asset / přístup | Náhrada |
|---|---|
| `decor/sidebar-frame-{top,bottom}.webp`, `right-frame-*`, `card-frame-*`, `novinky-frame-*` | CSS-native panel: `border` + `box-shadow inset cyan/gold glow` + SVG corner ornaments |
| `decor/header-icon-*.webp`, `nav-icon-*.webp` | `lucide-react` ikony (Mail, Users, Crown, …) — už v `IkarosLayout.tsx` je |
| `decor/section-divider.webp` | CSS `::before/::after` se zlatým gradient line + symbol „✦" |
| `scripts/extract-theme-decor.mjs` | Smaže se. Zůstává jen `themes:optimize` pro background komprimaci. |

### Co se mění oproti dnešnímu (commit `a54ebaa`) stavu

- Color tokeny v `themes/themes/modre-nebe/index.ts` se přeladí na luxusnější paletu (gold `#d6aa45`, cyan `#25d0e6`, hluboké navy povrchy, glow varianty).
- `decorations.css` se přepíše — pryč s `--asset-*-frame-*` overlay, místo toho glass + SVG corners.
- `IkarosLayout.module.css` doladí glass-card vzhled welcome a novinky karet.
- `DashboardPage.tsx` (welcome + novinky) přejde na nové komponenty `IkarosCard` se signaturou v Great Vibes fontu.
- Přidáme Google Font import: `Great Vibes` (Cinzel a Lora už jsou).

---

## 1. Cíl

Pilotní téma `modre-nebe` má po načtení vypadat jako luxusní fantasy/sci-fi observatoř:
- tmavě modré kosmické pozadí (existující background)
- glass/metallic panely s gold + cyan akcenty
- 3D zaoblená tlačítka s gold/cyan glow (existující `btn3d` systém)
- ornamentální rohy panelů přes CSS/SVG
- typografie: Cinzel (nadpisy), Lora (text), Great Vibes (podpisy)
- žádný UI screenshot, žádné PNG fragmenty UI

**Mimo rozsah:** zbylých 20 témat (kopie šablony v 1.0c), animované atmosférické efekty (svíčky, padající listí), funkcionalita.

---

## 2. Color/Token model

V `src/themes/themes/modre-nebe/index.ts` v `vars` přidat / upravit:

```ts
// ── Background ──
'--theme-bg-overlay':   'linear-gradient(rgba(2,7,18,0.45), rgba(2,7,18,0.65))',

// ── Surfaces (glass) ──
'--theme-surface':         'rgba(3, 14, 30, 0.72)',
'--theme-surface-strong':  'rgba(2, 8, 18, 0.88)',
'--theme-surface-soft':    'rgba(12, 35, 65, 0.45)',

// ── Borders ──
'--theme-border':       'rgba(214, 170, 69, 0.72)',
'--theme-border-soft':  'rgba(214, 170, 69, 0.35)',
'--theme-border-cyan':  'rgba(37, 208, 230, 0.55)',

// ── Text ──
'--theme-text':         '#f4ead0',
'--theme-text-muted':   '#c9b98a',
'--theme-heading':      '#ffd36a',

// ── Accents ──
'--theme-accent':       '#d6aa45',
'--theme-accent-bright':'#ffd36a',
'--theme-accent-cyan':  '#25d0e6',

// ── Glow / shadow ──
'--theme-glow-gold':    'rgba(214, 170, 69, 0.42)',
'--theme-glow-cyan':    'rgba(37, 208, 230, 0.38)',
'--theme-shadow':       'rgba(0, 0, 0, 0.75)',
```

Stávající legacy tokeny (`--bg-primary`, `--accent`, …) se mapují na nové (např. `--accent: var(--theme-accent)`) aby zbytek aplikace nepadl. Cleanup legacy tokenů je úkol pro 1.0c.

---

## 3. Typografie

Google Fonts přes `@import` v `src/styles/index.css` (Cinzel + Lora už tam jsou, přidat Great Vibes):

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@400;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Great+Vibes&display=swap');
```

Tokeny v `modre-nebe/index.ts`:

```ts
'--font-logo':    '"Cinzel Decorative", "Cinzel", Georgia, serif',
'--font-display': '"Cinzel", Georgia, serif',
'--font-body':    '"Lora", Georgia, serif',
'--font-script':  '"Great Vibes", "Brush Script MT", cursive',
```

Použití:
- `--font-logo` — wordmark v headeru (zatím PNG, font je fallback při missing assetu)
- `--font-display` — H1/H2, sekční nadpisy, button labels (existující `btn3d` má `var(--font-display)`)
- `--font-body` — odstavce, běžný text
- `--font-script` — podpis administrátorů uvnitř welcome card („Příjemnou zábavu přeje administrátor")

---

## 4. Layout

### 4.1 Shell + background

Současný `IkarosLayout.tsx` už nastavuje `backgroundImage` z `theme.background` přes inline style. Přidáme přes `decorations.css` overlay pseudo-element nad background pro lepší čitelnost UI:

```css
[data-theme="modre-nebe"] .shell::before {
  content: '';
  position: fixed; inset: 0;
  background: var(--theme-bg-overlay);
  pointer-events: none;
  z-index: 0;
}
```

(Header, body, panely mají vyšší `z-index`.)

### 4.2 Grid

ChatGPT návrh: `grid-template-columns: 320px minmax(720px, 1fr) 320px` s gap 28px a paddingem 32px 48px.

Stávající: `var(--sidebar-w, 240px) 1fr 240px` s `--sp-4` gap a paddingem.

**Rozhodnutí:** doladit na `280px 1fr 280px` (kompromis — 320 ujídá moc středu na 1440 monitoru, 240 je málo). Přepsat `--sidebar-w: 280px`. Gap zachovat `--sp-4` (16px), padding `--sp-5` (24px). Na 1920×1080 to dá střed cca 1280px — víc než dost.

Responsive zachovat:
- ≤1024 px: skrýt right panel, sidebar 240px
- ≤768 px: drawer sidebar, jeden sloupec

---

## 5. Komponenty — vizuální změny

### 5.1 Header

**Co máme:** gold underline (`::after` linear-gradient), backdrop-filter blur, 3D headerBtn s lucide ikonami.
**Co přidat:**
- `backdrop-filter: blur(12px)` (dnes 8px) + `background: linear-gradient(180deg, rgba(2,8,20,0.92), rgba(8,18,42,0.78))`
- Logo: zvětšit a doladit drop-shadow `filter: drop-shadow(0 0 12px var(--theme-glow-gold))`
- Header buttons: doladit `--btn-border` na `var(--theme-border-soft)` v inactive, `var(--theme-accent)` v hover, `var(--theme-accent-cyan)` glow v active

### 5.2 Sidebar + Right panel

**Cíl:** glass panel, gold border, vnitřní cyan glow, ornament rohy.

```css
[data-theme="modre-nebe"] [data-frame-panel="sidebar"],
[data-theme="modre-nebe"] [data-frame-panel="right"] {
  background: var(--theme-surface);
  backdrop-filter: blur(8px);
  border: 1px solid var(--theme-border);
  border-radius: 22px;
  box-shadow:
    0 24px 70px var(--theme-shadow),
    inset 0 0 30px var(--theme-glow-cyan),
    inset 0 0 20px var(--theme-glow-gold);
}
```

**SVG corner ornaments** přes 4 pseudo-elementy nebo jeden SVG mask. Návrh: jeden inline SVG do React komponenty `<PanelFrame>` s 4 rohy (~32×32 px) ve zlaté linii — minimalistický „art-deco" detail. Soubor `src/components/layout/PanelFrame/CornerOrnament.tsx`.

### 5.3 Sekční nadpisy

Stávající `.sectionTitle` má `::before/::after` jako gold gradient lines. Doladit:
- Přidat symbol „✦" před a za text (Unicode, žádný asset)
- `text-shadow: 0 0 12px var(--theme-glow-gold)`
- `font-size: 11px; letter-spacing: 0.28em`

### 5.4 Nav items + Show all link + Right add btn

**Beze změny struktury** — composes `btn3d`. Jen v `btn3d` doladit barvy přes nové tokeny.

### 5.5 Welcome card (Úvodník)

Nová komponenta `<IkarosCard>` v `src/components/ui/IkarosCard/`:

```tsx
<IkarosCard variant="welcome">
  <div className={s.medallion} aria-hidden />
  <div className={s.body}>
    <h2>Vítej v <span className="accent">Projektu Ikaros</span>.</h2>
    <p>…</p>
    <p>…</p>
    <p className={s.signature}>Příjemnou zábavu přeje administrátor.</p>
  </div>
</IkarosCard>
```

CSS:
- panel: `glass` (stejné tokeny jako sidebar), `border-radius: 22px`, padding `48px 56px`
- `::before` jemný cyan top highlight (`linear-gradient(180deg, rgba(37,208,230,0.18), transparent 30%)`)
- `::after` gold spodní linka
- 4 rohové SVG ornamenty (`<CornerOrnament position="tl" />` …)
- medallion vlevo: `200×240 px`, `background-image: var(--asset-andel-medallion)`, gold frame border + glow
- H2: `font-family: var(--font-display)`, gold, slova „Projekt Ikaros" v cyan
- signature: `font-family: var(--font-script)`, `font-size: 28px`, accent cyan, italic, text-align center

### 5.6 News card („Novinky")

Druhý `<IkarosCard variant="news">` pod welcome card. Stejný glass jazyk, nižší padding (`32px 40px`). Header s nadpisem „Novinky" vlevo + tlačítko „+ Přidat novinku" (`btn3dPrimary`) vpravo. Empty state „Zatím žádné novinky."

---

## 6. Implementační kroky

### Krok 1 — Cleanup (drop PNG-extraction přístup)
- [ ] Smazat `scripts/extract-theme-decor.mjs`, `scripts/theme-recon*.mjs`
- [ ] Smazat `public/themes/modre-nebe/decor/{sidebar,right,card,novinky}-frame-*.webp`, `header-icon-*.webp`, `nav-icon-*.webp`, `section-divider.webp`
- [ ] **Zachovat** `public/themes/modre-nebe/decor/logo.webp`, `andel-medallion.webp`
- [ ] Z `modre-nebe/index.ts` `vars` smazat `--asset-{sidebar,right,card,novinky}-frame-*`
- [ ] Z `decorations.css` smazat všechny `[data-frame-panel="…"]::before/::after` s `--asset-*-frame-*`

### Krok 2 — Color tokeny + fonty
- [ ] V `src/styles/index.css` doplnit Google Fonts `@import` o `Great Vibes`
- [ ] V `themes/themes/modre-nebe/index.ts` přidat `--theme-*` tokeny (sekce 2)
- [ ] Doladit legacy mapping (`--accent: var(--theme-accent)` atd.) ať zbytek apky nepadne
- [ ] Přidat `--font-script` token

### Krok 3 — Glass panely + corner ornaments
- [ ] Vytvořit `src/components/layout/PanelFrame/CornerOrnament.tsx` s SVG (4 varianty — tl/tr/bl/br) nebo jeden symetrický s rotací
- [ ] V `IkarosLayout.tsx` přidat 4× `<CornerOrnament>` do sidebar + right panel + drawer sidebar
- [ ] V `decorations.css` přepsat sidebar/right glass styling (sekce 5.2)
- [ ] Ověřit že drawer overlay na mobilu vypadá konzistentně

### Krok 4 — IkarosCard + DashboardPage
- [ ] Vytvořit `src/components/ui/IkarosCard/IkarosCard.{tsx,module.css}` s variantami `welcome` a `news`
- [ ] Refaktorovat `pages/ikaros/DashboardPage.tsx` na `<IkarosCard>` komponenty
- [ ] Welcome card medallion: použít existující `--asset-andel-medallion`
- [ ] Signature s `var(--font-script)`

### Krok 5 — Header doladění
- [ ] V `IkarosLayout.module.css` zvětšit blur, doladit gradient
- [ ] Logo `filter: drop-shadow` glow
- [ ] V `btn3d` doladit barvy přes `--theme-*` tokeny

### Krok 6 — Sekční nadpisy
- [ ] Přidat „✦" symbol kolem `.sectionTitle` textu
- [ ] Doladit gold gradient lines

### Krok 7 — Verifikace
- [ ] `npm run build` projde bez chyb
- [ ] `npm run dev` + manuální procházka: anonymní úvodník + přihlášený úvodník
- [ ] Skill `mobil-desktop` (mobile 375px, tablet 768px, desktop 1440px)
- [ ] Screenshoty před/po do `pilot-9-luxury-after.png` k uložení
- [ ] `lint:colors` projde (žádné hardcoded hex mimo theme tokeny)

---

## 7. Otevřené body

1. **Corner ornament design.** Navrhuju art-deco V tvar (dvě zlaté linie sbíhající se do rohu, jemný cyan dot). Pokud máš preferenci (např. složitější ornament typický pro fantasy), pošli referenční obrázek a doladím SVG.
2. **Lora vs Inter pro body text.** ChatGPT návrh navrhuje Inter. Lora už v projektu je a má lepší fantasy charakter. Návrh: zůstat u Lora, přepnout na Inter jen pokud Lora nesedí (a tehdy v 1.0c).
3. **Sidebar šířka 280 vs 320.** Defaultně 280px, lze hot-fixnout na 320px po vizuální kontrole na 1920×1080.
4. **Animace glow pulse.** Dnešní `decorations.css` má `@keyframes modre-nebe-glow` na welcome card. Zachovat? Doporučuju ano, ale jemnější (`8s` → `12s`, snížit amplitudu) + pod `prefers-reduced-motion: no-preference`.

---

## 8. Definice hotovo (DoD)

- [ ] Vizuál `modre-nebe` po implementaci působí jako luxusní fantasy/sci-fi observatoř (subjektivní — schválí uživatel)
- [ ] Žádné PNG UI fragmenty (`scripts/extract-theme-decor.mjs` smazán, `decor/{frame,icon}*` neexistují)
- [ ] Background načten z `/themes/backgrounds/modre-nebe.webp`, overlay přes pseudo-element
- [ ] `npm run build` projde
- [ ] `npm run lint:colors` projde
- [ ] Mobile (drawer 375px) funguje, right panel skryt na ≤1024px
- [ ] Skill `mobil-desktop` proběhne bez issues
- [ ] Bundle assetů `public/themes/modre-nebe/` ≤ 200 KB (jen logo + medallion + background mimo)
- [ ] Roadmap zaškrtnuto 1.0b ✅, 1.0c (replikace) zařazeno
