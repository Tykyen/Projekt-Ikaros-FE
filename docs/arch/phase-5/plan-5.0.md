# Implementační plán 5.0 — Světový theme systém

**Spec:** [spec-5.0.md](spec-5.0.md)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE)
**Větev FE:** `feat/krok-5.0-world-theme` · **Větev BE:** `feat/krok-5.0a-world-themeid`

> ⚠️ **Revize (2026-05-17, po vizuálním smoke).** Dedikovaný „Matrix skin" (Task 3)
> a ruční výběr motivu ve wizardu (Task 7) byly **zrušeny**. Nově: motiv světa se
> **odvozuje ze žánru** (`genres.ts` 32 žánrů + `themeForGenre`), Matrix svět má
> jen vlastní pozadí. Task 3 níže (Matrix skin) je **neplatný** — neřiď se jím.
> Aktuální stav viz spec-5.0 §4.6 a commity `feat(svet): motiv světa odvozen ze žánru`.

---

## Task 1 — BE: `World` theme pole (repo `Projekt-ikaros`)

**Soubory:**
- Modify: `backend/src/modules/worlds/schemas/world.schema.ts`
- Modify: `backend/src/modules/worlds/dto/create-world.dto.ts`
- Modify: `backend/src/modules/worlds/dto/update-world.dto.ts`
- Modify: `backend/src/modules/worlds/interfaces/world.interface.ts` (+ entity mapper ve `worlds.service.ts` / repository)
- Modify: `backend/src/database/seed/matrix-world.seed.ts`
- Create: `backend/scripts/migrate-world-themeid.js` (nebo dle konvence migrací)

- [ ] **Step 1: Schema** — do `WorldSchemaClass` přidat:
  ```ts
  @Prop({ default: 'modre-nebe' }) themeId: string;
  @Prop({ type: Object, default: {} }) themeOverrides: Record<string, string>;
  @Prop() themeBackgroundUrl?: string;
  ```
- [ ] **Step 2: `CreateWorldDto`** — `@IsOptional() @IsString() themeId?: string;`
- [ ] **Step 3: `UpdateWorldDto`** — `themeId?` (`@IsOptional @IsString`), `themeOverrides?` (`@IsOptional @IsObject`), `themeBackgroundUrl?` (`@IsOptional @IsString`). Validace `themeOverrides`: vlastní validator nebo service-level guard — jen klíče `--theme-*`, max ~40 položek, hodnota string. Implementuj jako custom `@ValidateThemeOverrides` decorator nebo ořež v service.
- [ ] **Step 4: World interface + entity mapper** — přidat 3 pole do `World` interface; mapper world-doc → entity je doplnit (jinak se nevrátí v `GET /worlds/:id` ani `/slug/:slug`). Ověřit `findBySlugForRequester` i `findOne`.
- [ ] **Step 5: `MatrixWorldSeed`** — seedovaný Matrix svět dostane `themeId: 'matrix'`. Idempotentní — pokud svět existuje a `themeId` chybí, doplnit.
- [ ] **Step 6: Migrace** — skript pro běžící DB: `worlds` bez `themeId` → `'modre-nebe'`; Matrix svět (dle slugu `matrix`) → `'matrix'`. Idempotentní.
- [ ] **Step 7:** `cd backend && npx tsc --noEmit` + `npx jest --no-coverage` → ✓
- [ ] **Step 8: Commit** — `feat(worlds): themeId/themeOverrides/themeBackgroundUrl na World (krok 5.0a)`

**Acceptance:** spec #1, #2, #3.

---

## Task 2 — FE: typy + theme scope

**Soubory:**
- Modify: `src/shared/types/index.ts`
- Modify: `src/themes/types.ts`

- [ ] **Step 1:** `World` interface (`index.ts:302`) — přidat `themeId?: string; themeOverrides?: Record<string,string>; themeBackgroundUrl?: string;`
- [ ] **Step 2:** `ThemeScope` — `'platform' | 'world' | 'both'`.
- [ ] **Step 3:** `ThemeId` union — přidat `| 'matrix'`.
- [ ] **Step 4:** `tsc` → ✓ (registry zatím chybí `matrix` → dokončí Task 3; commit až s Task 3).

---

## Task 3 — Matrix skin

**Soubory:**
- Create: `src/themes/themes/matrix/index.ts`
- Create: `src/themes/themes/matrix/decorations.css`
- Modify: `src/themes/registry.ts`
- Asset: hotové v `C:\Matrix\Matrix\frontend\public\` — `matrix-bg.png` (953 KB, pozadí), `matrix-logo.png` (logo). Zkopírovat + `themes:optimize` → `public/themes/backgrounds/matrix.webp`, `public/themes/thumbnails/matrix.webp`, `public/themes/matrix/decor/logo.webp`. **Negenerovat nic nového — pozadí existuje.**

- [ ] **Step 1: `index.ts`** — `matrixTheme: Theme`, `id: 'matrix'`, `scope: 'world'`, `name: 'Matrix'`. Tokeny dle [audit §1](audit-5.0-matrix-skin.md) — mapování `--mx-*` → `--theme-*`. Doplnit:
  - fonty: `logo/display: 'Unbounded'`, `body: 'Exo 2'`; `vars` `--font-logo/-display/-body` odpovídající.
  - semantické stavy: `--success` z `--mx-diary-green`, `--danger` z `--mx-diary-red`, `--warning`/`--info` odvodit.
  - `--theme-accent-bright` ≈ `#e0a8ff`.
  - legacy aliasy (`--bg-*`, `--accent*`, `--text-*`, `--border*`) dle vzoru `kyberpunk/index.ts`.
  - ornamenty inline SVG přes `svg()` helper (vzor kyberpunk) — viz Step 2.
- [ ] **Step 2: `decorations.css`** — ornamentální jazyk „dimenzionální glass / rift" ([audit §2](audit-5.0-matrix-skin.md)): prizmatická refrakce okrajů panelů (violet→cyan statický gradient), konstelační síť (tenké linie + uzly), diagonální rift glow v `[data-theme="matrix"]::before` overlay, glass `backdrop-filter: blur`. Scoped `[data-theme="matrix"]`. **Žádná recyklace kyberpunku** (rain/HUD/CJK/flicker zakázány — memory `feedback_skin_originality`).
- [ ] **Step 3:** `registry.ts` — import `matrixTheme`, přidat do `THEMES`. Pozn.: `scope: 'world'` → neobjeví se v platformním switcheru, jen v `listThemes('world')`.
- [ ] **Step 4:** zkopírovat `matrix-bg.png` + `matrix-logo.png` z `C:\Matrix\Matrix\frontend\public\`, spustit `npm run themes:optimize` (background + thumbnail + logo). Pozadí už hotové — jen optimalizace na WebP.
- [ ] **Step 5:** `lint:colors` + `tsc` → ✓.
- [ ] **Step 6: Commit** — `feat(themes): Matrix skin — dimenzionální glass (krok 5.0)` (zahrnuje i Task 2).

**Acceptance:** spec #11, #15; audit §4. `frontend-design` směr odsouhlasen 2026-05-17.

---

## Task 4 — `applyTheme` rozšíření + `worldThemeAtom` + `useWorldTheme`

**Soubory:**
- Modify: `src/themes/applyTheme.ts`
- Modify: `src/themes/state.ts`
- Create: `src/themes/useWorldTheme.ts`

- [ ] **Step 1: `applyTheme.ts`** — rozšířit signaturu (zpětně kompatibilní):
  ```ts
  export async function applyTheme(
    id: string,
    opts?: { overrides?: Record<string,string>; backgroundUrl?: string },
  ): Promise<void>
  ```
  - Před zápisem `theme.vars` **vyčistit dříve nastavené `--theme-*` inline properties** na `documentElement` (iterovat `documentElement.style`, `removeProperty` u `--theme-*` / override klíčů) — jinak override z předchozího motivu „visí".
  - Po `theme.vars` zapsat `opts.overrides` (custom theme vrstva, 5.0d).
  - `opts.backgroundUrl` → `preloadBackground`.
  - Aplikace zůstává na `:root` (`documentElement`) — žádný element-scoping.
- [ ] **Step 2: `state.ts`** — `worldThemeAtom` přepsat z `atom<ThemeId|null>` na `atom<{themeId:string; overrides?:Record<string,string>; backgroundUrl?:string} | null>`. localStorage klíč `ikaros.world-theme.<worldId>`.
- [ ] **Step 3: `useWorldTheme(world)`** hook — vstup `World | null`; výstup `{ themeId, overrides, backgroundUrl, setOverride, reset }`:
  - aktivní = localStorage override (`ikaros.world-theme.<worldId>`) → fallback `world.themeId` + `world.themeOverrides` + `world.themeBackgroundUrl`.
  - `setOverride(themeId)` zapíše do localStorage; `reset()` smaže klíč.
  - neznámé `themeId` → `getTheme` fallbackuje na `DEFAULT_THEME`.
- [ ] **Step 4:** `tsc` → ✓ (unit testy v Task 9).
- [ ] **Step 5: Commit** — `feat(themes): applyTheme opts + useWorldTheme (krok 5.0b)`

**Acceptance:** spec #6, #8, #9, #10.

---

## Task 5 — `WorldLayout` napojení

**Soubory:**
- Modify: `src/app/layout/WorldLayout/WorldLayout.tsx`
- Modify: `src/app/layout/WorldLayout/WorldLayout.module.css` (dle potřeby)

- [ ] **Step 1:** `WorldLayout` přestane pro `.shell` číst globální `themeAtom` (ř. 150–154). Místo:
  - `const { themeId, overrides, backgroundUrl } = useWorldTheme(world)`.
  - `globalThemeId = useAtomValue(themeAtom)` → uložit do `useRef`, aby cleanup closure měl aktuální hodnotu.
  - `useEffect([themeId, overrides, backgroundUrl])` → `applyTheme(themeId, { overrides, backgroundUrl })`; **cleanup** → `applyTheme(globalThemeIdRef.current)` (obnova při EXIT/unmountu).
  - efekt běží až když `world` doběhlo (`!loading && world`) — během loadingu zůstává globální motiv.
  - `bgStyle` z `backgroundUrl ?? getTheme(themeId).background`.
  - `data-theme={themeId}` v JSX `.shell` ponechat jako SSR-safe default; `:root` autoritativně řídí `applyTheme`.
- [ ] **Step 2:** ověřit, že `ThemeProvider` (`:root` ovladač přes `themeAtom`) nekoliduje — efekt `ThemeProvider` má dep `[themeId]` z `themeAtom`, ten se ve světě nemění → žádný souběžný zápis na `:root`.
- [ ] **Step 3:** `tsc` + `lint` → ✓.
- [ ] **Step 4: Commit** — `feat(world): WorldLayout přepíná :root na motiv světa (krok 5.0c)`

**Acceptance:** spec #7, #12.

---

## Task 6 — Preset switcher „Vzhled světa"

**Soubory:**
- Create: `src/features/world/components/WorldThemeSwitcher/` (`.tsx`, `.module.css`, `index.ts`)
- Modify: `src/app/layout/WorldLayout/WorldLayout.tsx` (umístění do `actions`)

- [ ] **Step 1:** `WorldThemeSwitcher` — tlačítko/ikona v headeru `WorldLayout` (`actions` blok, vedle pošty). Klik → popover/dropdown s `listThemes('world')` (thumbnaily + název) + položka „Reset na výchozí".
- [ ] **Step 2:** výběr → `useWorldTheme().setOverride(id)`; Reset → `reset()`. Aktivní motiv vizuálně označen.
- [ ] **Step 3:** mobil — dostupný i v drawer / touch target ≥ 44px.
- [ ] **Step 4:** žádné hardcoded barvy — skin tokeny.
- [ ] **Step 5: Commit** — `feat(world): preset switcher Vzhled světa (krok 5.0e)`

**Acceptance:** spec #10b.

---

## Task 7 — Create-world wizard: výběr motivu

**Soubory:**
- Create: `src/features/ikaros/pages/CreateWorldPage/components/ThemeSection.tsx` (+ CSS dle vzoru `GenreSection`)
- Modify: `src/features/ikaros/pages/CreateWorldPage/CreateWorldPage.tsx` (form state + řazení sekce)
- Modify: create-world hook / submit payload (`hooks/`) — poslat `themeId`

- [ ] **Step 1:** `ThemeSection` — výběr motivu z `listThemes('world')`, náhled thumbnailu, vzor `SectionCard` + `PillChips`/grid. Default zvolený `modre-nebe`.
- [ ] **Step 2:** napojit do form state `CreateWorldPage`; `POST /worlds` payload nese `themeId`.
- [ ] **Step 3:** `tsc` + `lint` → ✓.
- [ ] **Step 4: Commit** — `feat(svet): výběr motivu ve wizardu tvorby světa (krok 5.0)`

**Acceptance:** spec #3b.

---

## Task 8 — Ověření theme swapu

Riziko kolize ornamentů **eliminováno designem** (`:root` swap místo `.shell`-scopingu — [spec §4.2](spec-5.0.md)). Tento task je už jen ověřovací.

- [ ] **Step 1:** dev — platforma na motivu A, vstup do světa s motivem B (≠ A) → svět = B, žádné ornamenty A; `:root` `data-theme` = B.
- [ ] **Step 2:** otevřít modal/dropdown uvnitř světa → dědí motiv B (portál do `body`, `:root` swap ho pokrývá).
- [ ] **Step 3:** `EXIT` → `:root` zpět na A; žádný reziduální `--theme-*` / override token na `documentElement`.
- [ ] **Step 4:** přepnout user override (Task 6) → motiv se mění; Reset → zpět na `world.themeId`.

**Acceptance:** spec #12, #13.

---

## Task 9 — Testy, lint, mobil-desktop, nápověda

- [ ] **Step 1: FE testy** (Vitest+RTL) — dle [spec §7](spec-5.0.md):
  - `applyTheme` — `overrides` přebijí `vars`; staré `--theme-*` properties vyčištěné před zápisem; `data-theme` nastaven na `:root`.
  - `listThemes('world')` — vrací `world`+`both`, vynechá `platform`.
  - `useWorldTheme` — localStorage override > `World` základ > fallback; `reset()` maže klíč.
  - `WorldLayout` — efekt zavolá `applyTheme` s `world.themeId`; cleanup obnoví globální motiv; override přebije.
  - `getTheme('matrix')` v `THEMES`.
- [ ] **Step 2: BE testy** — `UpdateWorldDto`/`CreateWorldDto` validace; mapper vrací theme pole.
- [ ] **Step 3:** `lint`, `lint:colors`, `tsc`, `build`, `test:run` (FE) → ✓.
- [ ] **Step 4: `mobil-desktop`** audit — `WorldLayout` se světovým pozadím + `WorldThemeSwitcher` + `ThemeSection` ve wizardu; ≤768 / 769–1024 / >1024.
- [ ] **Step 5: `napoveda`** — aktualizovat `/ikaros/napoveda`: světový theme (PJ volí motiv při tvorbě světa) + osobní override „Vzhled světa".
- [ ] **Step 6: Commit** — `test(world): krok 5.0 — testy + úklid` + `docs(napoveda): světový theme systém`.

**Acceptance:** spec #14, #16, #17, #18.

---

## Závěrečné ověření

- [ ] FE: `lint` · `lint:colors` · `tsc` · `build` · `test:run` ✓
- [ ] BE: `tsc` · `jest` ✓
- [ ] Smoke dle [spec §7](spec-5.0.md) — Matrix svět = Matrix skin; preset switcher; override + Reset; `EXIT` → platforma zpět; mobil.
- [ ] Roadmap `docs/roadmap-fe.md` — odškrtat 5.0 a podkroky 5.0a–5.0e.
- [ ] Acceptance #1–#18 splněna.

---

## Odhad

~26 souborů, ~5 commitů FE + 1 BE. Riziko kolize decorations eliminováno designem (`:root` swap). Nejnáročnější tvůrčí část: **Matrix skin `decorations.css`** (Task 3).
