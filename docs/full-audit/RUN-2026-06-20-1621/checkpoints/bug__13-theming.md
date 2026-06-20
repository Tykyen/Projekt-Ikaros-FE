# bug / 13-theming — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem CELÝ záběr oblasti staticky (M1) + kontrakt BE↔FE (M2) + existující testy (M3):

- `src/themes/registry.ts` — THEMES, 33 motivů, DEFAULT_THEME, DEFAULT_WORLD_THEME, getTheme, listThemes
- `src/themes/types.ts` — ThemeId, ThemeScope, ThemeEffect, ThemeFonts, Theme type
- `src/themes/applyTheme.ts` — cleanup, CSS var aplikace, overrides, font lazy-load, decorations lazy-load, singleton sets
- `src/themes/state.ts` — themeAtom, worldThemePreviewAtom, platformThemePreviewAtom, worldThemeActiveAtom
- `src/themes/useTheme.ts` — setTheme→atom
- `src/themes/useThemeSync.ts` — initial sync (LS-wins vs BE-wins, hadStoredThemeAtMount), outbound PATCH debounced 500ms, cache invalidate
- `src/themes/ThemeProvider.tsx` — overridesKey JSON.stringify stabilizace, worldThemeActive guard
- `src/themes/ThemeSwitcher.tsx` — listThemes('platform'), keyboard nav, ARIA
- `src/themes/worldTheme.ts` — resolveWorldTheme, fallback ikaros
- `src/themes/effects/MatrixRain.tsx` — prefers-reduced-motion, visibilitychange, cleanup
- `src/themes/themes/_skinBase.ts` — SHARED konstanty, buildSkinVars
- `src/themes/themes/*/index.ts` — všech 33 motivů: scope, vars, fonts, thumbnail, background, reducedMotion
- `src/themes/themes/*/decorations.css` — scoping [data-theme="..."], keyframes, reduced-motion guard
- `src/app/layout/WorldLayout/WorldLayout.tsx` — worldThemeActive flag, applyTheme on mount/unmount, data-world-shell
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` — data-shell="ikaros", data-theme={themeId}
- `index.html` — pre-hydration script, Google Fonts preload
- `backend/src/modules/users/constants/theme-ids.ts` — BE THEME_IDS kopie (N-11 fix)
- `backend/src/modules/users/dto/update-user.dto.ts` — @IsIn(THEME_IDS) validace
- Testy: `__tests__/registry.test.ts`, `skin57a.spec.ts`, `applyTheme.test.ts`, `useThemeSync.test.tsx`, `useThemeSync.spec.tsx`, `ThemeProvider.test.tsx`, `useTheme.test.tsx`, `worldTheme.test.ts`
- Asset soubory: `/public/themes/thumbnails/` (33/33 OK), `/public/themes/backgrounds/` (33/33 OK)

### Co NEPROŠLO (vyžaduje živou infru / manuál):
- Kontrastní audit `audit:contrast` (hex vs rgba/var slepá místa) — TH-38/39 → PROOF-REQUEST
- Manuální vizuální audit skinů — TH-33/46/57/60/61 → [human]
- Pre-hydration FOUT test (e2e) — TH-30 → PROOF-REQUEST
- Screen reader / keyboard audit ThemeSwitcher — TH-44/45 → [human]

## Dosažená L vs cílová L

Cílová hloubka oblasti: **L3** (existující testy pokrývají kritické cesty).

| Oblast | Dosažená L | Poznámka |
|--------|-----------|---------|
| A. Registry & aplikace (TH-01..14) | **L3** | testy v registry.test.ts + skin57a.spec.ts + applyTheme.test.ts — všechny zelené (37/37) |
| B. Switcher & persistence (TH-15..26) | **L3** | useThemeSync.test.tsx + spec.tsx zelené; TH-17/21/22 částečně L2 (logika čtena) |
| C. FOUT prevence (TH-27..31) | **L2** | index.html zkontrolován staticky; klíče sedí; e2e FOUT test chybí |
| D. Theme isolation & scoping (TH-32..37) | **L2** | CSS staticky ověřeno; WorldLayout/IkarosLayout mount/unmount kód přečten |
| E. Accessibility (TH-38..46) | **L1/L2** | reduced-motion guard staticky; kontrast PROOF-REQUEST; TH-41/42/43 L2 |
| F. Asset pipeline (TH-47..55) | **L2** | filesystem verifikace 33+33 OK; lazy-load logika přečtena |
| G. Jednotlivá témata (TH-56..62) | **L2** | registry + CSS scoping ověřeny; vizuální [human] PROOF-REQUEST |

## Nálezy

### Potvrzené bugy

**N-42 — [E/TH-41] modre-nebe: @keyframes bez prefers-reduced-motion guardu**
`src/themes/themes/modre-nebe/decorations.css:248-254`
Motiv `modre-nebe` (výchozí platformový motiv, `reducedMotion: 'safe'`) má animaci `modre-nebe-nav-shimmer` na hover nav itemech — ale chybí `@media (prefers-reduced-motion: reduce)` blok zakazující ji. Ostatní motivy s heavy animacemi (temna-cerven, nemrtvi, sci-fi, ctyri-zivly, vesmirna-bitva) mají guard. Africke, arabsky-svet, mesic, magie, kyberpunk, hospoda, indiane, mystery, severske-runy, slunce, steampunk, vesmir, vesmirna-bitva, western, horor mají guard. Jen modre-nebe chybí.
Dopad: WCAG 2.3.3 porušení pro uživatele s vestibulárními poruchami na výchozím motivu.
Návrh: přidat `@media (prefers-reduced-motion: reduce) { [data-theme="modre-nebe"] [class*="navItem"]::after { animation: none; } }` · **🟡 L2** · 🆕

---

### Potenciální bugy / rizika (plán již eviduje jako R1–R5, konfirmace statické)

**♻️ R3 (TH-26) — BE themeId @IsIn** → **OPRAVENO** (N-11): `update-user.dto.ts:49` má `@IsIn(THEME_IDS)`. BE THEME_IDS = 33 motivů, sedí s FE THEMES. ✅L3

**♻️ R4 (TH-25) — overridesKey JSON.stringify klíčové pořadí**: `ThemeProvider.tsx:25` — staticky potvrzeno, jde o known risk, ne bug. ✅L1

**♻️ R5 (TH-41) — modre-nebe bez reduced-motion** → zaznamenáno jako N-42 výše.

---

### Drobné nesrovnalosti (pod prahem bugů)

**TH-INFO-1 — WorldLayout: overrides bez JSON.stringify stabilizace v deps**
`src/app/layout/WorldLayout/WorldLayout.tsx:412-413`
`applyTheme` je v useEffect s `overrides` objektem v deps (ne stringified klíč). `sharedOverrides = { ...resolved.overrides, ...membership.themeUserOverrides }` vytváří nový objekt na každý render → zbytečné volání `applyTheme` na každý re-render když membership existuje. ThemeProvider to správně řeší přes `overridesKey`. Funkčně to nevadí (applyTheme idempotentní), výkonnostně mírně neefektivní. Pod prahem bugů. 🆕 L1

**TH-INFO-2 — applyTheme: duplicitní klíče v lastAppliedKeys**
`src/themes/applyTheme.ts:69-78`
Pokud override-klíč je také v theme.vars, přidá se do `applied` dvakrát (jednou z theme.vars, jednou z overrides). Při cleanup se `removeProperty` zavolá dvakrát — harmless. Pod prahem bugů. 🆕 L1

**TH-INFO-3 — africke/decorations.css: @keyframes africke-heat-shimmer definován dvakrát**
`src/themes/themes/africke/decorations.css:57` a `:878`
Druhá definice je uvnitř `@media (max-width: 768px)` — záměrná redukce animace na mobilu (validní CSS). Není chyba, pouze neobvyklý pattern. 🆕 L1

**TH-INFO-4 — useThemeSync initial sync: edge case při BE bez themeId + LS = default**
`src/themes/useThemeSync.ts:38`
Pokud `userThemeId` je undefined (nový BE user bez themeId) a `hadStoredThemeAtMount=true` a LS = DEFAULT_THEME: funkce se vrátí early bez BE catchup (`!userThemeId` → return). Catchup sync se nespustí dokud user aktivně nezmění téma. V praxi: LS = default → žádný reálný problém. Pod prahem bugů. 🆕 L1

## PROOF-REQUEST

### PR-1 — Kontrastní audit rgba skinů
**Příkaz:** `npm run audit:contrast`
**Co dokáže:** ověří hex barvové páry; selže u rgba/var() hodnot (zahrnutí bílého overlaye přes glass surfaces)
**Co nedokáže:** glass-surface modre-nebe `bg-card=rgba(3,14,30,0.72)` → kontrast závisí na pozadí, nutný manuální test
**Cíl:** ověřit že alespoň hex barvy mají ≥ 4.5:1 (TH-38)
**Live infra:** ne, jen statická analýza hex barev — spustitelné lokálně

### PR-2 — Pre-hydration FOUT e2e test
**Příkaz:** Playwright/Cypress test: `page.goto('/'); page.evaluate(() => document.documentElement.getAttribute('data-theme'))` před JS load
**Co dokáže:** ověří TH-27/28/29/30 — data-theme je nastaven synchronně před React bundle
**Live infra:** ano (browser) — spustitelné lokálně s `playwright test`

### PR-3 — ThemeSwitcher keyboard + ARIA
**Příkaz:** manuální test nebo Playwright accessibility scan: `axe(page.locator('[aria-haspopup="listbox"]'))`
**Co dokáže:** ověří TH-44/45 — ArrowUp/Down navigace, role="option" na `<button>` uvnitř `<li>` (WAI-ARIA 1.2 conformance)
**Live infra:** browser
