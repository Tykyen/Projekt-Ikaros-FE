# Spec 16.2a — Deník: grafický redesign (vzor Matrix / Ikaros)

**Status:** 📝 Návrh k odsouhlasení — 2026-06-23. Prototyp odsouhlasen (vizuál i chování): `c:\tmp\matrix-denik-audit.html`.
**Rozsah:** FE only. Přepis vizuálu MatrixSheet + nová pole/validace; BE bez změn (vše jede přes volný `diary.customData`).
**Repo:** `Projekt-ikaros-FE`, commit na `main` (žádná feature větev).
**Autor:** PJ + Claude
**Datum:** 2026-06-23
**Souvisí:** roadmap2.md 16.2a „Pilíř DENÍK — všechny systémy" (řádky 351–411) · `diary-systems/` · 8.7n (původní MatrixSheet) · spec-16.1 (chat reuse stejného sheetu).

> **Matrix = vzor.** Tenhle redesign je referenční „kabát" pro grafický průchod **všech 12 systémů** (16.2a). Vzory (pips, vitals track, budget bar, panel HUD, validace) se pak aplikují na ostatní sheety. Proto se vyplatí udělat ho pořádně a vytěžitelně.

---

## 1. Cíl

Z generického tmavého formuláře udělat **profesionální RPG character sheet** ve stylu „operátorský HUD / cyberpunk terminál" — čtečku stavu agenta v Matrixu. Vizuál i mechaniky čitelné na první pohled (stav postavy, kam tečou body, co porušuje pravidla), self-contained a nezávislý na aktivním skinu.

---

## 2. Kontext / motivace

Dnešní MatrixSheet ([MatrixSheet.tsx](../../../src/features/world/pages/CharacterDetailPage/components/../diary-systems/sheets/matrix/MatrixSheet.tsx)) je funkční, ale vypadá jako tmavý webový formulář: holá čísla v boxících, anonymní tečky u přetlaků, matoucí penalty strip, žádná hierarchie ani identita systému. 16.2a má každý systém s deníkem dotáhnout do plnohodnotného listu — Matrix je první a slouží jako vzor pro zbytek.

---

## 3. Audit současného stavu

[MatrixSheet.tsx](../../../src/features/world/pages/CharacterDetailPage/diary-systems/sheets/matrix/MatrixSheet.tsx) + [constants.ts](../../../src/features/world/pages/CharacterDetailPage/diary-systems/sheets/matrix/constants.ts) + [styles/matrix.css](../../../src/features/world/pages/CharacterDetailPage/diary-systems/styles/matrix.css):

- **Data** v `diary.customData` s prefixem `matrix_*` přes `makeCdAccess` (`g`/`set`/`parseJsonArr`/`updateArr`/`addArr`/`removeArr`).
- **Sekce dnes:** Overview (jméno/stát/genom/datum/body schopností/body osudu) · Vitals (Životy/Runa/Vesta + Únava + penalty stripy) · Přetlaky (4×5 pips) · Jazyky · Schopnosti (📘 hardcoded `MATRIX_MAGIC`) · Aspekty · Výbava a poznámky.
- **3 režimy:** `mode: 'view'|'edit'` + `usePrintMode()` → oddělený statický `MatrixPrintView` (čte stejná data, [chybový deník/tisk](../../chybovy-denik/tisk.md)).
- **Body schopností výpočet:** trojúhelník per schopnost (`1+…+v`) + `(aspektů − 3) × 6`. (= zachováváme.)
- **onRoll:** sheet kreslí klikací hody jen když dostane `onRoll` (mapa/chat ano, list ne).

---

## 4. Návrh řešení

### 4.0 Klíčová rozhodnutí

| # | Rozhodnutí | Důvod |
|---|-----------|-------|
| R1 | **Self-contained tmavý HUD**, scoped `[data-diary-system='matrix']`, vlastní barvy (ne theme tokeny) | deník se renderuje nad libovolným skinem (`world.system='matrix'` ≠ matrix skin); musí být čitelný na zlatém i měsíčním skinu — [[feedback_theme_isolation]] |
| R2 | **Jméno + portrét read-only** (z postavy); Stát/Povolání/Genom/Body osudu/vitals/… editovatelné | identita postavy se mění na úrovni Character, ne v deníku |
| R3 | **Magie 📘 = auto-match názvu**, žádný ruční flag | starý systém; název schopnosti = název magie-stránky → 📘 + odkaz; nulová data navíc |
| R4 | **Stupně schopností = univerzální stupnice 1–10** (Talent…Entita), pips + barva + tooltip | domény si hráč pojmenovává sám → univerzální měřítko sedí na libovolný okruh |
| R5 | **PC clamp 1–7, NPC/Bestie 1–10** | hráč = lidský strop 7; NPC/božské entity extrém |
| R6 | **Reuse výpočtů z dnešního sheetu** (trojúhelník + aspekty ×6); jen nový vizuál + 2 validace | jediný zdroj pravdy mechaniky |

### 4.1 Vizuální jazyk
- **Estetika:** operátorský HUD — zkosené rohy panelů (clip-path), jemný scanline + grid overlay, tenké neon linky, glow na akcentech.
- **Typografie:** display/UI font (hranatý tech, např. Chakra Petch) + mono pro čísla/data (IBM Plex Mono). **⚠️ k vyřešení v plánu:** self-host vs CDN (PWA/offline 15.1 → preferovat self-host nebo systémový fallback; žádná tvrdá závislost na externím fontu).
- **Barvy stupňů 1–10:** 1 popelavá · 2 zelená · 3 azurová · 4 modrá · 5 fialová · 6 magenta · 7 zlatá · 8–10 bílá + pulzující glow.
- **Jazyky A/B/C:** A zelená · B azurová · C fialová (dle prvního písmene úrovně).

### 4.2 Sekce (pořadí)
1. **Hero** — portrét + jméno (read-only) · Stát / Povolání / Magický genom (řádky, edit) · Body osudu (kapsle vpravo, hvězdy ✦, edit 0–3).
2. **Jazyky** — název + barevný badge úrovně (A/B/C).
3. **Fyzický stav** — Životy / Runa / Ochrana jako **dynamické segmentové tracky** (Životy max 5; Runa, Ochrana dle hodnoty, **Ochrana min 3**) + barva dle stavu · **Únava** (číslo + penalty) · **status readout** (aktuální postih + prahy).
4. **Body schopností** — budget bar `použito / strop`; použito = trojúhelník + aspekty nad 3 ×6; **přečerpání** (použito > strop) → číslo i čára zrudnou + „⚠ Přečerpáno o X b.".
5. **Přetlaky** — 4 řádky × 5 segmentů, barva dle úrovně 0→5 (zelená→červená; 5. kritický).
6. **Schopnosti** — název + **pips 1–10** (barva dle stupně) + číslo `N/7` s **tooltipem názvu stupně** + **📘** (auto-match magie, klik → pravidlo). Validace „too high" zvýrazní řádek.
7. **Aspekty** — název + chip **Nabitý** (zelená, svítí) / **Vybitý** (zhaslá červená).
8. **Poznámky** — textarea (přejmenováno z „Výbava a poznámky").

### 4.3 Nová pole / přejmenování (customData `matrix_*`)
| Pole | Klíč | Stav |
|---|---|---|
| **Povolání** | `matrix_profession` (nový) | text v hero |
| Ochrana | `matrix_armor` (=dnešní „Vesta") | label v UI „Ochrana" (klíč beze změny — žádná migrace) |
| Magie marker | — | bez pole; auto-match názvu |

### 4.4 Magie 📘 (auto-match)
- Zdroj magií = **wiki stránky světa pod rozcestníkem `magicka-pravidla`** (viz [PageViewer.tsx:120](../../../src/features/world/pages/PageViewer/PageViewer.tsx#L120)).
- `isMagic(name)` = existuje magie-stránka, jejíž název == název schopnosti (case-insensitive).
- 📘 se ukáže jen při shodě; klik → navigace na slug té magie (kde jsou stupně 1–x v obsahu).
- **⚠️ k vyřešení v plánu:** jak MatrixSheet získá seznam magií (pages directory světa) bez zbytečné závislosti — kandidát hook `usePagesDirectory` filtrovaný na potomky `magicka-pravidla`.

### 4.5 Validace (zobrazit, neblokovat)
1. **Přečerpání bodů:** použito > strop → červené číslo + čára + „⚠ Přečerpáno o X b.".
2. **Málo aspektů:** `max(úroveň schopnosti) > počet aspektů` → zvýraznit porušující schopnost(i) + hláška u Aspektů „⚠ Málo aspektů — nejvyšší schopnost má úroveň N, potřebuješ aspoň N aspektů (máš M)".

### 4.6 Tři režimy
- **view:** čistý readout (pips/tracky/chip nereagují, žádné inputy).
- **edit:** stejné rámy + klikací pips/segmenty + inputy + „+ Přidat" (schopnosti/jazyky/aspekty) + ✕ mazání; save přes `customDataPatch` (delta, beze změny mechaniky).
- **print:** zachovat funkční `MatrixPrintView` (statický dokument); vizuál sladit volitelně (ne blok).

---

## 5. Technické háčky (k dořešení v implementačním plánu)

| # | Háček | Poznámka |
|---|---|---|
| H1 | **Portrét** — sheet dostává jen `characterSlug`, ne portrét | donačíst (kandidát `useCharacter(slug)` / directory); fallback iniciály |
| H2 | **PC vs NPC clamp** (1–7 vs 1–10) — sheet dnes nezná `isNpc` | dodat info do sheetu (prop / z diary); bez něj default PC |
| H3 | **Magie pages** (4.4) | závislost MatrixSheet → pages API; leak-safe (jen stránky, co viewer vidí) |
| H4 | **Fonty** (4.1) | self-host / systémový fallback kvůli PWA |
| H5 | **lint:colors** — hardcoded barvy HUD | záměrná identita (jako matrix skin); přidat do ALLOW nebo zdůvodnit ([[project_color_token_debt]]) |

---

## 6. Rozsah souborů (odhad)
- `diary-systems/sheets/matrix/MatrixSheet.tsx` — přepis struktury + sekce/prvky (pips, track, budget, validace, hero).
- `diary-systems/styles/matrix.css` — kompletní přepis vizuálu (HUD).
- `diary-systems/sheets/matrix/constants.ts` — univerzální stupnice `LEVELS` 1–10, helpers.
- Nové sdílené prvky (kandidáti `_shared/`): `SkillPips`, `VitalTrack`, `BudgetBar` — ať jsou vytěžitelné pro ostatní systémy (16.2a vzor).
- Magie: helper `isMagic` / odkaz (pages directory).
- `__tests__/MatrixSheet.spec.tsx` — aktualizovat + testy validací a výpočtu.

---

## 7. Co NEděláme
- Žádná BE změna (data jedou přes volný `customData`).
- Neměníme výpočet bodů (trojúhelník + aspekty ×6 zachován).
- Neměníme ostatní systémy v tomto kroku (Matrix = vzor; ostatní následují).
- Neimplementujeme stupně magie do pips (varianta B — pips univerzální, detail magie = klik na pravidlo).

---

## 8. Otevřené otázky
- (žádné blokující — háčky H1–H5 se vyřeší v plánu.)
