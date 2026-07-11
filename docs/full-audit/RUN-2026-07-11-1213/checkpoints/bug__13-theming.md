# Checkpoint — bug / 13-theming

**Oblast:** `docs/bug-plan/13-theming.md` (styl bug, prefix `N-`, registr `docs/bug-audit.md`)
**Datum:** 2026-07-11 · **Režim:** READ-ONLY (needituji kód)
**Dosažená L:** L1–L3 (jádro registry/applyTheme/switcher/sync kryto existujícími testy na L3; vizuální/`[human]` body L1/PROOF)
**Cílová L:** L3/L4 na kritických cestách — z velké části splněno existujícími testy; nové nálezy L1 + PROOF-REQUEST.

---

## Prošel jsem (kód v záběru)

- `src/themes/`: `registry.ts`, `applyTheme.ts`, `state.ts`, `types.ts`, `useTheme.ts`, `useThemeSync.ts`, `ThemeProvider.tsx`, `ThemeSwitcher.tsx`, `worldTheme.ts`, `effects/MatrixRain.tsx`, `themes/_skinBase.ts`, všech 33 `themes/*/index.ts` + `themes/*/decorations.css` (scope/reducedMotion/effect/keyframes/guardy), `_shared/{tokens,reset}.css`.
- Integrace: `app/layout/WorldLayout/WorldLayout.tsx` (:420–540), `IkarosLayout.tsx` (`data-shell="ikaros"`), `features/ikaros/…/constants/genres.ts` (`themeForGenre`), `index.html` (pre-hydration + font preload).
- BE: `users/dto/update-user.dto.ts`, `constants/theme-ids.ts`, `schemas/user.schema.ts`.
- Testy (běh/čtení): `__tests__/{registry,applyTheme,skin57a,worldTheme,ThemeProvider,useTheme,useThemeSync}.*` (33 testů zeleně dle baseline), `useThemeSync.spec.tsx`.
- Skripty: `scripts/audit-theme-contrast.mjs` (spuštěn → „All themes pass WCAG AA“ pro hex).
- Assety: `public/themes/{thumbnails,backgrounds}` (33/33 párů OK).

---

## 🆕 Nové nálezy

### N-RUN-T1 — [F Asset pipeline / fonty] Single-weight font `Rye` (skin `western`) se lazy-loadem nikdy nenačte
- **Kde:** `src/themes/applyTheme.ts:30` (`…css2?family=${…}:wght@400;700…`) × `src/themes/themes/western/index.ts:43` (`fonts: { logo:'Rye', display:'Rye', … }`).
- **Root:** `loadFont` natvrdo požaduje `:wght@400;700`. `Rye` je single-weight (jen 400) Google font a NENÍ v `index.html` preloadu (na rozdíl od ostatních single-weight fontů, které tam jsou požadované správně bez `wght`). Lazy request `family=Rye:wght@400;700` vrací z css2 API **HTTP 400** (styl nedostupný) → `@font-face` se neinjektne → `document.fonts.load('700 …')` v try/catch selže tiše.
- **Dopad:** `western` (logo + display = Rye) padá na `Georgia, serif` → ztráta signature „wanted-poster / wood-type“ vzhledu celého skinu. Porušuje pravidlo „skiny PROFESIONÁLNÍ“.
- **Návrh:** v `loadFont` nezpevňovat `700` (požadovat jen dostupné váhy / `wght@400`), nebo přidat `Rye` do `index.html` preload linku jako ostatní single-weight fonty.
- **Klasifikace:** 🆕 · **Záv.:** 🟡 · **L1** (statika + znalost css2 API). PROOF-REQUEST: síťový request `css2?family=Rye:wght@400;700` → očekáváno 400; screenshot western headings.
- **Pozn.:** ostatních 8 non-preloaded world-skin fontů (Crimson Pro, Exo 2, Fraunces, Grenze Gotisch, Lato, Newsreader, Oswald, Roboto Condensed) váhu 700 podporuje → OK; `Rye` je jediná oběť.

### N-RUN-T2 — [C FOUT prevence] Pre-hydration nastaví jen `data-theme`, ne color tokeny → FOUC barev u tmavých platformových motivů
- **Kde:** `index.html:19–30` (pre-hydration skript nastaví pouze `documentElement.setAttribute('data-theme', id)`) × `src/themes/_shared/reset.css:7-8` (`html{ color:var(--text-primary); background:var(--bg-primary) }` bez fallbacku).
- **Root:** barevné tokeny (`--bg-primary`, `--text-primary`, …) nejsou v žádném statickém CSS — nastavuje je inline až JS `applyTheme` v `ThemeProvider` useEffectu (po prvním paintu). Do té doby jsou `var()` bez hodnoty → `html` background/color = default prohlížeče (bílá/černá).
- **Dopad:** u tmavých motivů (`sci-fi`, `nemrtvi`, `kyberpunk`, `temna-cerven`, `vesmirna-bitva`, `postapo`…) bílý záblesk při každém cold full-load. TH-27 tvrdí „žádný FOUT pro výchozí motiv“ — platí jen pro `data-theme` atribut (dekorace), NE pro barvy. `modre-nebe` (světlý default) minimálně, ostatní znatelně.
- **Návrh:** buď (a) v pre-hydration skriptu inline nastavit kritické color vars pro uložený theme, nebo (b) fallback hodnoty v `reset.css` (`var(--bg-primary, #0b0e14)`), nebo (c) statické `[data-theme="X"]{ --bg-primary:… }` bloky pro alespoň base tokeny.
- **Klasifikace:** 🆕 · **Záv.:** 🟡 · **L1**. PROOF-REQUEST: cold reload s uloženým tmavým platform theme → screenshot prvního paintu (`[human]`/render proof).

### N-RUN-T3 — [F Asset pipeline] Osiřelý background asset bez odpovídajícího theme id
- **Kde:** `public/themes/backgrounds/matrix.webp` — žádný theme s `id: 'matrix'` (leftover po přejmenování na `ikaros`/synthwave).
- **Dopad:** mrtvý asset v buildu (kosmetika, žádná runtime chyba).
- **Návrh:** smazat, nebo ověřit, zda ho nereferencuje starý odkaz.
- **Klasifikace:** 🆕 · **Záv.:** 🟢 · **L2** (fs check).

---

## Známé / stale (NEhlásím jako nové)

- **TH-26 / R3 (`themeId` bez `@IsIn`)** → JIŽ OPRAVENO jako **N-11**: `update-user.dto.ts:58 @IsIn(THEME_IDS)` + `constants/theme-ids.ts` + `update-user.dto.spec.ts` (4 testy). Plán je stale.
- **TH-45 / R2 (ARIA `ul>li>button[role=option]`)** → JIŽ OPRAVENO: `ThemeSwitcher.tsx:92-126` používá `<div role="listbox">` › `<div role="presentation">` › `<button role="option">` + `aria-activedescendant`. Kanonický aria-activedescendant listbox; `role="presentation"` odstraní wrapper z a11y stromu → button je efektivně přímé dítě listboxu. Plán popisuje starý (nevalidní) stav — riziko R2 už neplatí.
- **TH-41 / R5 (`modre-nebe` bez reduced-motion guardu)** → JIŽ ZAEVIDOVÁNO jako **N-42** (`bug-audit.md:239`, 🟡, neopraveno). Known.
- **TH-39 / R1 (contrast audit ignoruje rgba/var)** → potvrzeno `audit-theme-contrast.mjs:56` (`if (!fg.startsWith('#')…) continue`). Documented risk, glass-surface skiny neověřeny automaticky (`[human]`).
- **TH-25 / R4 (`JSON.stringify(overrides)` pořadí klíčů)** → documented risk; server serializuje konzistentně → benigní, jen možné zbytečné re-apply. Low.
- **TH-53 (module-level `loadedDecorations`/`loadedFonts` Sety)** → test-izolační caveat, ne runtime bug (documented).

---

## Ověřeno OK (výběr, s L)

- **TH-01/02/03** 21 platform + 12 world = 33 (grep scope: 21/12; `skin57a.spec` L3).
- **TH-04/05** povinná pole vynucena `Theme` typem (tsc baseline čistý) — L2.
- **TH-06/07/08/09/10/11** `getTheme` fallback, `applyTheme` set/cleanup/overrides/unknown — `registry.test`+`applyTheme.test` **L3**.
- **TH-12** povinné CSS tokeny — `registry.test` **L3**.
- **TH-13/59** `buildSkinVars` skiny sdílí `SHARED` (`--success #3ecf8e`, `--danger #f06060`…) — L1; 21 platform themů status barvy záměrně variují dle palety (ne drift) — L1.
- **TH-14** `themeForGenre` 11 žánrů 1:1 + fallback `ikaros` — `skin57a.spec` **L3**.
- **TH-15/16/17** switcher jen `listThemes('platform')`, `atomWithStorage('ikaros.theme')` — L1/L2 (`useTheme.test` L3).
- **TH-18/19/20** debounced PATCH / graceful catch / gate na přihlášení — `useThemeSync.test` **L3**.
- **TH-21/22/23** initial sync LS-wins vs BE-wins + legacy `themeSettings.themeId` fallback — kód `useThemeSync.ts:21-54` čitelný, dedikovaný test chybí (gap dle plánu) — L1.
- **TH-24/35/62** `ThemeProvider` skip při `worldThemeActive`, WorldLayout apply/restore, žádný leak — `ThemeProvider.test` **L3** + `WorldLayout.tsx:477-494` L1.
- **TH-27/28/29** pre-hydration parse/fallback — L1 (viz N-RUN-T2 pro barevný FOUC).
- **TH-31** klíč `'ikaros.theme'` identický (`state.ts:7` = `index.html:22` = `useThemeSync.ts:22`) — **L2**.
- **TH-32** žádný top-level selektor v `decorations.css` bez `[data-theme]` prefixu (grep col-0 selektorů = 0 leaků) — L1.
- **TH-33** žádná cross-theme keyframe-name kolize (automat. proxy; jediný dubl `africke-heat-shimmer` je legit redefinice uvnitř `@media reduced-motion`) — L1.
- **TH-34/36/37** `WorldLayout` `div[data-world-shell][data-theme]`, `IkarosLayout` `data-shell="ikaros"`; `[data-theme][data-shell="ikaros"]` dekorace se ve světě nevykreslí — L1.
- **TH-38** `audit:contrast` prošel (hex) — **L3**; TH-39 rgba slepé místo (viz R1).
- **TH-40** 5 „heavy“ motivů (sci-fi/nemrtvi/temna-cerven/ctyri-zivly/vesmirna-bitva) má `@media (prefers-reduced-motion: reduce)` blok (grep ≥1) — L1.
- **TH-42/43** `MatrixRain` early-return při reduced-motion + `visibilitychange` pauza — `MatrixRain.tsx:29,89` L1.
- **TH-44** switcher klávesnice ArrowUp/Down/Home/End/Enter/Space/Escape — `ThemeSwitcher.tsx:53-71` L1.
- **TH-47/48** 33/33 thumbnail + background souborů existuje (fs check) — **L2** (+ osiřelý `matrix.webp` = N-RUN-T3).
- **TH-49/50/51** lazy dedup dekorací/fontů přes module Sety + porovnání logo/display/body — `applyTheme.ts:14-92` L1.
- **TH-54** `preloadBackground(new Image())` neblokující hint — L1.
- **TH-56** `ikaros`: scope world + `effect:'matrix-rain'` + background + render ve `WorldLayout.tsx:539` — `skin57a.spec` **L3**.

---

## Gaps / PROOF-REQUESTy (na proof-vrstvu / `[human]`)

1. **N-RUN-T1**: síťový proof css2 `Rye:wght@400;700` → 400 + screenshot western.
2. **N-RUN-T2**: render proof cold-load tmavého platform theme → FOUC snímek.
3. **TH-33/46/57/60** (`[human]`): vizuální originalita ornamentů + čitelnost 21 thumbnailů + atmosphere↔vzhled — screenshot audit.
4. **TH-21/22/23**: chybí dedikovaný test initial-sync větvení (LS-wins/BE-wins/legacy) — kandidát na M7.
5. **TH-39 / R1**: glass-surface (rgba) kontrast neověřen automaticky — manuální / rozšíření skriptu o rgba kompozici.
