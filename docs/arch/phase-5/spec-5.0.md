# Spec 5.0 — Světový theme systém

**Status:** 🟡 Návrh — čeká na schválení
**Rozsah:** FE (infra + aplikace + custom theme + user override + Matrix skin) **+ BE** (`World` schema — jediný BE krok fáze 5)
**Repo:** `Projekt-ikaros-FE` (hlavní) + `Projekt-ikaros` (BE, krok 5.0a)
**Velikost:** odhad ~26–32 souborů — BE schema/DTO/migrace (~5) · FE theme infra (~6) · WorldLayout napojení + preset switcher (~5) · create-world wizard (~2) · Matrix skin (~3) · custom-theme typy (~2) · testy (~7)
**Autor:** PJ + Claude
**Datum:** 2026-05-17
**Souvisí:** [spec-5.1.md](spec-5.1.md) (WorldLayout — shell připravený přijmout theme), roadmapa fáze 5 (`docs/roadmap-fe.md` ř. 848–863), krok 1.0 (theme infra — `THEMES`, `applyTheme`, `_shared/tokens.css`)

---

## 1. Cíl

Dát každému světu **vlastní vizuální styl**, nezávislý na globálním tématu platformy Ikaros. Uvnitř `WorldLayout` (a všech jeho stránek včetně budoucího světového chatu) se vykreslí motiv světa; mimo `WorldLayout` zůstává platforma na globálním `themeAtom` uživatele.

Theme světa je **dvouvrstvý** (rozhodnutí autora 2026-05-17):

1. **Sdílený základ** — PJ nastaví na `World` (kanonický vzhled světa, default pro všechny členy). Buď preset z 21 motivů, nebo **vlastní (custom) theme** — vlastní pozadí + override barev a stínů.
2. **Uživatelský override** — každý člen si vzhled světa pro sebe může přenastavit (jiný preset / vlastní úpravy). Per zařízení (localStorage). „Reset" vrací na sdílený základ PJ.

Motiv světa se **odvozuje z jeho žánru** (jako ve starém Matrixu — mapa žánr→skin). Svět Matrix má navíc **vlastní pozadí** (`matrix-bg`).

---

## 2. Kontext / motivace

Krok 1.0 postavil platformní theme systém: registry `THEMES` (21 motivů), `applyTheme` (zapisuje CSS tokeny na `:root`, nastaví `data-theme`, lazy-loaduje `decorations.css` + fonty), `themeAtom` (jotai + localStorage + BE sync přes `useThemeSync`). `WorldLayout` z kroku 5.1 už je „theme-ready" — `.shell` nese `data-theme` a `bgStyle`, dnes ale čte **globální** `themeAtom`.

`src/themes/state.ts` má rezervovaný `worldThemeAtom` (`atom<ThemeId | null>(null)`) — zaveden v 1.0 jako placeholder přesně pro tento krok.

Bez 5.0 vypadá každý svět stejně jako platforma uživatele — svět nemá identitu. Starý Matrix přitom měl výrazný vlastní vzhled (violet + cyan glass). 5.0 tuto identitu vrací a zobecňuje na libovolný svět.

> 💡 **Proč „dvouvrstvý":** PJ chce garantovat kanonický vzhled světa (atmosféra příběhu), ale ne každému hráči musí sednout. Sdílený základ + osobní override je kompromis — svět má identitu, hráč má pohodlí.

---

## 3. Audit současného stavu

### Theme infra — [`src/themes/`](../../../src/themes/)

- **`registry.ts`** — `THEMES: Record<ThemeId, Theme>` (21 motivů), `DEFAULT_THEME = 'modre-nebe'`, `getTheme(id)` (fallback na default), `listThemes(scope?)` (filtr `scope === scope || 'both'`).
- **`types.ts`** — `ThemeScope = 'platform' | 'both'`; `Theme` = `{ id, name, scope, atmosphere, vars, fonts, thumbnail, background, decorationsModule, reducedMotion? }`. `ThemeId` = union 21 literálů.
- **`applyTheme.ts`** — `applyTheme(id)`: `document.documentElement.setAttribute('data-theme', …)`, zapíše `theme.vars` na `documentElement.style`, lazy-load decorations + fonty, preload pozadí. **Cílí výhradně `:root`.**
- **`state.ts`** — `themeAtom` (atomWithStorage `ikaros.theme`), `worldThemeAtom` (`atom<ThemeId|null>(null)` — rezervovaný, nevyužitý).
- **`ThemeProvider.tsx`** — efekt `applyTheme(themeId)` na změnu `themeAtom` + `useThemeSync`.
- **`useThemeSync.ts`** — obousměrný sync `themeAtom` ↔ BE `user.themeId` (debounced PATCH `/users/me`).
- **`themes/<id>/`** — každý motiv: `index.ts` (`Theme` objekt) + `decorations.css` (ornamenty).

### decorations.css — scoping (⚠️ klíčové)

`decorations.css` každého motivu cílí selektorem `[data-theme="<id>"] …` (např. `[data-theme="modre-nebe"] header::after`). Atributový selektor matchuje **jakýkoli element** s tím atributem a jeho potomky — ne nutně `:root`. Některé selektory přidávají `[data-shell="ikaros"]`.

### WorldLayout — [`src/app/layout/WorldLayout/WorldLayout.tsx`](../../../src/app/layout/WorldLayout/WorldLayout.tsx)

- ř. 150–154: `themeId = useAtomValue(themeAtom)` (globální), `theme = getTheme(themeId)`, `bgStyle` z `theme.background`.
- ř. 170: `<div className={s.shell} data-theme={themeId} style={bgStyle}>` — `.shell` **už nese `data-theme`** a inline `background`.
- `.shell` **nemá `data-shell`** atribut (platformní layout ho má — `data-shell="ikaros"`).

### WorldContext — [`src/features/world/context/WorldContext.tsx`](../../../src/features/world/context/WorldContext.tsx)

- `WorldContextValue` = `worldId, worldSlug, world, isPJ, userRole, character, loading`. `world: World | null` — odsud se vezme `themeId` světa.

### BE — `World` schema ([`Projekt-ikaros` `world.schema.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world.schema.ts))

- `WorldSchemaClass`: `name, slug, description, imageUrl, genre, tones, playersWanted, playerCount, maxPlayers, dice, system, ownerId, isActive, accessMode, offeredCharacters, calendarConfig, favoritePageSlugs`.
- **Chybí:** `themeId`, `themeOverrides`, `themeBackgroundUrl`.
- `UpdateWorldDto` — bez theme polí.
- FE typ `World` (`src/shared/types/index.ts:302`) — také bez theme polí.

### Starý Matrix design — `C:\Matrix\Matrix\frontend\src\styles\matrix.tokens.scss`

Kompletní `--mx-*` token systém: violet (`#c86dff`) + cyan (`#3fe0ff`) akcenty, tmavé ink pozadí, glass surfaces, 3D karty, glow CTA. Zdroj pro Matrix skin (sekce 4.6).

---

## 4. Návrh řešení

### 4.0 Rozhodnutí autora (2026-05-17)

> **Revize (2026-05-17, po vizuálním smoke).** Původní rozhodnutí B (dedikovaný „Matrix skin") a D (PJ ručně volí motiv z dlaždic) byla **zrušena**. Nahrazena revidovanými rozhodnutími níže — motiv se odvozuje ze žánru světa, věrně starému Matrixu.

| # | Rozhodnutí |
|---|---|
| A | **Sada motivů:** reuse 21 globálních (= staré Matrix skiny přeložené). `ThemeScope` rozšířen o `'world'`; všechny motivy `scope: 'both'`. Žádná nová sada. |
| B | **Motiv se odvozuje ze žánru světa.** Starý Matrix měl mapu žánr→skin. Krok 5.0 ji obnovuje: 32 žánrů (`genres.ts`), každý má výchozí `theme`. Žádný dedikovaný „Matrix skin" — zrušeno. |
| C | **Uživatelský override (5.0e):** jen localStorage, per zařízení. Žádný BE / cross-device sync. |
| D | **`themeId` = žánrový default + ruční přepis.** Wizard `/ikaros/vytvorit-svet` neukazuje mřížku motivů — ukáže motiv **odvozený ze zvoleného žánru** (`themeForGenre`); PJ ho může přepsat výběrem z 21. Uloží se výsledný `themeId`. |
| E | **5.0 přidá lehký preset switcher** „Vzhled světa" do headeru `WorldLayout` — hráč si pro sebe přepne mezi 21 motivy (osobní override). Plný editor (color pickery, upload pozadí) až 5.3f. |
| F | **Matrix svět** = motiv ze žánru jako každý jiný + **vlastní pozadí** (`themeBackgroundUrl` na `matrix-bg.webp`, nastaví `MatrixWorldSeed`). |

### 4.1 BE — `World` theme pole (5.0a) — repo `Projekt-ikaros`

`World` schema dostane 3 pole:

```ts
@Prop({ default: 'modre-nebe' }) themeId: string;
@Prop({ type: Object, default: {} }) themeOverrides: Record<string, string>;
@Prop() themeBackgroundUrl?: string;
```

- `themeId` — id motivu světa (jeden z 21). Wizard ho odvodí ze žánru (`themeForGenre`), PJ může přepsat; schema default `'modre-nebe'` = fallback.
- `themeOverrides` — mapa CSS token → hodnota; vrství se nad `themeId` (custom theme, 5.0d). Prázdná = čistý preset.
- `themeBackgroundUrl` — URL vlastního pozadí (custom theme, 5.0d / Matrix svět). Prázdné = pozadí z presetu.

**`UpdateWorldDto`** — přidat `themeId?` (`@IsString`), `themeOverrides?` (`@IsObject`), `themeBackgroundUrl?` (`@IsOptional @IsString`). Hodnoty `themeOverrides` sanitizovány v service (`sanitizeThemeOverrides` — jen `--theme-*` klíče, max 60).

**`CreateWorldDto`** — přidat `themeId?` (`@IsOptional @IsString`) — wizard pošle motiv odvozený ze žánru (nebo ruční přepis). Bez hodnoty → schema default.

**FE — create-world wizard** (`/ikaros/vytvorit-svet`, krok 2.3) — `ThemeSection` ukáže motiv **odvozený ze zvoleného žánru** (`themeForGenre`); PJ ho může přepsat výběrem z 21. Posílá výsledný `themeId` v `POST /worlds`.

**Migrace** — existující světy bez `themeId` dostanou default `'modre-nebe'`. Seedovaný svět **Matrix** dostane `themeBackgroundUrl` na `matrix-bg.webp` (`MatrixWorldSeed`, idempotentní).

**Odpověď z API** — `themeId / themeOverrides / themeBackgroundUrl` vracené v `GET /worlds/:id` i `GET /worlds/slug/:slug` (mapper world→DTO).

**FE typ** — `World` (`src/shared/types/index.ts`) rozšířit o tytéž 3 volitelné fieldy.

### 4.2 FE infra — rozšíření `applyTheme` + `worldThemeAtom` (5.0b)

**`ThemeScope`** rozšířit: `'platform' | 'world' | 'both'`. `listThemes('world')` vrátí motivy se `scope` `'world'` nebo `'both'`. Rozhodnutí A → všech 21 motivů ponese `'both'`; Matrix skin `'world'` (jen pro světy).

Světový theme se aplikuje **přepnutím globálního `:root` motivu**, ne scopováním na `.shell`. Když je `WorldLayout` aktivní, zabírá celý viewport — žádná část platformy není vidět souběžně. Přepnutí `:root` proto neruší žádné UX a má tři výhody oproti `.shell`-scopingu:

1. **Žádná kolize ornamentů** — v každý okamžik nese `data-theme` jediný motiv; `decorations.css` se nepřekrývají.
2. **Pokrývá portály** — modaly, dropdowny, toasty, lightbox se renderují React portálem do `document.body`, **mimo `.shell`**. `.shell`-scoped tokeny by je nepokryly → modal otevřený ve světě by měl platformní vzhled. `:root` swap je pokryje automaticky.
3. **Reuse infry** — žádný nový scoping mechanismus, žádný přepis 21 `decorations.css`, žádný atribut `data-world-theme`.

**`applyTheme`** rozšířit o volitelné opts (zpětně kompatibilní):

```ts
applyTheme(
  id: string,
  opts?: { overrides?: Record<string,string>; backgroundUrl?: string },
): Promise<void>
```

- `overrides` — zapsané na `:root` **po** `theme.vars` (custom theme vrstva, 5.0d).
- Před zápisem **vyčistit dříve nastavené `--theme-*` inline properties** — jinak override z předchozího motivu „visí" (token, který nový motiv nedefinuje).
- `backgroundUrl` — preload; skutečné pozadí aplikuje `WorldLayout` přes `bgStyle`.

> 🔀 **Odklon od roadmapy.** Roadmapa 5.0b/c navrhuje `applyWorldTheme` scoped na `.shell` + atribut `data-world-theme`. Tento návrh to **vědomě mění** na `:root` swap — důvody výše (portály + kolize ornamentů + reuse). Žádná samostatná `applyWorldTheme` funkce; volá se `applyTheme` s opts.

**`worldThemeAtom`** — rozšířit z `ThemeId | null` na strukturu, ať pojme override i fallback:

```ts
worldThemeAtom: { themeId, overrides?, backgroundUrl? } | null
```

Hodnota = **uživatelský override** (5.0e, localStorage keyed `worldId`) **nebo** sdílený základ z `World` (`WorldContext`) jako fallback. Přesný tvar atomu doladí impl. plán.

### 4.3 FE aplikace — `WorldLayout` (5.0c)

`WorldLayout` při vstupu do světa přepne globální motiv na motiv světa, při odchodu obnoví uživatelův:

1. `useWorldTheme(world)` hook — spočítá aktivní motiv světa: `localStorage` override (5.0e) → fallback `world.themeId` + `world.themeOverrides` + `world.themeBackgroundUrl` z `WorldContext`.
2. **Mount / world load:** efekt zavolá `applyTheme(worldThemeId, { overrides, backgroundUrl })`.
3. **Unmount (EXIT) / odchod:** cleanup obnoví `applyTheme(globalThemeId)` — `globalThemeId` z `themeAtom`, čtený přes `ref`, aby cleanup closure měl aktuální hodnotu.
4. `ThemeProvider` (`:root` ovladač přes `themeAtom`) nepřeběhne, dokud se `themeAtom` nezmění — uživatel globální theme ze světa měnit nemůže (globální switcher je platformní) → žádný konflikt dvou ovladačů `:root`.
5. Během načítání světa (`world == null`) zůstává globální motiv; po načtení se přepne (drobné přebliknutí přijatelné, krátké u cache hitu).
6. `.shell` `data-theme` v JSX = `worldThemeId` (SSR-safe default); `applyTheme` ho autoritativně řídí na `:root`.
7. `bgStyle` `.shell` = `backgroundUrl ?? getTheme(worldThemeId).background`.

### 4.4 Custom theme světa (5.0d)

PJ může místo presetu sestavit vlastní vzhled — uloženo do `World.themeOverrides` (token→hodnota) + `World.themeBackgroundUrl`:

- **Datová stránka (5.0d, tato spec):** `applyTheme(id, opts)` umí `overrides` vrstvit nad zvolený preset; BE pole + DTO + API z 4.1; FE typ.
- **Editor UI (selektor + color pickery + upload pozadí + živý náhled):** je **krok 5.3f** — mimo rozsah 5.0. 5.0 dodá jen *runtime* — když `World` overrides obsahuje, aplikují se. Naplnění overrides UI přijde v 5.3.
- Override sada = whitelist `--theme-*` tokenů (barvy, `--theme-shadow*`, `--theme-glow*`). Přesný whitelist → impl. plán.

### 4.5 Uživatelský override (5.0e)

- Klíč `localStorage`: `ikaros.world-theme.<worldId>` → `{ themeId, overrides?, backgroundUrl? }`.
- Přítomný klíč → override vyhrává nad `World` základem; chybí → fallback na sdílený základ.
- „Reset" — smaže klíč, vrací na sdílený základ PJ.
- **Preset switcher** (rozhodnutí E) — tlačítko / položka „Vzhled světa" v headeru `WorldLayout` otevře jednoduchý výběr z 21 motivů (`listThemes('world')`, thumbnaily) + „Reset na výchozí". Volba zapíše override do localStorage → `WorldLayout` překreslí. Plný editor (color pickery, upload pozadí) sdílí UI s 5.3f — mimo 5.0.
- Žádný BE — per zařízení (rozhodnutí C).

### 4.6 Žánr → motiv (rozhodnutí B)

Starý Matrix měl mapu `GENRE_TO_SKIN` (32 žánrů → ~21 skinů). Krok 5.0 ji obnovuje na 21 motivů Ikara:

- **`genres.ts`** — `GENRES: GenreOption[]` (32 žánrů ze starého Matrixu — Fantasy, Dark fantasy, Heroic fantasy, Space opera, Cyberpunk, Biopunk, …). Každý `GenreOption` = `{ label, description, theme: ThemeId }`.
- **`themeForGenre(genre)`** — vrátí výchozí motiv pro žánr; neznámý / `Vlastní` → `GENRE_FALLBACK_THEME` (`modre-nebe`).
- `world.genre` ukládá `label` (zpětně kompatibilní); mapa je keyed labelem.
- Žádný dedikovaný „Matrix skin" — Matrix svět dostává motiv ze žánru + vlastní pozadí (rozhodnutí F).
- Nevyužité motivy (`zlaty-standard`, `africke`, `arabsky-svet`) — dostupné jen ručním přepisem ve wizardu / přes switcher.

### 4.7 Kontrast guard

Po sestavení world theme ověřit čitelnost UI prvků (chat barvy zpráv, badge, text) vůči světovému pozadí. V 5.0 = manuální audit + případný util `assertContrast` použitý v custom-theme editoru (5.3f). MVP: dokumentovat min. kontrastní poměr; automatický guard → 5.3f.

---

## 5. Out of scope

- **Editor world theme UI** (preset selektor + color pickery + upload pozadí + živý náhled) — **krok 5.3f**. 5.0 dodá jen runtime aplikaci a datový model.
- **Cross-device sync user override** — rozhodnutí C: jen localStorage.
- **Nová sada světových skinů** — rozhodnutí A: reuse 21 globálních. Žádný dedikovaný Matrix skin.
- **Headline / menu builder** — fáze 12.
- **Automatický kontrast guard** v editoru — krok 5.3f.
- **BE sync `themeId` jako u `useThemeSync`** — world theme základ se mění jen přes 5.3f (PATCH `/worlds/:id`), žádný debounced auto-sync.

---

## 6. Acceptance kritéria

1. BE `World` má `themeId` (default `modre-nebe`), `themeOverrides` (default `{}`), `themeBackgroundUrl?`; vracené v `GET /worlds/:id` i `/slug/:slug`.
2. `UpdateWorldDto` i `CreateWorldDto` přijímají `themeId`; `UpdateWorldDto` i `themeOverrides / themeBackgroundUrl`; nevalidní `themeOverrides` klíče odmítnuty.
3. Migrace: existující světy mají default `themeId`; seedovaný Matrix má `themeBackgroundUrl` = `matrix-bg.webp`.
3b. Create-world wizard (krok 2.3) — `ThemeSection` ukáže motiv odvozený ze žánru (`themeForGenre`) s možností přepisu; výsledný `themeId` se uloží při `POST /worlds`.
3c. `genres.ts` má 32 žánrů, každý s `theme`; `themeForGenre` mapuje žánr→motiv s fallbackem.
4. FE typ `World` rozšířen o 3 theme pole.
5. `ThemeScope` = `'platform' | 'world' | 'both'`; `listThemes('world')` vrací motivy `world`+`both`.
6. `applyTheme(id, opts?)` přijímá `overrides` + `backgroundUrl`; před zápisem čistí staré `--theme-*` inline properties.
7. `WorldLayout` při vstupu přepne `:root` na motiv světa (`world.themeId`); platforma se vykresluje motivem světa po dobu pobytu ve světě.
8. `themeOverrides` světa se vrství nad preset (custom theme runtime funguje).
9. `themeBackgroundUrl` světa přebije pozadí presetu.
10. Uživatelský override (localStorage `ikaros.world-theme.<worldId>`) přebije sdílený základ; „Reset" vrací na základ.
10b. Header `WorldLayout` má preset switcher „Vzhled světa" — výběr z 21 motivů + Reset; volba se okamžitě projeví.
11. Svět Matrix se vykreslí motivem ze žánru + vlastním pozadím (`themeBackgroundUrl`); žádný dedikovaný `matrix` motiv.
12. Odchod ze světa (`EXIT`) → `:root` obnoven na globální motiv uživatele; žádný reziduální world token / override na `:root`.
13. V každý okamžik je na `:root` aktivní jediný motiv (`data-theme`) — žádné překrývání decorations platforma×svět; modaly/portály otevřené ve světě dědí motiv světa.
14. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓ (FE) — `tsc` + `jest` ✓ (BE).
15. Žádný hardcoded barevný literál v komponentách (`lint:colors`).
16. Mobil (≤768) i tablet (769–1024) ověřen — světové pozadí + tokeny drží.
17. Stránka `Nápověda` aktualizována — světový theme (odvozen ze žánru) + osobní override světa.

---

## 7. Test plán

### Automated

**BE (jest):**
- `UpdateWorldDto` — validace `themeId / themeOverrides / themeBackgroundUrl`.
- `WorldsService` — `update` propíše theme pole; mapper world→DTO je vrací.

**FE (Vitest + RTL):**
- `applyWorldTheme` — zapíše `vars` na předaný element (ne `documentElement`); `overrides` přebijí `vars`; `data-theme` nastaven.
- `listThemes('world')` — vrací `world`+`both`, vynechá `platform`.
- `worldThemeAtom` resolver — localStorage override > `World` základ > fallback.
- `WorldLayout` — `.shell` má `data-theme` = `world.themeId`; override z localStorage přebije.
- `themeForGenre` — známý žánr → správný motiv; neznámý → `modre-nebe` fallback.
- Odhad: **+10–14 testů** (FE+BE).

### Manuální smoke

- Vstup do světa Matrix → Matrix skin (violet/cyan), platforma mimo svět beze změny.
- Vstup do světa s preset motivem ≠ globální theme uživatele → svět má svůj motiv, ornamenty se nemíchají.
- Nastav user override (localStorage) → svět se překreslí; Reset → zpět na základ.
- Svět s `themeOverrides` → custom barvy se aplikují nad preset.
- `EXIT` → platforma zpět na globálním motivu.
- Mobil — světové pozadí `cover`, tokeny drží.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|--------|--------|-------|----------|
| EXIT ze světa neobnoví uživatelův globální motiv (`:root` zůstane na world theme) | Střední | Střední | Cleanup efekt `WorldLayout` (4.3 bod 3); acceptance #12 to ověří; smoke EXIT. |
| Override z předchozího motivu „visí" na `:root` po swapu (token, co nový motiv nedefinuje) | Střední | Nízký | `applyTheme` čistí `--theme-*` inline properties před zápisem (4.2). |
| Žánr→motiv mapa: nevhodné spárování (subjektivní) | Střední | Nízký | Mapa odsouhlasena autorem; PJ může motiv přepsat ve wizardu. |
| BE migrace na běžící DB selže | Nízká | Střední | Idempotentní migrační skript; `toEntity` fallback `'modre-nebe'`. |
| User override v localStorage „uvízne" po změně sady motivů (smazaný motiv) | Nízká | Nízký | `getTheme` fallbackuje na `DEFAULT_THEME` u neznámého id. |
| Přebliknutí motivu během načítání světa | Nízká | Nízký | Krátké u cache hitu; přijatelné. Lze maskovat header skeletonem z 5.1. |

**Rollback:** FE revert je čistý (aditivní — nový atom, nový soubor, `WorldLayout` se vrátí na `themeAtom`). BE revert — `themeId` pole zůstane v DB neškodně (volitelné). Migrace neměnila existující ne-theme data.

---

## 9. Otázky k autorovi

Vyřešeno (2026-05-17) — viz rozhodnutí A–F v sekci 4.0:

1. **Default `themeId`** → odvozen ze žánru světa (`themeForGenre`); PJ může přepsat ve wizardu. Schema default `'modre-nebe'` jen fallback.
2. **Rozsah UI 5.0e** → 5.0 přidá lehký preset switcher „Vzhled světa" do headeru; plný editor až 5.3f.
3. **Matrix svět** → motiv ze žánru + vlastní pozadí (`matrix-bg`); dedikovaný „Matrix skin" zrušen.

---

**Po schválení specu:** `frontend-design` audit Matrix skinu → implementační plán (přesné file diff + CLI).
