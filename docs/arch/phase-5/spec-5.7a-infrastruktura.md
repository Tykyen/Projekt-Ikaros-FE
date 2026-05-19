# Spec 5.7a — Infrastruktura reformy vzhledů světa

**Status:** ✅ Implementováno (2026-05-18)
**Rozsah:** FE + BE — jednorázová příprava theme systému pro novou sadu vzhledů: scope flip, smazání 16 world-only skinů, zrušení per-uživatel overridu, přepis wizardu, skin `ikaros` (fialové synthwave), **JS canvas Matrix rain efekt** (rozšíření theme systému), migrace existujících světů
**Větev:** `main` (přímé commity)
**Velikost:** odhad ~30 souborů — `types.ts` / `registry.ts` / `genres.ts`, smazání 16 složek, `WorldThemeSwitcher` (smazat), `useWorldTheme` / `state.ts`, `WorldLayout`, `ikaros` skin (+ pozadí webp), `MatrixRain` komponenta + napojení, BE migrace, testy
**Autor:** PJ + Claude
**Datum:** 2026-05-18
**Souvisí:** master [spec-5.7.md](./spec-5.7.md) — tento krok implementuje §4.3, §4.4, §4.6, §4.7 + skin `ikaros` (§4.2)

---

## 1. Cíl

Připravit theme systém na novou sadu 12 vzhledů světa. Krok je čistě infrastrukturní — nepřináší žádný žánrový skin (ty řeší 5.7b–5.7l), ale dodává **`ikaros`** jako výchozí neutrální vzhled a fallback. Po dokončení 5.7a má registry 21 platformových skinů + `ikaros` a aplikace je funkční (každý svět běží na `ikaros`, dokud nepřijdou žánrové skiny).

---

## 2. Audit současného stavu

- [types.ts](../../../src/themes/types.ts) — `ThemeId` 37 slugů, `ThemeScope = 'platform' | 'world' | 'both'`.
- [registry.ts](../../../src/themes/registry.ts) — `THEMES` 37, `DEFAULT_THEME = 'modre-nebe'`.
- 16 world-only skinů (`fantasy`, `heroic`, `urban-fantasy`, `soft-sci-fi`, `biopunk`, `post-postapo`, `dystopie`, `military`, `psycho`, `lovecraft`, `thriller`, `alt-historie`, `steampunk`, `dieselpunk`, `weird`, `grimdark`) — porty 5.0g.
- 21 „both" skinů — `scope: 'both'`.
- [genres.ts](../../../src/features/ikaros/pages/CreateWorldPage/constants/genres.ts) — 31 žánrů, `themeForGenre`, `GENRE_FALLBACK_THEME = 'modre-nebe'`.
- [WorldThemeSwitcher](../../../src/features/world/components/WorldThemeSwitcher/WorldThemeSwitcher.tsx) — per-uživatel override v headeru.
- [useWorldTheme.ts](../../../src/themes/useWorldTheme.ts) + [state.ts](../../../src/themes/state.ts) — `worldThemeOverridesAtom`.

---

## 3. Návrh řešení

### 3.1 Scope flip 21 platformových skinů

21 skinů se `scope: 'both'` → `scope: 'platform'`. Vizuál beze změny. Tím zmizí ze světového selektoru (`listThemes('world')`), zůstanou v platformovém.

### 3.2 Smazání 16 world-only skinů

Odstranit `src/themes/themes/<id>/` (16 složek), importy a zápisy v `registry.ts`, slugy z `ThemeId`. `tsc` ověří, že nezůstala visící reference.

### 3.3 Zrušení per-uživatel overridu

- Smazat komponentu `WorldThemeSwitcher` (celá složka) + odebrat z headeru `WorldLayout`.
- Smazat `worldThemeOverridesAtom` + typ `WorldThemeValue` ze `state.ts`.
- Zjednodušit `useWorldTheme` — odpadá override vrstva (`setOverride` / `reset` / `isOverridden`); resolver vrací `world.themeId` / `themeOverrides` / `themeBackgroundUrl`, fallback `ikaros`.

### 3.4 Skin `ikaros` — fialové synthwave

`ikaros` je výchozí vzhled světa a vizuální identita platformy (slug `ikaros`, `scope: 'world'`). Styl: **fialové synthwave** — hvězdná fialová obloha, neonové noční město, perspektivní mřížka, oslnivý světelný bod na horizontu.

- **Pozadí:** rastrový obrázek dodaný autorem → `public/themes/backgrounds/ikaros.webp` (193 KB) + `thumbnails/ikaros.webp`. Zdroj: `assets-source/themes/ikaros/background.png`.
- **`index.ts`** — paleta přes `buildSkinVars` (§3.4a).
- **`decorations.css`** — atmosférický overlay laděný k pozadí, fialový glow nadpisů, ornamenty panelů. Originální (žádné sdílení).
- **Signature efekt: Matrix rain** — fialové padající katakana glyphy, JS canvas komponenta (§3.7).

`DEFAULT_THEME` a `GENRE_FALLBACK_THEME` → `'ikaros'`.

#### 3.4a Paleta `ikaros` (design audit 2026-05-18)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#0c0820` / `#1a0f3a` |
| text / heading | `#ece4ff` / `#ffffff` |
| accent (neon fialová) | `#a96cff` |
| accent bright | `#c9a4ff` |
| accent secondary (ledová jiskra) | `#d8ccff` |
| border / glow | `rgba(169,108,255,.42)` / `rgba(169,108,255,.4)` |

Font: display/logo geometrický sci-fi, body technický grotesk (synthwave ladění) — konkrétní volba ověří dostupnost v `index.html` při implementaci.

### 3.7 Matrix rain — JS canvas efekt

Theme systém dosud uměl jen CSS (`decorations.css`). Matrix rain vyžaduje JavaScript:

- Nová komponenta `src/themes/effects/MatrixRain.tsx` — `<canvas>` + `requestAnimationFrame`, fialové padající katakana glyphy. **Hustší u krajů, slabší uprostřed** (čitelnost obsahu).
- `Theme` typ rozšířen o volitelný `effect?: 'matrix-rain'`.
- Render: `fixed` vrstva nad `theme.background` a pod obsahem; mountuje se jen pro aktivní theme s `effect`.
- `prefers-reduced-motion` → efekt se nevykresluje (statický fallback / vypnuto).
- Výkon: cap DPR, pauza při skrytém tabu (`visibilitychange`), úklid `cancelAnimationFrame` při unmountu.

### 3.5 Přepis wizardu — `genres.ts`

`GENRES` přepsán na **11 žánrů + „Vlastní"** dle [spec-5.7 §2.1](./spec-5.7.md):

| Žánr | description (návrh) |
|---|---|
| Fantasy | Svět magie, mytologie a nadpřirozených sil. |
| Dark Fantasy | Fantasy s temným, krutým nebo hororovým nádechem. |
| Sci-Fi | Svět technologie, budoucnosti, vesmíru a spekulativní vědy. |
| Cyberpunk | Technologická dystopie, korporace, síť, sociální rozklad. |
| Steampunk | Průmyslová estetika, pára, ozubená kola, viktoriánská technika. |
| Post-apokalypsa | Svět po kolapsu civilizace. |
| Horor | Strach, bezmoc, neznámo, psychický tlak. |
| Mystery | Pátrání, vyšetřování, odhalování tajemství. |
| Historický | Svět opřený o historické období. |
| Současnost | Příběh v současném nebo nedávném světě bez nadpřirozena. |
| Western | Divoký západ, hranice civilizace, pistole a prach. |

⚠️ Dokud nevzniknou žánrové skiny (5.7b–5.7l), **všech 11 žánrů ukazuje `theme: 'ikaros'`**. Každý skin krok pak přemapuje svůj žánr na vlastní slug. „Vlastní" → `ikaros` (free-text).

### 3.6 BE migrace existujících světů

BE repo `Projekt-ikaros`, modul `worlds` — jednorázová migrace:
- `world.themeId` ukazující na smazaný world-only skin nebo na bývalý „both" skin (nově platform-only) → přemapovat na `ikaros`.
- `world.genre` (label) z 31-žánrové sady → přemapovat na nejbližší z 11 (mapovací tabulka 31 → 11 v příloze A).
- **Reverzibilní** — záloha `themeId` / `genre` před přepisem.

> Pozn.: protože všechny žánry zatím beztak míří na `ikaros`, migrace `themeId` na `ikaros` není ztrátová — finální skin svět dostane, jakmile jeho žánrový skin vznikne (přemapování `themeForGenre`).

---

## 4. Out of scope

- 11 žánrových skinů — kroky 5.7b–5.7l.
- Změna theme editoru 5.3f.
- Matrix rain pro jiné skiny než `ikaros` — `effect` flag je obecný, ale zatím ho nese jen `ikaros`.

---

## 5. Acceptance kritéria

1. `ThemeId` = 21 platform slugů + `ikaros` = 22; `THEMES` má 22 položek.
2. 16 world-only složek / importů / slugů odstraněno; `tsc` bez chyb.
3. 21 platformových skinů má `scope: 'platform'`.
4. `listThemes('world')` → 1 (`ikaros`); `listThemes('platform')` → 21.
4b. **Separace selektorů** — platformový `ThemeSwitcher` zobrazí jen `platform` skiny; světové selektory (wizard `ThemeSection`, editor `ThemePresetGrid`) jen `world`. Žádný překryv.
5. `WorldThemeSwitcher` smazán; header `WorldLayout` bez ikony palety; `worldThemeOverridesAtom` smazán.
6. `genres.ts` — 11 žánrů + „Vlastní", všechny `theme: 'ikaros'`; `themeForGenre` fallback `ikaros`.
7. `DEFAULT_THEME` = `GENRE_FALLBACK_THEME` = `'ikaros'`.
8. Skin `ikaros` má kompletní `index.ts` + `decorations.css` + pozadí `ikaros.webp` (bez 404).
9. `Theme` typ má `effect?`; `ikaros` má `effect: 'matrix-rain'`.
10. `MatrixRain` komponenta se renderuje jen pro aktivní theme s `effect`; respektuje `prefers-reduced-motion`; uklízí `requestAnimationFrame` při unmountu.
11. BE migrace: žádný svět neukazuje na neexistující / platform-only `themeId`.
12. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
13. `mobil-desktop` audit skinu `ikaros`.

---

## 6. Test plán

- `registry` — `THEMES` 22; `listThemes('world')` = `[ikaros]`; `getTheme(<smazaný slug>)` → fallback `ikaros`.
- `themeForGenre` — každý z 11 žánrů i „Vlastní" → `ikaros`.
- `WorldLayout` — header bez palety; vzhled = `world.themeId`.
- `useWorldTheme` — vrací `world` hodnoty bez localStorage vrstvy.
- Smoke: wizard — 11 žánrů + „Vlastní"; existující svět se otevře na `ikaros`.

---

## 7. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Smazání 16 skinů zlomí visící referenci | Střední | Střední | `tsc` + `test:run`; grep slugů před smazáním. |
| BE migrace rozbije `themeId` / `genre` | Střední | Vysoký | Reverzibilní, záloha polí; test na kopii dat. |
| Zrušení switcheru zlomí import/test | Jistá | Nízký | Odstranit referenci ve stejném commitu; `tsc`. |
| `ikaros` skin bez assetů působí prázdně | Střední | Nízký | Design audit doladí; ornamenty CSS-only. |

**Rollback:** Revert commitů. BE migrace reverzibilní ze zálohy.

---

## 8. Rozhodnutí autora (2026-05-18)

1. **Názvy žánrů** — počeštěno: „Horror" → **„Horor"**, „Moderní / Současný" → **„Současnost"**.
2. **Genre labely starých světů** — migrace **přepíše** `world.genre` na nový žánr.
3. **Pořadí žánrových skinů** po 5.7a — **Fantasy první**, pak zbytek dle pořadí §2.1.

---

## Příloha A — mapovací tabulka migrace 31 → 11 žánrů

| Starý žánr (z 31) | Nový žánr |
|---|---|
| Fantasy, Heroic fantasy, Sword and sorcery, Mythic / mytologický | Fantasy |
| Dark fantasy, Grimdark, Urban fantasy | Dark Fantasy |
| Sci-fi, Hard sci-fi, Soft sci-fi, Space opera | Sci-Fi |
| Cyberpunk, Biopunk | Cyberpunk |
| Steampunk, Dieselpunk | Steampunk |
| Postapo, Post-postapo, Survival | Post-apokalypsa |
| Horor, Psychologický horor, Lovecraftovský horor | Horor |
| Detektivní / mystery, Thriller, Weird fiction | Mystery |
| Historický, Alternativní historie, Politické drama | Historický |
| Dystopie, Utopie / falešná utopie, Military, Pulp | Současnost |
| (žádný z 31 — nový žánr) | Western |

> Tabulka je **návrh k revizi** — sloučení Dystopie/Military do „Moderní" je sporné; autor může upravit.
