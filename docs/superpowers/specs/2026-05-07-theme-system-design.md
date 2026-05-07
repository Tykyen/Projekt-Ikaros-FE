# Spec: Globální theme systém (fáze 1.0)

**Datum:** 2026-05-07
**Stav:** Návrh k schválení
**Roadmap:** [roadmap-fe.md](../../roadmap-fe.md) — fáze 1.0
**Theme dokumentace:** [docs/themes/](../../themes/)

---

## Cíl

Implementovat globální systém vizuálních témat ("skinů") pro celou platformu Ikaros. Uživatel si v dropdownu v hlavičce vybere jedno z **21 předdefinovaných témat**, které kompletně mění vzhled aplikace — barvy, písma, ornamentiku, animace i pozadí.

Architektura musí počítat s budoucí fází 5.0 (světová témata — každý vesmír má vlastní vzhled nezávislý na uživatelově globálním tématu).

## Rozsah fáze 1.0

**V rozsahu:**
- Theme infrastruktura (registry, provider, switcher, persistence)
- Implementace všech 21 platformových témat (CSS proměnné + dekorativní vrstva)
- Theme switcher dropdown v hlavičce
- Lazy-load fontů a dekorací per téma
- Hybridní persistence (localStorage + BE user account)
- Pre-hydration script pro `data-theme` (žádný FOUT)
- Auto-disable animací pod `prefers-reduced-motion`
- Background image pipeline (PNG → optimalizovaný WebP)
- Dropdown s thumbnaily, scrollable, mobile bottom-sheet
- Architektura připravena pro fázi 5.0 (theme scope na úrovni layoutu)
- Storybook s theme decoratorem
- Migrace existujících komponent na nové theme tokeny

**Mimo rozsah:**
- User-defined custom témata
- Theme preview před aplikací (hover = preview)
- Time-of-day automatické přepínání tématu
- Per-page tematické výjimky
- Implementace world themes (architektura připravena, ale prázdná)
- BE endpoint `PATCH /api/users/me/theme` — koordinace s BE separátně, FE se chová odolně i když endpoint chybí

---

## 1. Theme Model

### 1.1 TypeScript shape

```ts
// src/themes/types.ts

export type ThemeId =
  | 'modre-nebe' | 'zlaty-standard' | 'sci-fi' | 'bila'
  | 'vesmirna-lod' | 'priroda' | 'pergamen' | 'nemrtvi'
  | 'ctyri-zivly' | 'vesmirna-bitva' | 'hospoda' | 'severske-runy'
  | 'indiane' | 'africke' | 'arabsky-svet' | 'kyberpunk'
  | 'postapo' | 'temna-cerven' | 'magie' | 'mesic' | 'slunce';

export type ThemeScope = 'platform' | 'both';
//  'platform' = pouze pro Ikaros + Auth layouty
//  'both'     = i pro World layout (default)

export type ThemeFonts = {
  display?: string;   // velké nadpisy a logo (lazy)
  logo?: string;      // jen logo (lazy)
  body?: string;      // tělo textu (preferně z base preload)
};

export type Theme = {
  id: ThemeId;
  name: string;                                  // 'Modré nebe' (cs lokalizace)
  scope: ThemeScope;
  atmosphere: string;                            // 1 věta pro tooltip
  vars: Record<string, string>;                  // { '--bg-primary': '#0a1428', ... }
  fonts: ThemeFonts;
  thumbnail: string;                             // '/themes/thumbnails/modre-nebe.webp'
  background: string | null;                     // '/themes/backgrounds/modre-nebe.webp' nebo null
  decorationsModule: () => Promise<unknown>;     // dynamic import .css
  reducedMotion?: 'safe' | 'heavy';              // 'heavy' = pod prefers-reduced-motion plně off
};
```

### 1.2 Registry

`src/themes/registry.ts` exportuje:

```ts
export const THEMES: Record<ThemeId, Theme>;
export const DEFAULT_THEME: ThemeId = 'modre-nebe';
export function getTheme(id: ThemeId | string): Theme;       // s fallbackem na DEFAULT_THEME
export function listThemes(scope?: ThemeScope): Theme[];     // pro switcher
```

Každé téma má vlastní soubor `src/themes/themes/<id>/index.ts` který exportuje `Theme` objekt — registry je jen agregát.

### 1.3 Theme metadata source of truth

Designerská specifikace tématu (atmosféra, paleta, ornamenty) je v `docs/themes/<id>.md`. Tento soubor je human-readable kontrakt; když chceš změnit barvu nebo přidat efekt, nejdřív se aktualizuje `.md`, pak se synchronizuje implementace.

---

## 2. Styling architektura

### 2.1 Vrstvy CSS proměnných

| Vrstva | Soubor | Obsah | Zdroj |
|--------|--------|-------|-------|
| **Strukturální tokeny** | `src/themes/_shared/tokens.css` | spacing, radius, z-index, transitions, header-h, sidebar-w | Globální, neměnný napříč tématy |
| **Tematické tokeny** | `src/themes/themes/<id>/index.ts` (`vars` field) | barvy, gradienty, glows, font-family hooks | Per téma, scope-aware |
| **Dekorace** | `src/themes/themes/<id>/decorations.css` | `[data-theme="<id>"]` selektory s ornamenty, animacemi, ::before/::after | Per téma, lazy-load |

### 2.2 Aplikace tematických tokenů

Tokeny se aplikují přes `style.setProperty('--bg-primary', '#...')` na element s `data-theme` atributem. Decorace se přilévají přes statický CSS (lazy-loaded), který používá selektor `[data-theme="<id>"] .selector { ... }`.

### 2.3 Komponenty

**Železné pravidlo:** komponenty (Button, Card, Panel, Input, Modal, NavItem, ...) **nikdy nepoužívají hardcoded barvy**. Vždy přes `var(--token)`. Pokud je potřeba theme-specifický override, řeší se v `decorations.css` daného tématu, ne v komponentě.

### 2.4 Required theme tokens (povinný kontrakt)

Každé téma **musí** definovat alespoň následující CSS proměnné, jinak komponenty nebudou fungovat. Validuje se v `registry.ts` build-time skriptu.

```
--bg-primary, --bg-secondary, --bg-card, --bg-card-hover
--accent, --accent-bright, --accent-dim
--text-primary, --text-secondary, --text-muted
--border, --border-strong
--success, --warning, --danger, --info
```

Volitelné (theme-specifické, např. `--accent-blood`, `--accent-toxic`) — komponenty je nepoužívají, ale dekorace ano.

### 2.5 Background image

Aplikuje se na top-level layout `<div data-theme=...>` přes inline style:

```jsx
<div
  data-theme={themeId}
  style={{
    backgroundImage: theme.background ? `url(${theme.background})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  }}
>
```

Fallback (`background === null`): solid `var(--bg-primary)` + případně CSS gradient definovaný v `decorations.css`.

### 2.6 Dekorativní vrstva

Animace a ornamenty se definují v `decorations.css`. Podléhají kontraktu:

```css
/* decorations.css — povinná struktura */

[data-theme="modre-nebe"] {
  /* statické dekorace (ornamenty, ::before/::after, border-image) — vždy aktivní */
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="modre-nebe"] {
    /* animace — aktivují se POUZE pokud uživatel pohyb neomezuje */
  }
}
```

Témata s `reducedMotion: 'heavy'` (např. Vesmírná bitva, Kyberpunk déšť) musí všechny svoje animace mít v `motion-safe` bloku. Témata s `'safe'` (jemný třpyt, hover transitions) mohou mít minimální animace mimo blok.

---

## 3. State management & switching

### 3.1 Atom

```ts
// src/themes/state.ts
export const themeAtom = atomWithStorage<ThemeId>('ikaros.theme', DEFAULT_THEME);
```

`atomWithStorage` automaticky persistuje do localStorage. Klíč: `ikaros.theme`.

### 3.2 ThemeProvider

`src/themes/ThemeProvider.tsx` je context provider obalující appku v `main.tsx`. Drží:

- aktuální `themeId`
- funkci `setTheme(id)` — validuje + aplikuje + (přihlášený) sync na BE
- `loadingTheme` flag (true během lazy-load decorations + fontů)

### 3.3 Pre-hydration script

V `index.html` před React hydratací inline script čte localStorage a nastavuje `data-theme` na `<html>`:

```html
<script>
  (function () {
    try {
      var raw = localStorage.getItem('ikaros.theme');
      var id = raw ? JSON.parse(raw) : 'modre-nebe';
      document.documentElement.setAttribute('data-theme', id);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'modre-nebe');
    }
  })();
</script>
```

To zajišťuje **žádný FOUT** — prvotní paint má správné `data-theme` ještě před React render.

### 3.4 Apply funkce

`applyTheme(id)`:

1. Validuje `id` přes registry (fallback na `DEFAULT_THEME`)
2. Nastaví `data-theme` na all theme-aware roots (Ikaros, Auth, World layout div)
3. `style.setProperty()` pro každý var z `theme.vars`
4. Lazy-import `theme.decorationsModule()` (CSS-in-CSS modul, Vite to umí)
5. Lazy-load `theme.fonts.display` / `theme.fonts.logo` přes `<link rel="preload" as="font">` (pokud ještě není v DOM)
6. Preload background image přes `new Image().src = theme.background`
7. Nastaví loading flag na false po dokončení (Promise.all)

Měření performance: cíl < 300 ms od kliknutí v dropdownu po dokončení transition.

### 3.5 Hybrid persistence (BE sync)

`useThemeSync()` hook:

- Při loginu (po obdržení usera) — pokud `user.themeId` existuje a liší se od localStorage, **BE výhrává** → `setTheme(user.themeId)` (bez API roundtripu, jen aplikace)
- Při změně tématu, pokud uživatel přihlášen → `PATCH /api/users/me { themeId }` (debounced 500 ms, fire-and-forget). Selhání API neblokuje UI, jen toast.
- Při logoutu → atom zůstává s posledním tématem v localStorage (nereset).
- Anonymní uživatel → jen localStorage, žádné API volání.

**Dluh-tracking**: pokud BE ještě nemá endpoint, FE volání selže s 404 — chytíme tiše a nezobrazíme toast (pouze console.warn). [Plánuji vytvořit dluh D-XXX přes skill `dluh`.]

---

## 4. Theme switcher UI

### 4.1 Umístění a vzhled

V `IkarosLayout` headeru, na pozici, kde mockupy mají `ZLATÝ STANDARD ▼`. Komponenta `ThemeSwitcher.tsx`:

```
┌─────────────────────────────┐
│ [thumb 24×24] MODRÉ NEBE ▼  │  <- trigger (button)
└─────────────────────────────┘
```

Klik / Enter / Space → otevře popover.

### 4.2 Popover (desktop ≥ 768px)

- Anchored pod trigger, šířka ~280 px
- max-height: `min(520px, 70vh)`, internal scroll
- Backdrop: poloprůhledný overlay, klik mimo = close
- Položka: `<button>` s 64×40 thumbnail vlevo + uppercase názvem vpravo, padding ~12 px
- Hover/keyboard focus = zvýrazněná položka (téma-tematické přes `var(--accent)`)
- Aktivní téma: malý ✓ marker vpravo + slabý zlatý kroužek kolem thumbnailu

### 4.3 Bottom-sheet (mobile < 768px)

- Otevře se jako slide-up sheet ze spodu, výška 70vh, full-width
- Drag handle nahoře, drag-down dismiss
- Stejný seznam jako desktop, jen větší tap target (60 px výška položky)
- Backdrop: tmavý overlay s blur, klik mimo = close

### 4.4 Klávesové ovládání

- Tab: focus na trigger
- Enter / Space na trigger: open
- Escape: close
- ↑ / ↓: navigace v seznamu
- Enter v položce: vybere téma + close
- Home / End: skok na první / poslední položku

### 4.5 ARIA

- Trigger: `aria-haspopup="listbox"`, `aria-expanded`, `aria-label="Vybrat motiv aplikace"`
- Popover: `role="listbox"`, `aria-activedescendant`
- Položky: `role="option"`, `aria-selected`

---

## 5. Asset pipeline

### 5.1 Source files

```
docs/themes/assets/
├── thumbnails/
│   ├── modre-nebe.png          // 1648×... (původní mockup s UI)
│   ├── zlaty-standard.png
│   └── ...
└── backgrounds/
    ├── modre-nebe.png          // 1920×1080+ (čistá scéna z GPT, dodává PJ)
    ├── zlaty-standard.png
    └── ...
```

### 5.2 Build script

`scripts/optimize-theme-assets.mjs` (Node, used at build time + on-demand):

- Iteruje `docs/themes/assets/thumbnails/*.png` → resize na 320×180, convert WebP q=82, output `public/themes/thumbnails/<id>.webp`
- Iteruje `docs/themes/assets/backgrounds/*.png` → resize max 1920×1080 (zachovat aspect), convert WebP q=80, output `public/themes/backgrounds/<id>.webp`
- Cíl velikost: thumbnaily ~30 KB, backgrounds ~250 KB
- Dependency: `sharp` (devDependency)
- Spouští se manuálně (`npm run themes:optimize`) a ideálně v `prebuild` hooku

### 5.3 Public assets

```
public/themes/
├── thumbnails/<id>.webp
└── backgrounds/<id>.webp
```

Tyto se publikují skrz Vite static. Theme registry odkazuje na tyto cesty.

### 5.4 Chybějící obrázky

Autor theme `index.ts` ručně nastavuje `background: '/themes/backgrounds/<id>.webp'` pokud existuje, jinak `background: null`. Když je `null`, UI použije CSS gradient fallback definovaný v `decorations.css`.

Optimize skript se chová odolně:
- Pokud `docs/themes/assets/backgrounds/<id>.png` neexistuje, skript jen varuje (`console.warn`), nepřeruší build a nepublikuje nic do `public/themes/backgrounds/`
- Pokud na cestě `/themes/backgrounds/<id>.webp` runtime soubor chybí (404), browser prostě nezobrazí pozadí — viditelný je `--bg-primary` solid color jako fallback. UI funguje dál.

**Pracovní workflow:** PJ postupně dodává PNG → spuštění `npm run themes:optimize` → pokud nový obrázek vznikl, autor theme `index.ts` aktualizuje `background` z `null` na cestu. Lze automatizovat skriptem který sám generuje `background` field, ale zatím manuálně.

---

## 6. Font loading strategie (Hybrid D)

### 6.1 Base body fonty — self-hosted, preload

Base body fonty (Lora regular/italic) jsou **self-hostované** v `public/fonts/` (woff2). Důvod: jsou používané drtivou většinou textu napříč všemi 21 tématy, takže preload je výhodný; samohostování garantuje dostupnost a stabilní loading time.

V `index.html`:

```html
<link rel="preload" href="/fonts/lora-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/lora-italic.woff2" as="font" type="font/woff2" crossorigin>
```

EB Garamond se může přidat do preload pokud bude třeba (témata s `--font-body: 'EB Garamond'`); jinak fallback na Lora.

### 6.2 Display fonty per téma — Google Fonts, lazy

Display fonty (Cinzel, Orbitron, MedievalSharp, Great Vibes…) se načítají **z Google Fonts CDN** dynamicky při změně tématu. Důvod: každé téma má jiný display font, self-hosting všech ~12 rodin by zatížil bundle.

Lazy-load při `applyTheme(id)`:

```ts
async function loadFont(family: string) {
  if (document.fonts.check(`16px ${family}`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;700&display=swap`;
  document.head.appendChild(link);
  await document.fonts.load(`700 16px "${family}"`);
}
```

`display=swap` = během načítání font swapne na fallback (FOUT 200-500ms místo blank text).

### 6.3 Font fallbacky

Každé téma definuje fallback chain v `vars`:

```ts
'--font-logo': '"Cinzel Decorative", "Cinzel", Georgia, serif',
'--font-display': '"Cinzel", Georgia, serif',
'--font-body': '"Lora", Georgia, serif',
```

---

## 7. World theme integrace (fáze 5.0 ready)

### 7.1 Layout-scoped data-theme

```jsx
// IkarosLayout.tsx
<div data-theme={userTheme} className="layout-root">
  <Header><ThemeSwitcher /></Header>
  <Outlet />
</div>

// AuthLayout.tsx
<div data-theme={userTheme} className="layout-root">
  <Outlet />
</div>

// WorldLayout.tsx — fáze 1.0
<div data-theme={userTheme} className="layout-root">
  <Outlet />
</div>

// WorldLayout.tsx — fáze 5.0 (budoucí změna)
<div data-theme={world.themeId ?? userTheme} className="layout-root">
  <Outlet />
</div>
```

### 7.2 Implikace

- Pre-hydration script i tak nastaví `<html data-theme>` (kvůli initial paint), ale finální zdroj pravdy je layout root.
- CSS proměnné kaskádují, takže když je `data-theme` na layout rootu, všechny děti dědí.
- Decorations CSS používá `[data-theme="<id>"]` — match nejbližší rodič.
- **Žádný refactor v 5.0** — jen `WorldLayout` dostane druhý zdroj (world.themeId).

### 7.3 Theme scope filtry

Themes označené `scope: 'platform'` se v fázi 5.0 nedají vybrat jako world theme. V dropdownu pro world theme picker (5.0) `listThemes('both')`.

---

## 8. Accessibility & performance

### 8.1 Accessibility

- **Kontrast**: každé téma musí splňovat WCAG AA pro tělo textu (4.5:1) a UI komponenty (3:1). Validace v Storybook + automatický check (axe-core) v CI.
- **`prefers-reduced-motion`**: animace pozadí (déšť, plamen, pulse, drip) auto-off. Hover/click feedback transitions zůstávají (jsou pod 200 ms a accessibility-safe).
- **`prefers-color-scheme`**: ignorujeme — uživatel si volí téma explicitně. Nenačítá se světlé/tmavé z OS.
- **Focus management**: switcher dropdown je plně keyboard-navigable (viz 4.4)
- **Reduced data**: pokud `navigator.connection.saveData === true`, background images se nestahují (fallback gradient).

### 8.2 Performance

- **First paint**: pre-hydration script aplikuje `data-theme` před React → barva pozadí je ihned správná. Fonty + dekorace + bg image dorážejí postupně.
- **Theme switch latency**: cíl < 300 ms (lazy import + font swap + bg preload).
- **Bundle size**: každé téma jako lazy chunk ~5-15 KB CSS. Ne všech 21 v initial bundle.
- **Background image budget**: ~250 KB per téma WebP, lazy-load jen aktivní.

---

## 9. File structure & migrace

### 9.1 Nové soubory

```
src/themes/
├── registry.ts
├── types.ts
├── state.ts                           // jotai atom + DEFAULT_THEME
├── ThemeProvider.tsx
├── useTheme.ts                        // hook { theme, setTheme }
├── useThemeSync.ts                    // hook BE sync
├── applyTheme.ts                      // imperative DOM apply
├── ThemeSwitcher.tsx
├── ThemeSwitcher.module.css
├── _shared/
│   ├── tokens.css                     // strukturální (přesun ze src/index.css)
│   └── reset.css                      // base reset (přesun ze src/index.css)
└── themes/
    ├── modre-nebe/
    │   ├── index.ts
    │   └── decorations.css
    ├── zlaty-standard/
    │   ├── index.ts
    │   └── decorations.css
    └── ... (dalších 19)

scripts/
└── optimize-theme-assets.mjs

public/
├── fonts/
│   ├── lora-regular.woff2
│   └── lora-italic.woff2
└── themes/
    ├── thumbnails/
    └── backgrounds/

index.html                              // + inline pre-hydration script
package.json                            // + sharp devDep, themes:optimize script
```

### 9.2 Změny stávajících souborů

| Soubor | Změna |
|--------|-------|
| `src/index.css` | Smaže se placeholder Ikaros barevná paleta (řádky 87-142). Strukturální tokeny (spacing, radius, z-index) přesunuty do `src/themes/_shared/tokens.css`. Reset přesunut do `src/themes/_shared/reset.css`. Soubor zůstává jen jako import-aggregator. |
| `src/main.tsx` | `<ThemeSync />` nahrazeno `<ThemeProvider>` který obaluje aplikaci. |
| `src/components/ThemeSync.tsx` | Smaže se — funkcionalitu převzal `ThemeProvider` + `useThemeSync`. |
| `src/components/layout/IkarosLayout.tsx` | Wrapper `<div data-theme={...}>` na top, `<ThemeSwitcher />` v hlavičce. |
| `src/components/layout/WorldLayout.tsx` | Wrapper `<div data-theme={...}>` na top. |
| `src/components/layout/AuthLayout.tsx` | Wrapper `<div data-theme={...}>` na top. |
| `index.html` | + inline pre-hydration script |
| `package.json` | + `sharp` devDep, + script `themes:optimize` |

### 9.3 Mapping starých → nových tokenů

Ze `src/index.css` placeholder palety na nové tokeny:

| Stará | Nová |
|-------|------|
| `--color-bg` | `--bg-primary` |
| `--color-bg-elevated` | `--bg-secondary` |
| `--color-surface` | `--bg-card` |
| `--color-bg-overlay` | `--bg-card-hover` |
| `--color-border` | `--border` |
| `--color-border-subtle` | `--border-subtle` (volitelný token) |
| `--color-text` | `--text-primary` |
| `--color-text-muted` | `--text-secondary` |
| `--color-text-heading` | `--text-primary` (zvýšená font-weight v komponentě) |
| `--color-accent` | `--accent` |
| `--color-accent-hover` | `--accent-bright` |
| `--color-accent-muted` | (smazat — použít `color-mix(in oklab, var(--accent), transparent 80%)`) |
| `--color-success/warning/danger/info` | beze změny (i tak globální) |

V implementaci se udělá find-and-replace přes celou kódovou bázi v `src/components/`, `src/pages/`, `src/api/`. Build pak ověří že žádný `--color-` token nezůstal.

---

## 10. Testing strategy

### 10.1 Unit testy

- `registry.ts` — validace povinných tokens, fallback na DEFAULT, `listThemes(scope)`
- `applyTheme.ts` — DOM mutations (data-theme atribut, CSS variables)
- `useTheme.ts` — atom integrace
- `useThemeSync.ts` — BE call mocked, behavior pri 200/404/500

### 10.2 Component testy (Storybook)

- `ThemeSwitcher` — open/close, keyboard nav, mobile sheet
- `Button`, `Card`, `Panel`, `Input`, `Modal`, `NavItem`, `Header` — každá s `ThemeDecorator` umožňujícím vidět ji ve všech 21 tématech

### 10.3 Visual regression

- Chromatic nebo Loki snapshoty pro klíčové pages × 21 témat × 2 viewporty (375 / 1440)
- Cíl: catch unintended visual regressions při jakémkoli theme změně

### 10.4 E2E (Playwright)

- Otevřít `/`, kliknout na switcher, vybrat téma, ověřit `<html data-theme>` se změnil + reload zachová volbu
- Login → ověřit že `user.themeId` se aplikuje, ne localStorage

### 10.5 Accessibility

- axe-core check v Storybook stories
- Manuální ověření kontrastu pro každé téma (poznamenat ve `<id>.md` pokud nějaký text je hraniční)

---

## 11. Implementační milestones

Implementační plán bude detailní (writing-plans skill). Doporučený rozdělení do **dvou writing-plans iterací** (kvůli velikosti):

### Iterace A — Foundation + 3 referenční témata (M1-M6)

První writing-plans pokryje:

1. **M1** — Theme infrastructure (provider, atom, registry, applyTheme, pre-hydration script) + jedno referenční téma `modre-nebe`. Switcher zatím nefunkční.
2. **M2** — ThemeSwitcher UI (desktop + mobile bottom-sheet), keyboard, ARIA
3. **M3** — Asset pipeline (optimize skript) + dvě další referenční témata (`bila`, `temna-cerven` — extrémy palet)
4. **M4** — Migrace existujících komponent na nové tokeny, smazání placeholder barev
5. **M5** — Storybook + theme decorator + unit testy + axe checks
6. **M6** — BE sync (`PATCH /api/users/me/theme`) — koordinace s BE týmem

Odhad iterace A: 3-4 týdny. **Ukončení iterace = funkční theme system se 3 tématy + plná infrastruktura.**

### Iterace B — Zbývajících 18 témat (M7-M10)

Druhý writing-plans pokryje opakovaný pattern (každé téma ~1-2 dny):

7. **M7** — 6 témat (sci-fi, vesmirna-lod, priroda, pergamen, nemrtvi, ctyri-zivly)
8. **M8** — 6 témat (vesmirna-bitva, hospoda, severske-runy, indiane, africke, arabsky-svet)
9. **M9** — 6 témat (kyberpunk, postapo, magie, mesic, slunce, zlaty-standard)
10. **M10** — Visual regression setup, accessibility audit per téma, finální polishing

Odhad iterace B: 3-4 týdny. **Ukončení iterace = všech 21 témat hotovo, fáze 1.0 uzavřena.**

**Celkový odhad fáze 1.0:** 6-8 týdnů full-time work.

---

## 12. Risk register

| Riziko | Dopad | Mitigace |
|--------|-------|----------|
| Background obrázky nedodány včas | Téma vypadá "chudě" | Fallback CSS gradient, postupně se "rozsvítí" jak přijdou |
| GPT generuje BG s UI navzdory promptu | Nepoužitelné | Re-prompt + případně Photoshop ořez |
| Performance pokles na low-end zařízeních | Lag při switching | Lazy-load všeho, prefers-reduced-motion |
| Některé komponenty mají hardcoded barvy mimo radar | Téma se nereflektuje | Find-replace + ESLint pravidlo zakazující `#hex` v komponentách |
| BE endpoint pro `User.theme` nehotový | Sync nefunguje | FE chytá 404, jen localStorage; tracked jako dluh |
| Některé fonty z Google Fonts nedostupné v EU/CDN | FOUT | Self-host kritických fontů v `public/fonts/` |
| 21 témat × 21 dekorací = velký maintenance | Bug v 1 tématu nezjištěn | Storybook + visual regression chytí |
| WCAG AA contrast fail v některém tématu (Bílá!) | Nečitelnost | Manuální audit per téma, případně tweak palety |

---

## 13. Open questions

Žádné — všechna foundation rozhodnutí učiněna v brainstormingu (2026-05-07).

---

## 14. Akceptační kritéria

Fáze 1.0 je hotová, když:

- [ ] Uživatel může v dropdownu v hlavičce vybrat libovolné z 21 témat
- [ ] Volba se persistuje v localStorage a (pokud přihlášený) na BE
- [ ] Při reloadu stránky se aplikuje uložené téma bez FOUT
- [ ] Default pro nového uživatele = `modre-nebe`
- [ ] Všech 21 témat má funkční CSS proměnné (povinné tokens) a alespoň základní dekorace
- [ ] Background image se aplikuje pokud existuje, jinak CSS fallback
- [ ] Switcher funguje na desktop (popover) i mobile (bottom-sheet)
- [ ] Keyboard navigace funguje (Tab, ↑/↓, Esc, Enter)
- [ ] `prefers-reduced-motion` automaticky vypíná background animace
- [ ] WCAG AA kontrast pro body text napříč všemi tématy
- [ ] Žádná hardcoded barva v komponentě (ESLint pass)
- [ ] Storybook obsahuje theme decorator a base komponenty (Button, Card, Panel) jsou viditelné ve všech 21 tématech
- [ ] Architecture připravená pro fázi 5.0 (theme scope na úrovni layoutu)
