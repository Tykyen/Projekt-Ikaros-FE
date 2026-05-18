# Spec 5.0g — Port 16 chybějících skinů ze starého Matrixu

**Status:** 🟡 Návrh — čeká na schválení
**Rozsah:** FE — 16 nových theme definic (`index.ts` + `decorations.css`), rozšíření `ThemeId`, registry, přemapování `genres.ts`
**Větev:** `feat/krok-5.0g-skin-port`
**Velikost:** odhad ~34 souborů / ~6000–8000 ř. (16 × index.ts + 16 × decorations.css + úpravy registry/typů/genres + testy)
**Autor:** PJ + Claude
**Datum:** 2026-05-17
**Souvisí:** [spec-5.0.md](./spec-5.0.md) (theme systém), oprava regrese kroku 5.0

---

## 1. Cíl

Doplnit 16 vizuálních skinů, které měl starý Matrix a krok 5.0 je při přenosu zahodil. Po dokončení má Ikaros **37 motivů** (21 stávajících + 16 nových) a každý z 32 herních žánrů má **vlastní** skin (`themeForGenre` 1:1, žádné sdílení).

---

## 2. Kontext / motivace

- Starý Matrix měl **37 skinů** — `IkarosThemes.scss` (711 ř.), výběr přes `GENRE_TO_SKIN` mapu (32 žánrů → 32 skinů) a CSS třídy `.skin-<name>`.
- Krok 5.0 přenesl jen **21** motivů; zbylých 16 žánrů dostalo sdílený motiv přes `themeForGenre` (např. Horor + Psychologický horor + Lovecraft → všechny `nemrtvi`).
- To je **regrese vůči starému systému** a porušení pravidla autora „ornamenty každého skinu originální, žádné sdílení/recyklace mezi tématy".
- Krok 5.0 je formálně uzavřený — tento spec je jeho **dodatek (5.0g)**.

**Chybějících 16 skinů** (žánr → nový `ThemeId`):

| Žánr | ThemeId | Žánr | ThemeId |
|---|---|---|---|
| Fantasy | `fantasy` | Lovecraftovský horor | `lovecraft` |
| Heroic fantasy | `heroic` | Thriller | `thriller` |
| Urban fantasy | `urban-fantasy` | Alternativní historie | `alt-historie` |
| Soft sci-fi | `soft-sci-fi` | Steampunk | `steampunk` |
| Biopunk | `biopunk` | Dieselpunk | `dieselpunk` |
| Post-postapo | `post-postapo` | Weird fiction | `weird` |
| Dystopie | `dystopie` | Grimdark | `grimdark` |
| Military | `military` | Psychologický horor | `psycho` |

> `ThemeId` slugy česky/kebab-case dle konvence stávajících 21 (`modre-nebe`, `temna-cerven`…).

---

## 3. Audit současného stavu

### 3.1 Nový theme systém (cílový tvar)

- `src/themes/types.ts` — `Theme = { id, name, scope, atmosphere, vars, fonts, thumbnail, background, decorationsModule, reducedMotion? }`.
- `src/themes/themes/<id>/` — `index.ts` (Theme objekt) + `decorations.css` (ornamenty).
- `src/themes/registry.ts` — import + zápis do `THEMES`.
- `public/themes/backgrounds/*.webp` (22) + `public/themes/thumbnails/*.webp` (22).
- `genres.ts` — `GENRES[].theme` + `themeForGenre`.

### 3.2 Barevná identita 16 skinů (extrahováno z `IkarosThemes.scss`)

| Skin | Akcent | Panel (surface) | Atmosféra | Pozadí (sdílené) |
|---|---|---|---|---|
| `fantasy` | zelená `#69f0ae` + fialová `#b388ff` | zeleno-modrý gradient | temná lesní magie | `magie.webp` |
| `heroic` | zlatá `#ffc107`/`#ffecb3` | zlato-modrý gradient | věk hrdinů, zlatý heroismus | `modre-nebe.webp` |
| `urban-fantasy` | fialová `#ce93d8`/`#9c27b0` | purpurově-tmavý | noční město s magií | `kyberpunk.webp` |
| `soft-sci-fi` | cyan `#00e5ff`/`#84ffff` | modrý jemný gradient | měkké explorativní sci-fi | `sci-fi.webp` |
| `biopunk` | neon-zelená `#76ff03`/`#64dd17` | radiální zeleno-tmavý | bioluminiscentní mutace | `priroda.webp` |
| `post-postapo` | ošlehaná zelená `#9ccc65` | zeleno-hnědý gradient | obnova po apokalypse | `priroda.webp` |
| `dystopie` | krvavě rudá `#d50000` + šedá | šedo-černý gradient | totalitní beton | `severske-runy.webp` |
| `military` | olivová `#556b2f`/`#8fbc8f` | maskáčový opakující vzor | tvrdá vojenská přesnost | `severske-runy.webp` |
| `psycho` | tmavá fialová `#7b1fa2`/`#ce93d8` | fialovo-černý gradient | fialové delirium | `nemrtvi.webp` |
| `lovecraft` | teal `#004d40`/`#4db6ac` | tmavě teal radiální | kosmický horor hlubin | `nemrtvi.webp` |
| `thriller` | výstražná žlutá `#ffeb3b` | černý gradient | napětí, minuty do konce | `temna-cerven.webp` |
| `alt-historie` | hnědá `#d7ccc8`/`#8d6e63` | hnědý radiální | historické archivy | `pergamen.webp` |
| `steampunk` | mosazná oranž `#ffb300` | hnědo-černý gradient | viktoriánská pára a mosaz | `hospoda.webp` |
| `dieselpunk` | ocelová šedá `#9e9e9e` | šedo-černý gradient | studený válečný průmysl | `postapo.webp` |
| `weird` | pink chaos `#ff4081`/`#ff80ab` | pink-modrý radiální | surreální chromatická aberace | `magie.webp` |
| `grimdark` | temně rudá `#b71c1c`/`#ef5350` | černo-rudý radiální | beznaděj bez východu | `temna-cerven.webp` |

Plné `vars` sady (100+ tokenů) sestaví implementace dle struktury stávajících themes.

---

## 4. Návrh řešení

### 4.1 Nové theme definice

Pro každý z 16 skinů vznikne `src/themes/themes/<id>/`:
- **`index.ts`** — `Theme` objekt. `vars` odvozené z barevné identity (§3.2), dotvořené do kvality 5.0: glass tokeny (`--theme-surface`, `--theme-surface-strong`, `--theme-border`, `--theme-text`, `--theme-heading`, `--theme-accent`, `--theme-accent-bright`, `--theme-glow-*`, `--theme-shadow`, nav stavy) + legacy aliasy (`--bg-*`, `--accent`, `--text-*`…) + fonty + layout chrome — kompletní sada jako stávajících 21.
- **`decorations.css`** — ornamenty **čistě z CSS** (gradient overlaye, `box-shadow`, pseudo-elementy, inline SVG `data-uri`, `@keyframes` animace). Originální per skin — žádné sdílení mezi nimi. `prefers-reduced-motion` respekt.
- `scope: 'world'` (skiny světů; do platform switcheru nepatří).

### 4.1b Vizuální identita — signature ornament per skin

Design audit (`frontend-design`, 2026-05-18). Aby skin nepůsobil genericky, každý dostane **jeden charakteristický ornament** v `decorations.css` (CSS/SVG, žádné rastry) + barevnou DNA z §3.2 + výrazový font.

| Skin | Signature ornament (CSS) | Font display |
|---|---|---|
| `fantasy` | stoupající světélkující spory (CSS particles), zeleno-fialový dvojglow panelů | Cinzel |
| `heroic` | paprskový lesk za nadpisy, zlatá heraldická linka pod sekcemi | Cinzel Decorative |
| `urban-fantasy` | neonová záře okrajů, jemný scanline „okna v noci" | Rajdhani |
| `soft-sci-fi` | soustředné radar-pulsy, tenké čisté linky | Exo 2 |
| `biopunk` | pulzující „dýchavý" neon-zelený glow, organické buněčné skvrny | Audiowide |
| `post-postapo` | praskliny + zeleň prorůstající z rohů (gradient) | Oswald |
| `dystopie` | varovné diagonální šrafování na akcentech, tvrdé hrany | Oswald |
| `military` | maskáčový overlay (opakující gradient), stencilový dojem | Oswald |
| `psycho` | zkreslené `skew` hovery, vlnící se fialový gradient | Cormorant Garamond |
| `lovecraft` | hluboká teal vignette, chapadlový SVG ornament v rozích, pomalý glow | IM Fell English |
| `thriller` | žluto-černé hazard šrafování okrajů aktivních prvků, tikající puls | Oswald |
| `alt-historie` | papírová noise textura, inkoustové linky, sépiový nádech | Cormorant Garamond |
| `steampunk` | ozubené kolo (SVG) + mosazné nýty v rozích | Cinzel |
| `dieselpunk` | kartáčovaný kov gradient, ocelové nýty, industriální hrany | Oswald |
| `weird` | chromatická aberace nadpisů (RGB-split text-shadow), nepravidelné rotace | Audiowide |
| `grimdark` | těžká vignette, popraskané rudé světlo, ztlumená paleta | Cormorant Garamond |

Ornament je **lazy** (`decorationsModule` import) — načte se jen aktivní skin. `prefers-reduced-motion` respekt u všech animací.

### 4.2 Pozadí a thumbnaily — sdílení (rozhodnuto autorem)

- `background` — ukazuje na **existující** webp pozadí dle tabulky §3.2 (mapování přeneseno z `$skins-bg` starého Matrixu — věrný port; starý Matrix pozadí rovněž sdílel).
- `thumbnail` — dočasně ukazuje na **totéž** sdílené pozadí webp (switcher zobrazí náhled, jen ne malý optimalizovaný soubor).
- ⚠️ Dedikovaná pozadí + thumbnaily = **dluh D-NEW-skin-assets** (dodá grafik); skiny fungují i bez nich.

### 4.3 Registrace a typy

- `src/themes/types.ts` — `ThemeId` rozšířen o 16 nových slugů.
- `src/themes/registry.ts` — 16 importů + zápis do `THEMES`. Pořadí: nové skiny za stávajících 21.
- Výsledek: `THEMES` má 37 položek; `listThemes('world')` vrátí všechny.

### 4.4 Přemapování žánrů

`src/features/ikaros/pages/CreateWorldPage/constants/genres.ts` — 16 dotčených žánrů dostane `theme` ukazující na vlastní nový skin (1:1). Zbylých 16 žánrů beze změny. Výsledek: každý ze 32 žánrů má vlastní motiv, `themeForGenre` nikde nesdílí.

### 4.5 Postup implementace (iterativní)

Kvůli rozsahu (16 skinů) implementace začne **jedním vzorovým skinem** (`fantasy`) — kompletní `index.ts` + `decorations.css`. Po vizuálním ověření vzniknou zbylé podle stejného vzoru. Detail řeší impl. plán.

---

## 5. Out of scope

- **Dedikovaná webp pozadí** pro 16 skinů — sdílí se existující (dluh D-NEW-skin-assets).
- **Dedikované webp thumbnaily** — ukazují na sdílené pozadí (dluh D-NEW-skin-assets).
- **Raster decor ornamenty** (`decor/*.webp` jako u `nemrtvi`) — nahrazeny CSS/SVG ornamenty.
- **Theme editor UI** (5.3f) — beze změny; nové skiny se v něm objeví automaticky přes `listThemes`.
- **Změna 21 stávajících skinů** — netýká se jich.

---

## 6. Acceptance kritéria

1. `ThemeId` obsahuje 16 nových slugů; `THEMES` má 37 položek.
2. Každý z 16 skinů má `src/themes/themes/<id>/index.ts` s kompletní `vars` sadou (rozsah jako stávající 21) + `decorations.css`.
3. `decorations.css` každého skinu je originální (žádné dva nesdílejí ornamentální CSS).
4. `background` každého skinu ukazuje na existující webp dle §3.2; `thumbnail` rovněž (žádný 404).
5. `genres.ts` — všech 32 žánrů má `theme` ukazující na vlastní motiv; `themeForGenre` nikde nevrací sdílený motiv pro různé žánry.
6. `WorldThemeSwitcher` i theme editor (5.3f) zobrazí všech 37 motivů.
7. Barevná identita každého skinu odpovídá staré matrixovské (akcent, atmosféra dle §3.2).
8. `lint`, `lint:colors` (theme soubory v ALLOW listu), `tsc`, `build`, `test:run` ✓.
9. `mobil-desktop` audit — náhled aspoň 3 nových skinů na mobilu/desktopu.

---

## 7. Test plán

- `registry` — `THEMES` má 37 položek; `listThemes('world')` je obsahuje; `getTheme(<nový id>)` vrací správný theme (ne fallback).
- `themeForGenre` — každý z 32 žánrů vrací unikátní motiv; žádné dva žánry stejný (kromě legitimních).
- `applyTheme(<nový id>)` — nastaví `data-theme`, zapíše `vars`.
- Smoke: ve `WorldSettingsPage` tab Vzhled projet preset grid — 37 motivů, výběr nového funguje, živý náhled.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| 16 skinů vizuálně nekonzistentních | Střední | Střední | Vzorový skin první + review; sdílená struktura `vars`. |
| `decorations.css` 16× nafoukne bundle | Nízká | Nízký | `decorationsModule` je lazy import — načte se jen aktivní skin. |
| Sdílená pozadí působí lacině | Střední | Nízký | Akceptováno autorem; dluh na dedikované assety. |
| `lint:colors` hlásí hex v theme souborech | Jistá | Žádný | `src/themes/themes/` je v ALLOW listu skriptu. |

**Rollback:** Revert commitu. Aditivní změna (nové soubory + rozšíření enumu/mapy) — 21 stávajících skinů a zbytek appky beze změny.

---

## 9. Otázky k autorovi

Žádné — rozhodnuto: věrný port se sdílenými pozadími, CSS ornamenty, dedikované assety = dluh.

> Po schválení → implementační plán (vzorový skin → zbytek).
