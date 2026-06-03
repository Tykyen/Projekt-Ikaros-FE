# 13 — Theming

Platforma Ikaros používá 21 platformových motivů + 12 světových skinů aplikovaných přes `data-theme` atribut na `<html>` (globální platforma) nebo na `div[data-world-shell]` (svět). Theming engine zahrnuje: registry, `applyTheme`, `ThemeProvider`, `useThemeSync` (atom + BE PATCH /users/me), pre-hydration skript (FOUT prevence), lazy-load decorations.css a fontů, a JS efekt Matrix rain pro skin `ikaros`.

**FE:** `src/themes/` — registry, applyTheme, useTheme, useThemeSync, ThemeProvider, ThemeSwitcher, pre-hydration script, per-téma index.ts + decorations.css, _skinBase.ts, MatrixRain, worldTheme
**BE:** `users` — `PATCH /users/me { themeId }`, schema pole `themeId?: string`, `UpdateUserDto @IsString @MaxLength(64)`

---

## A. Theme registry & aplikace

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| TH-01 | `listThemes('platform')` vrátí přesně 21 motivů (neměnné invariant) `[auto]` | M1 (skin57a.spec.ts) | ⬜ |
| TH-02 | `listThemes('world')` vrátí přesně 12 světových skinů (ikaros + 11 žánrových) `[auto]` | M1 (skin57a.spec.ts) | ⬜ |
| TH-03 | `Object.keys(THEMES).length === 33` (21 platform + 12 world) `[auto]` | M1 | ⬜ |
| TH-04 | Každý ze 33 motivů má povinná pole: `id`, `name`, `scope`, `vars`, `fonts`, `thumbnail`, `background`, `decorationsModule`, `atmosphere` `[auto]` | M1 (projít THEMES v testu) | ⬜ |
| TH-05 | Každé `theme.id` odpovídá klíči v `THEMES` (id !== slug-drift) `[auto]` | M1 | ⬜ |
| TH-06 | `getTheme(invalidId)` padá na `DEFAULT_THEME` = `'modre-nebe'` (fallback) `[auto]` | M1 (registry.test.ts) | ⬜ |
| TH-07 | `DEFAULT_THEME = 'modre-nebe'`, `DEFAULT_WORLD_THEME = 'ikaros'` — hodnoty jsou statické konstanty, neměnné `[auto]` | M1 | ⬜ |
| TH-08 | `applyTheme(id)` nastaví `document.documentElement.setAttribute('data-theme', theme.id)` `[auto]` | M1 (applyTheme.test.ts) | ⬜ |
| TH-09 | `applyTheme` odstraní tokeny předchozí aplikace (cleanup `lastAppliedKeys`) před novou aplikací — žádné „visící" override hodnoty `[auto]` | M1 (applyTheme.test.ts) | ⬜ |
| TH-10 | `applyTheme` s `overrides` zapíše override tokeny nad `theme.vars` (overrides mají přednost) `[auto]` | M1 (applyTheme.test.ts) | ⬜ |
| TH-11 | `applyTheme` pro neznámé ID volá fallback a nastaví `data-theme="modre-nebe"` (ne prázdné nebo crash) `[auto]` | M1 (applyTheme.test.ts) | ⬜ |
| TH-12 | Všechny 33 témat mají v `vars` povinné CSS tokeny: `--bg-primary`, `--bg-card`, `--accent`, `--text-primary`, `--danger`, `--success`, `--info` `[auto]` | M1 (registry.test.ts) | ⬜ |
| TH-13 | Skiny generované přes `buildSkinVars` mají `SHARED` konstanty (success/warning/danger, layout chrome) — žádný skin nesmí mít jinou hodnotu `--success` bez záměru `[auto]` | M1 | ⬜ |
| TH-14 | `themeForGenre(unknown)` fallback na `'ikaros'`, všechna 11 žánrů mapují 1:1 na existující world skin `[auto]` | M1 (skin57a.spec.ts) | ⬜ |

## B. Switcher & persistence (atom + BE sync)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| TH-15 | `ThemeSwitcher` volá `listThemes('platform')` — nezobrazí světové skiny (ikaros, fantasy…) `[auto]` | M1 | ⬜ |
| TH-16 | Výběr motivu v switcheru okamžitě aktualizuje `themeAtom` (atomWithStorage `'ikaros.theme'`) `[auto]` | M1 (useTheme.test.tsx) | ⬜ |
| TH-17 | `themeAtom` persists v `localStorage` klíč `'ikaros.theme'` jako JSON string (ne raw string) — `atomWithStorage` serializuje `"modre-nebe"` (quoted) `[auto]` | M1 | ⬜ |
| TH-18 | `useThemeSync` při změně motivu u přihlášeného uživatele volá `PATCH /users/me { themeId }` s debouncem 500ms `[auto]` | M2 (useThemeSync.test.tsx) | ⬜ |
| TH-19 | `useThemeSync` odmlčí (swallows) chybu API (graceful 404/500) — aplikace nepadá, jen `console.warn` `[auto]` | M2 (useThemeSync.test.tsx) | ⬜ |
| TH-20 | `useThemeSync` neprovede `PATCH` pokud uživatel není přihlášen `[auto]` | M2 (useThemeSync.test.tsx) | ⬜ |
| TH-21 | `useThemeSync` initial sync — pokud `localStorage` existuje (uživatel již volil), LS vítězí; pokud je prázdné (nové zařízení), BE vítězí `[auto]` | M2 | ⬜ |
| TH-22 | `useThemeSync` initial sync — při LS-wins pushuje aktuální LS hodnotu zpět do BE (catch-up sync) `[auto]` | M2 | ⬜ |
| TH-23 | Legacy `user.themeSettings.themeId` fallback funguje (čte, pokud `user.themeId` je undefined) — backward compat pro staré dokumenty `[auto]` | M2 | ⬜ |
| TH-24 | `ThemeProvider` volá `applyTheme` při změně `themeId` nebo `overridesKey` (ale ne při nezměněném stavu) `[auto]` | M1 | ⬜ |
| TH-25 | `overridesKey = JSON.stringify(overrides)` — potenciální nestabilita při různém pořadí klíčů objektu (JSON.stringify není deterministicky seřazen) — funkčnost závisí na konzistenci pořadí ze serveru `[auto]` | M1 | ⬜ |
| TH-26 | BE `UpdateUserDto.themeId: @IsString @MaxLength(64)` — chybí `@IsIn(validThemeIds)` validace, BE akceptuje libovolný string jako themeId (bez enumerace platných hodnot) `[auto]` | M2 | ⬜ |

## C. FOUT prevence (pre-hydration)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| TH-27 | Pre-hydration skript v `index.html` nastaví `data-theme` na `<html>` před Reactem — žádný FOUT pro výchozí motiv `[auto]` | M1 | ⬜ |
| TH-28 | Pre-hydration správně parsuje `JSON.parse(localStorage.getItem('ikaros.theme'))` — kompatibilní s atomWithStorage formátem (quoted JSON) `[auto]` | M1 | ⬜ |
| TH-29 | Pre-hydration fallback na `'modre-nebe'` při: (a) prázdném localStorage, (b) TypeError/SyntaxError, (c) non-string výsledku parsování `[auto]` | M1 | ⬜ |
| TH-30 | Pre-hydration skript je inline `<script>` (synchronní, před `<link>` na main.tsx) — nezávisí na načtení JS bundlu `[auto]` | M3 | ⬜ |
| TH-31 | Pre-hydration key `'ikaros.theme'` je identický s `atomWithStorage` klíčem v `state.ts` (žádný drift mezi klíči) `[auto]` | M1 | ⬜ |

## D. Theme isolation & scoping ([data-theme])

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| TH-32 | Každý `decorations.css` je scopován výhradně selektory `[data-theme="<id>"]` — žádný globální/`:root`/`body` selektor bez `[data-theme]` předpony `[auto]` | M1 | ⬜ |
| TH-33 | Žádný skin nesdílí/recykluje ornamentální CSS třídy nebo keyframe jména s jiným skinem (originality rule) `[human]` | M3 (vizuální audit) | ⬜ |
| TH-34 | Světový skin v `WorldLayout` používá `data-theme` na `div[data-world-shell]`, ne na `<html>` — dekorace fungují s CSS selektorem `[data-theme]` na libovolném kontejneru (CSS specifičnost OK) `[auto]` | M1 | ⬜ |
| TH-35 | `WorldLayout` nastaví `applyTheme` na `:root` (html) při vstupu, `IkarosLayout` ho restoruje při exitu (unmount) — žádný globální themeId leak po odchodu ze světa `[auto]` | M1 | ⬜ |
| TH-36 | Dekorace scoped na `[data-theme="<id>"][data-shell="ikaros"]` platí jen pro `IkarosLayout` (má `data-shell="ikaros"`). `WorldLayout` nemá `data-shell` — tyto dekorace se ve světě corretly nevykreslí `[auto]` | M1 | ⬜ |
| TH-37 | `IkarosLayout` renderuje `data-theme={themeId}` na platformovém shellu — musí sedět s hodnotou z `applyTheme(html)`. Synchronizace mezi `html.data-theme` a `div.data-theme` `[auto]` | M1 | ⬜ |

## E. Accessibility (WCAG kontrast, reduced-motion)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| TH-38 | `npm run audit:contrast` projde bez chyb pro všech 21 platformových motivů (tělo textu na pozadí ≥ 4.5:1, akcenty ≥ 3:1) `[auto]` | M1 (audit:contrast) | ⬜ |
| TH-39 | `audit:contrast` skript přeskočí rgba() a var() hodnoty — reálný kontrast glass-surface motivů (vše rgba) NIKdy není ověřen automaticky; nutný manuální vizuální audit `[human]` | M3 | ⬜ |
| TH-40 | Všechny motivy označené `reducedMotion: 'heavy'` (sci-fi, nemrtvi, temna-cerven, ctyri-zivly, vesmirna-bitva) mají v `decorations.css` blok `@media (prefers-reduced-motion: reduce)` zakazující animace `[auto]` | M1 | ⬜ |
| TH-41 | Motiv `modre-nebe` nemá `@media (prefers-reduced-motion: reduce)` v `decorations.css` — přestože má animace (2 keyframes nalezeny). Chybějící guard pro WCAG 2.3.3 `[auto]` | M1 | ⬜ |
| TH-42 | `MatrixRain` (ikaros skin) okamžitě vrátí bez kreslení pokud `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true` `[auto]` | M1 (MatrixRain.tsx) | ⬜ |
| TH-43 | `MatrixRain` pauzuje animaci při `document.hidden` (page visibility API) a obnoví po návratu `[auto]` | M1 | ⬜ |
| TH-44 | `ThemeSwitcher` je ovladatelný klávesnicí (ArrowUp/Down, Home/End, Enter/Space, Escape) `[auto]` | M1 (ThemeSwitcher.tsx) | ⬜ |
| TH-45 | `ThemeSwitcher` ARIA struktura: `button[aria-haspopup="listbox"]` + `ul[role="listbox"]` + `button[role="option"]` — role="option" je na `<button>` uvnitř `<li>` (ne přímé dítě listboxu — potenciální WAI-ARIA 1.2 narušení) `[human]` | M3 (screen reader test) | ⬜ |
| TH-46 | Všechna 21 témat mají vizuálně čitelné thumbnail v `ThemeSwitcher` popoveru (ne prázdné, ne placeholder) `[human]` | M3 | ⬜ |

## F. Asset pipeline (WebP, lazy-load, fonts)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| TH-47 | Všechna 33 témata mají existující thumbnail WebP soubor v `/public/themes/thumbnails/<id>.webp` (bez 404) `[auto]` | M1 | ⬜ |
| TH-48 | Všechna 33 témata mají existující background WebP soubor v `/public/themes/backgrounds/<id>.webp` (bez 404) — nebo `background: null` pro téma bez pozadí `[auto]` | M1 | ⬜ |
| TH-49 | `applyTheme` lazy-loaduje `decorations.css` jen jednou per themeId (modul-level `loadedDecorations` Set) — opakovaný switch na stejné téma nezpůsobí duplicitní inject `[auto]` | M1 | ⬜ |
| TH-50 | Fonty se načítají lazy přes `applyTheme` (dynamický `<link rel="stylesheet">` + `document.fonts.load()`) pouze při první aplikaci motivu `[auto]` | M1 | ⬜ |
| TH-51 | `applyTheme` deduplikuje font načítání: `theme.fonts.display !== theme.fonts.logo` → separátní promise; `theme.fonts.body !== theme.fonts.display` → separátní promise (žádné duplicitní Google Fonts requesty) `[auto]` | M1 | ⬜ |
| TH-52 | Základní fonty (Cinzel, Lora, Orbitron, Rajdhani, Great Vibes) jsou preloadovány v `index.html` jako jediný `<link rel="stylesheet">` — bez blokování renderu `[auto]` | M3 | ⬜ |
| TH-53 | `loadedDecorations` a `loadedFonts` jsou module-level singletonové Sety — reset mezi testy může být problém (testy izolují DOM ale ne JS modul state). Stale cache v hot-reload dev prostředí `[auto]` | M1 | ⬜ |
| TH-54 | `preloadBackground(url)` vytváří `new Image()` — funguje jako hint prohlížeči, ale není blokující. Pozadí se preloaduje okamžitě, ne lazy `[auto]` | M1 | ⬜ |
| TH-55 | Dekorační assety v `/public/themes/<id>/decor/` jsou odkazovány přes CSS tokeny (`--asset-logo`, `--asset-corner-ornament` atd.) — existuje fyzická konzistence asset souborů `[auto]` | M1 | ⬜ |

## G. Jednotlivá témata (21) — konzistence

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| TH-56 | `ikaros` skin (světový): `scope: 'world'`, `effect: 'matrix-rain'`, fialová synthwave paleta, `background` existuje, MatrixRain se renderuje ve WorldLayout `[auto]` | M1 (skin57a.spec.ts) | ⬜ |
| TH-57 | `magie` skin (platformový): `scope: 'platform'`, fialovo-ametystová paleta, žádný sdílený ornament s jiným skinem, 4 unikátní fonty (Quintessential/Macondo/Sorts Mill Goudy/Mea Culpa) `[human]` | M3 | ⬜ |
| TH-58 | `modre-nebe` skin: výchozí platformový motiv, zlaté heraldické ornamenty, anděl logo asset, `reducedMotion: 'safe'` ale decorations.css nemá `prefers-reduced-motion` guard pro stávající animace `[auto]` | M1 | ⬜ |
| TH-59 | Skiny generované přes `_skinBase.buildSkinVars` (ikaros + 11 žánrových) mají všechny SHARED tokeny (success/warning/danger barevná sada) — nepřepsány vlastní hodnotou bez záměru `[auto]` | M1 | ⬜ |
| TH-60 | Vizuální identita každého ze 21 platformových skinů odpovídá svému `atmosphere` popisku — žádný „copy-paste" pozadí nebo identické dekorace `[human]` | M3 (screenshot audit) | ⬜ |
| TH-61 | Platformový switch mezi motivy (modre-nebe → kyberpunk → magie → …) funguje bez reloadu — data-theme swap + CSS token swap je atomický `[human]` | M3 (manuální test) | ⬜ |
| TH-62 | Světový switch (WorldLayout unmount) restoruje uživatelův platformový motiv bez artefaktů — žádné reziduální world-theme CSS tokeny `[auto]` | M1 | ⬜ |

---

## Test coverage gaps

- `ThemeProvider` nemá žádný unit test — absence pokrytí pro: přiřazení `overrides`, `platformThemePreviewAtom` → `applyTheme`, `user.themeSettings` parsing.
- `useThemeSync` initial sync logika (`hadStoredThemeAtMount`, BE-wins vs LS-wins) nemá dedikovaný test — jen výstupní PATCH test.
- `ThemeSwitcher` nemá unit test — jen Storybook stories. Klávesnicová navigace, ARIA struktura, popover close-on-outside-click není testováno.
- `audit:contrast` skript testuje pouze hex (`#xxxxxx`) barvy — glass-surface témata (rgba) jsou z auditu vyloučena; žádné automatizované řešení pro kontrastní ověření rgba/var() hodnot.
- `applyTheme` singleton cache (`loadedDecorations`, `loadedFonts`) není resetována mezi vitest testy — může způsobit falešně pozitivní výsledky při testování lazy-load chování.
- `resolveWorldTheme` (worldTheme.ts) má testy, ale chybí test pro případ `world.themeId` = neplatný slug (falback na `ikaros`).
- Chybí E2E test pro pre-hydration skript (FOUT) — nelze snadno ověřit synchronním unit testem.

## Známá rizika

- **R1 — Kontrastní audit slepá místa (rgba skiny):** `audit:contrast` ověřuje jen hex hodnoty. Skiny jako `modre-nebe`, `magie`, `mesic` používají rgba glass surfaces pro bg-card — text-on-glass kontrast není automaticky ověřen. Při tmavém pozadí prosvítajícím skrz glass může kontrast klesnout pod 4.5:1 bez detekce.
- **R2 — ARIA role="option" na `<button>` uvnitř `<li>`:** WAI-ARIA 1.2 vyžaduje, aby role="option" byl přímým dítětem role="listbox". Struktura `ul[listbox] > li > button[option]` je technicky nevalidní. Screen readery mohou element ignorovat nebo jej oznamovat nesprávně.
- **R3 — BE themeId bez enumerace platných hodnot:** `UpdateUserDto.themeId` je jen `@IsString @MaxLength(64)` — BE uloží libovolný string (např. `"neexistujici-motiv"`). Při cross-device syncu se FE setThemeId na invalid slug, `getTheme` padne na fallback (modre-nebe), ale uložená hodnota v DB je corrupted. Chybí `@IsIn([...validThemeIds])` validace.
- **R4 — `JSON.stringify(overrides)` klíčové pořadí:** `overridesKey` v `ThemeProvider` používá `JSON.stringify` pro stabilizaci deps array. JS objekty nemají garantované pořadí klíčů napříč JS engines/verzemi. Pokud BE vrátí `themeOverrides` s jiným pořadím klíčů než při uložení, `overridesKey` se bude lišit → zbytečné re-volání `applyTheme`.
- **R5 — `modre-nebe` decorations bez reduced-motion guard:** Výchozí motiv platformy má animace v `decorations.css` (2 keyframes) ale chybí `@media (prefers-reduced-motion: reduce)` blok. Uživatelé s vestibulárními poruchami jsou vystaveni animacím i při systémovém nastavení „snížit pohyb".
