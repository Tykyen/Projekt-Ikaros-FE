# Spec 5.7 — Reforma vzhledů světa: 11 žánrových skinů + Ikaros styl

**Status:** ✅ Implementováno (2026-05-19) — všech 12 world skinů + 5.8 (3D UI) + 5.9 (a11y doladění)
**Rozsah:** FE — nahrazení 16 world-only skinů sadou 12 nových (11 žánrů + Ikaros), přepnutí 21 „both" skinů na `platform`, zúžení wizardu z 31 na 11 žánrů + „Vlastní", zrušení per-uživatel overridu, migrace existujících světů
**Větev:** `main` (přímé commity — dle workflow projektu)
**Velikost:** odhad ~38 souborů — 12 × `index.ts` + 12 × `decorations.css` + `types.ts` / `registry.ts` / `genres.ts` + `WorldThemeSwitcher` (smazat) + `useWorldTheme` / `state.ts` + migrace + testy. Implementace iterativní (skin po skinu).
**Autor:** PJ + Claude
**Datum:** 2026-05-18
**Souvisí:** [spec-5.0.md](./spec-5.0.md) (theme systém), [spec-5.0g-skin-port.md](./spec-5.0g-skin-port.md) (port, který tento spec nahrazuje), [spec-5.3.md](./spec-5.3.md) (§5.3f theme editor)

---

## 1. Cíl

Postavit **kurátorovanou sadu 12 vzhledů světa od nuly** — 11 žánrových skinů + 1 „Ikaros styl" — místo dnešní nesourodé směsi 37 motivů ve světovém selektoru. Žánry se vrací k **původnímu seznamu 11** (z kroku 2.3 / commit `c268cd6`), wizard se z 31 žánrů zúží zpět na 11 + „Vlastní"; žánr a vzhled jsou pak 1:1. Vzhled světa je **jediný a sdílený** — určuje ho PJ, vidí ho všichni členové stejně; per-uživatel override (krok 5.0e) se ruší. Platformové vzhledy (uživatelský theme Ikara) zůstávají beze změny.

---

## 2. Kontext / motivace

- Selektor „VZHLED SVĚTA" dnes nabízí **37 motivů** — míchá generické platformové skiny (Modré nebe, Bílá, Zlatý standard) i žánrové. Pro PJ je to nepřehledný seznam položek, které spolu logicky nesouvisí.
- Wizard tvorby světa nabízí **31 žánrů** ([genres.ts](../../../src/features/ikaros/pages/CreateWorldPage/constants/genres.ts)), z nichž 16 jsou žánrové porty z kroku 5.0g — věrný port se sdílenými pozadími, nikdy dotažené do finální kvality (otevřený dluh **D-NEW-skin-assets**).
- Autor chce sadu **předělat od základu**: návrat k původnímu, promyšlenému seznamu 11 žánrů, každý s vlastním vzhledem, plus neutrální „Ikaros" vzhled. Méně voleb, vyšší kvalita každé z nich.

### 2.1 Sada — 11 žánrů + Ikaros styl

Žánry = původní seznam z kroku 2.3 (commit `c268cd6`). Každý žánr má 1:1 vlastní skin.

| # | Žánr | Slug skinu |
|---|------|------------|
| 1 | Fantasy | `fantasy` |
| 2 | Dark Fantasy | `dark-fantasy` |
| 3 | Sci-Fi | `vesmir` |
| 4 | Cyberpunk | `cyberpunk` |
| 5 | Steampunk | `steampunk` |
| 6 | Post-apokalypsa | `apokalypsa` |
| 7 | Horor | `horor` |
| 8 | Mystery | `mystery` |
| 9 | Historický | `historie` |
| 10 | Současnost | `moderni` |
| 11 | Western | `western` |
| 12 | **Ikaros styl** | `ikaros` |

**„Vlastní"** zůstává jako volba ve wizardu (free-text název žánru) — není to skin. Svět se žánrem „Vlastní" běží na vzhledu `ikaros` jako base a PJ si ho dotvoří editorem barev/pozadí (§4.5).

> Tabulka je **návrh k revizi** — autor může žánry přejmenovat. Finální seznam se zafixuje při schválení specu.

### 2.2 Volba slugů — kolize s platformovými skiny

21 platformových skinů si drží své slugy (`sci-fi`, `kyberpunk`, `postapo`, …). Nové světové slugy proto **nesmí kolidovat**. 16 world-only slugů z 5.0g se uvolní smazáním. Kolizní žánry dostaly nekonfliktní slug: Sci-Fi → `vesmir`, Cyberpunk → `cyberpunk` (vs. platformový `kyberpunk` s „k"), Post-apokalypsa → `apokalypsa` (vs. platformový `postapo`). Ostatní slugy jsou volné (`fantasy`, `steampunk` se uvolní smazáním world-only portů).

---

## 3. Audit současného stavu

### 3.1 Theme registry

- [src/themes/types.ts](../../../src/themes/types.ts) — `ThemeId` (37 slugů), `ThemeScope = 'platform' | 'world' | 'both'`.
- [src/themes/registry.ts](../../../src/themes/registry.ts) — `THEMES` (37), `getTheme`, `listThemes(scope)`.
- `src/themes/themes/<id>/` — `index.ts` (`Theme` objekt) + `decorations.css` (ornamenty).

### 3.2 Rozdělení 37 motivů dle scope (ověřeno)

- **`scope: 'world'` — 16 motivů** (porty 5.0g): `fantasy`, `heroic`, `urban-fantasy`, `soft-sci-fi`, `biopunk`, `post-postapo`, `dystopie`, `military`, `psycho`, `lovecraft`, `thriller`, `alt-historie`, `steampunk`, `dieselpunk`, `weird`, `grimdark`.
- **`scope: 'both'` — 21 motivů**: `modre-nebe`, `zlaty-standard`, `sci-fi`, `bila`, `vesmirna-lod`, `priroda`, `pergamen`, `nemrtvi`, `ctyri-zivly`, `vesmirna-bitva`, `hospoda`, `severske-runy`, `indiane`, `africke`, `arabsky-svet`, `kyberpunk`, `postapo`, `temna-cerven`, `magie`, `mesic`, `slunce`.
- **`scope: 'platform'` — 0 motivů.**

### 3.3 Žánry a editor

- [genres.ts](../../../src/features/ikaros/pages/CreateWorldPage/constants/genres.ts) — 31 žánrů, každý s `theme`; `themeForGenre(label)` mapuje 1:1, fallback `modre-nebe`.
- `world.genre` ukládá **label** (string) — zpětná kompatibilita se staršími světy.
- `world.themeId` / `themeOverrides` / `themeBackgroundUrl` — per-svět vzhled (krok 5.0a, BE).
- Theme editor (color pickery + upload pozadí, krok 5.3f) — `WorldSettingsPage` tab Vzhled. **Funkční, beze změny** — nové skiny se v něm objeví automaticky přes `listThemes('world')`.

### 3.4 Per-uživatel override vzhledu světa (krok 5.0e — ke zrušení)

- [WorldThemeSwitcher](../../../src/features/world/components/WorldThemeSwitcher/WorldThemeSwitcher.tsx) — ikona palety v headeru `WorldLayout`, popover „Vzhled světa" se seznamem skinů + „Reset". To je selektor ze screenshotu.
- [useWorldTheme.ts](../../../src/themes/useWorldTheme.ts) — resolver s prioritou: uživatelský override → sdílený základ `World` → `DEFAULT_THEME`.
- [state.ts](../../../src/themes/state.ts) — `worldThemeOverridesAtom` (`atomWithStorage`, localStorage `ikaros.world-themes`) + typ `WorldThemeValue`.

---

## 4. Návrh řešení

### 4.1 12 nových world skinů

Pro každý slug z tabulky §2.1 vznikne `src/themes/themes/<id>/`:
- **`index.ts`** — `Theme` objekt, `scope: 'world'`, kompletní `vars` sada (glass tokeny + legacy aliasy + fonty + layout chrome — rozsah jako stávající skiny), `fonts`, `thumbnail`, `background`, `decorationsModule`.
- **`decorations.css`** — ornamenty čistě z CSS/SVG (gradienty, `box-shadow`, pseudo-elementy, `@keyframes`). **Originální per skin** — žádné sdílení/recyklace mezi tématy. `prefers-reduced-motion` respekt.

Barevná identita + signature ornament + assety každého skinu se nedefinují v tomto master specu — řeší je **samostatný podkrok per skin** (`spec-5.7X-<skin>.md` + `prompts-5.7X-<skin>-assets.md`), viz §10.

### 4.2 „Ikaros styl"

Neutrální vzhled světa — čistá, zdrženlivá varianta blízká domovskému vzhledu platformy. Slouží jako **výchozí** vzhled (svět bez vyhraněného žánru / volba „Vlastní" ve wizardu). `scope: 'world'`, slug `ikaros`.

### 4.3 Osud 37 stávajících motivů

| Skupina | Akce |
|---|---|
| 16 world-only (`fantasy`, `heroic`, …) | **Smazat** — `src/themes/themes/<id>/`, importy v registry, slugy z `ThemeId`. Uvolněné slugy (`fantasy`, `steampunk`, `grimdark`, …) lze reusnout pro nové skiny. |
| 21 „both" (`modre-nebe`, …) | **`scope: 'both'` → `scope: 'platform'`.** Vizuál beze změny. Zmizí ze světového selektoru, zůstanou ve výběru vzhledu platformy. |

Výsledek: `THEMES` = 21 platform + 12 world = **33 motivů**. `listThemes('world')` → 12, `listThemes('platform')` → 21.

### 4.4 Wizard — 31 → 11 žánrů + „Vlastní"

- [genres.ts](../../../src/features/ikaros/pages/CreateWorldPage/constants/genres.ts) — `GENRES` přepsán na 11 položek (label + description + theme 1:1 dle §2.1).
- `themeForGenre` — beze změny logiky; mapuje 11 žánrů na 11 skinů, fallback `ikaros`.
- `GENRE_FALLBACK_THEME` → `'ikaros'`.
- Volba „Vlastní" — zůstává (free-text), vzhled padá na `ikaros`.

### 4.5 Editor barev a pozadí (per-svět customizace)

Požadavek autora: PJ si u svého světa může základní vrstvu vzhledu upravit — barvy a pozadí.

- **Mechanismus už existuje** (krok 5.0d + 5.3f): `world.themeOverrides` (CSS custom properties) + `world.themeBackgroundUrl`, `applyTheme` vrství overrides nad preset skin.
- Tento spec nepřináší novou architekturu — jen ověří, že editor 5.3f funguje nad novou sadou 12 skinů, a doplní/upraví seznam editovatelných tokenů, pokud to nová sada vyžaduje.
- **Hranice:** editovatelné jsou barvy (akcent, povrchy, text) + pozadí. Ornamenty (rámečky, dekorace) zůstávají žánrové a needitovatelné — jinak by si PJ rozbil vizuál skinu.

### 4.6 Zrušení per-uživatel overridu (krok 5.0e)

Vzhled světa je nadále **jediný a sdílený** — určuje ho PJ přes `world.themeId`. Žádný člen si ho pro sebe nepřepíná.

- **Smazat** komponentu `WorldThemeSwitcher` (celá složka) + odebrat ji z headeru `WorldLayout`.
- **Smazat** `worldThemeOverridesAtom` + typ `WorldThemeValue` ze [state.ts](../../../src/themes/state.ts) (localStorage klíč `ikaros.world-themes` se přestane používat).
- **Zjednodušit** `useWorldTheme` — odpadá override vrstva i `setOverride` / `reset` / `isOverridden`. Resolver vrací rovnou `world.themeId` / `themeOverrides` / `themeBackgroundUrl` (fallback `ikaros`). Zvážit, zda hook ještě dává smysl, nebo se nahradí prostým čtením z `world`.
- Platformové skiny se tím ve světě **nikdy neuplatní** — svět vždy běží na world skinu od PJ.

### 4.7 Migrace existujících světů

Reforma mění slugy i seznam žánrů — existující světy je třeba přemapovat. Mapuje se 31 starých žánrů / 37 starých `themeId` na novou sadu 11 + Ikaros.

- Svět s `themeId` mířícím na smazaný / přesunutý skin → přemapovat na nejbližší z 12 (např. `heroic` → `fantasy`, `lovecraft` → `horor`, `grimdark` → `dark-fantasy`, žánry bez protějšku → `ikaros`).
- `world.genre` (label) z 31-žánrové sady → přemapovat na nejbližší z 11.
- Přesnou mapovací tabulku 31 → 11 dodá impl. plán a **schválí autor** (viz §9 bod 3).
- Migrace běží na BE (`Projekt-ikaros`, modul `worlds`) — jednorázový skript / migrace schématu. **Vyžaduje zásah do BE repa.**

---

## 5. Out of scope

- **Změna 21 platformových skinů** — vizuálně beze změny, mění se jen `scope`.
- **Nová architektura theme editoru** — 5.3f zůstává, jen se ověří nad novou sadou.
- **Editovatelnost ornamentů** — záměrně ne (viz §4.5).
- **Headline builder / custom menu světa** — fáze 12.
- **Dedikované raster pozadí** od grafika — autor je dodá průběžně; skiny fungují i s CSS/gradient pozadím (dluh navazuje na D-NEW-skin-assets).

---

## 6. Acceptance kritéria

1. `ThemeId` obsahuje 12 nových world slugů + 21 platform slugů = 33; `THEMES` má 33 položek.
2. 16 původních world-only skinů (složky, importy, slugy) odstraněno.
3. 21 původních „both" skinů má `scope: 'platform'`.
4. Každý z 12 nových skinů má `index.ts` (kompletní `vars`, `scope: 'world'`) + originální `decorations.css`.
5. Žádné dva skiny nesdílejí ornamentální CSS.
6. `listThemes('world')` → 12 skinů; `listThemes('platform')` → 21; světový selektor zobrazí jen 12.
7. `genres.ts` — 11 žánrů + „Vlastní"; `themeForGenre` mapuje 1:1, fallback `ikaros`.
8. Žádný theme nemá 404 na `background` / `thumbnail`.
9. Migrace: žádný existující svět neukazuje na neexistující / platform-only `themeId`.
10. `WorldThemeSwitcher` odstraněn z headeru i kódu; `worldThemeOverridesAtom` smazán; `useWorldTheme` bez override vrstvy.
11. Vzhled světa je pro všechny členy stejný — žádné per-uživatel přepínání.
12. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
13. `mobil-desktop` audit — náhled aspoň 3 nových skinů na mobilu/desktopu.
14. `napoveda` aktualizace — stránka popisuje 11 žánrů + Ikaros styl.

---

## 7. Test plán

- `registry` — `THEMES` má 33; `listThemes('world')` vrací 12; `listThemes('platform')` 21; `getTheme(<smazaný slug>)` → fallback.
- `themeForGenre` — každý z 11 žánrů vrací správný world skin; neznámý žánr / „Vlastní" → `ikaros`.
- `WorldLayout` — header neobsahuje ikonu palety; vzhled světa odpovídá `world.themeId` bez ohledu na localStorage.
- `applyTheme(<nový id>)` — nastaví `data-theme`, zapíše `vars`; `applyTheme` s `overrides` vrství nad preset.
- Smoke: wizard tvorby světa — 11 žánrů + „Vlastní"; `WorldSettingsPage` tab Vzhled — 12 skinů v gridu, výběr + živý náhled + editor barev/pozadí funguje.
- Migrace: smoke kontrola, že staré světy po migraci mají platný world `themeId`.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Migrace BE rozbije `themeId` existujících světů | Střední | Vysoký | Mapovací tabulka revidovaná autorem; fallback na `ikaros`; test na kopii dat. |
| 12 skinů od nuly = velký rozsah, nekonzistence | Vysoká | Střední | Iterativně, skin po skinu; sdílená `vars` struktura; design audit před implementací. |
| Smazání 16 skinů zlomí referenci jinde v kódu | Nízká | Střední | Grep na slugy před smazáním; `tsc` odhalí (`ThemeId` enum). |
| Zrušení `WorldThemeSwitcher` zlomí import v `WorldLayout` / testech | Jistá | Nízký | `tsc` + `test:run` odhalí; odstranit referenci ve stejném commitu. |
| Bývalý „both" skin přiřazený světu (platform-only) | Jistá | Střední | Pokryto migrací §4.7. |
| `lint:colors` hlásí hex v theme souborech | Jistá | Žádný | `src/themes/themes/` je v ALLOW listu. |

**Rollback:** Revert commitů. Kritická je BE migrace — musí být reverzibilní (záloha `themeId` / `genre` před přepisem).

---

## 9. Otevřené body k rozhodnutí autora

1. **Názvy žánrů** (§2.1) — potvrdit původní seznam, nebo přejmenovat (např. „Horror" → „Horor", „Moderní / Současný" zkrátit).
2. **„Ikaros styl"** (§4.2) — souhlas s neutrálním pojetím jako výchozím vzhledem.
3. **Mapovací tabulka migrace 31 → 11** (§4.7) — dodá impl. plán; autor ji schválí (kam padnou žánry bez protějšku — Space opera, Dystopie, Grimdark, Lovecraft, Steampunk-varianty…).
4. **Genre labely starých světů** — přepsat `world.genre` na nový žánr, nebo nechat starý label a mapovat jen vzhled?

---

## 10. Návazný postup — skin po skinu

Spec 5.7 je **master spec** sady. Implementace je rozdělená na samostatné podkroky — každý skin potřebuje vlastní pozadí, assety a barevný návrh, hromadné zpracování by bylo nezvládnutelné. Model je shodný s žánrovými skiny fáze 1 (1.0c–1.0s).

### 10.1 Infrastrukturní krok — 5.7a

Jednorázová příprava, bez nových žánrových skinů:
- Refaktor `types.ts` / `registry.ts` — `scope` flip 21 „both" → `platform` (§4.3).
- Zrušení `WorldThemeSwitcher` + `worldThemeOverridesAtom` + zjednodušení `useWorldTheme` (§4.6).
- Přepis `genres.ts` na 11 žánrů + „Vlastní" (§4.4).
- Skin **`ikaros`** jako první a výchozí (neutrální — slouží jako fallback pro ostatní kroky).
- BE migrace existujících světů (§4.7).

### 10.2 Per-skin podkroky — 5.7b–5.7l (11×)

Každý žánrový skin = vlastní krok se čtyřmi artefakty:
1. **Design návrh** (`frontend-design` audit) — paleta s přesnými hex kódy, atmosféra/reference look, signature ornament, font, seznam assetů. Zapíše se do `spec-5.7X-<skin>.md`.
2. **Prompt soubor** — `prompts-5.7X-<skin>-assets.md` — generativní prompty pro pozadí + assety (vzor: [prompts-1.0i-pergamen-assets.md](../phase-1/prompts-1.0i-pergamen-assets.md)). Autor podle nich vygeneruje obrázky a dodá je.
3. **Implementace** — `index.ts` (`vars`, `scope: 'world'`) + originální `decorations.css`, zapojení dodaných assetů.
4. **`mobil-desktop` audit** + screenshot mobil/desktop.

### 10.3 Závěr

`napoveda` aktualizace (11 žánrů + Ikaros styl), uzavření dluhu D-NEW-skin-assets.
