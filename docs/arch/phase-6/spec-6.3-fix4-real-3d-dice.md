# Spec 6.3-fix4 — Reálné fyzikální 3D kostky (dice-box-threejs)

**Status:** 🟡 Návrh — čeká schválení (vč. explicitního souhlasu s kompromisem skinů, §3.4)
**Rozsah:** FE only — nahrazení CSS „kostek" reálným 3D fyzikálním enginem ve fullscreen overlay (+ taktická mapa)
**Repo:** `Projekt-ikaros-FE`
**Autor:** PJ + Claude · 2026-06-17
**Souvisí:** [spec-6.3-fix3](spec-6.3-fix3-dice-token-render.md) (zamítnutý 2D žeton), [spec-6.3-fix-dice-orientation.md](spec-6.3-fix-dice-orientation.md), [spec-6.3.md](spec-6.3.md)

> Cíl: hod kostkou = **opravdová 3D kostka**, která se realisticky zakutálí a dopadne. Konec křehkých CSS polyedrů (deformace, prosvítání, „šíp" místo k4) i 2D žetonů.

---

## 1. Rozhodnutí

PJ explicitně chce **reálné 3D kostky** (varianta ② z diskuze), ne CSS pseudo-3D ani 2D plaketu. three.js je **už závislost projektu** (`three ^0.184`), takže reálné 3D není těžká nová závislost na renderu — přidává se jen dice engine + fyzika.

## 2. Knihovna

**[`@drdreo/dice-box-threejs@1.1.0`](https://github.com/drdreo/dice-box-threejs)** (Three.js + Cannon-es) — udržovaný fork `@3d-dice/dice-box-threejs`. Schváleno PJ (varianta A) 2026-06-17.

Proč tahle (fork místo originálu):
- **Předem daný výsledek** přes `@` notaci: `Box.roll('1d20@13')` — kostka se fyzikálně kutálí, ale **dopadne na 13**. Nutné pro Ikaros: výsledek je závazný (rollEngine/BE) a všichni hráči přes WS musí vidět totéž — animace nesmí mít vlastní RNG.
- **three jako peerDependency `^0.176`** → použije projektový `three 0.184`, **žádné dvojí three v bundlu** (originál `@3d-dice` táhne vlastní `three 0.143`).
- `cannon-es` (peer `^0.20`) — čistá JS fyzika, žádný ammo.wasm.
- **`theme_customColorset`** → vlastní barvy per skin (mapování §3.4).
- Výsledek přes `onRollComplete(results)` / `rollComplete` event / `await Box.roll()`.
- Konfig: `theme_colorset`, `theme_material` (`metal|wood|glass|plastic`), `theme_texture`, `theme_surface`, `shadows`, `sounds`, `gravity_multiplier`, `baseScale`, `light_intensity`, `color_spotlight`.

✅ **Brána ověřena (2026-06-17):** licence **MIT**; three peer `^0.176` (instalace `--legacy-peer-deps`, protože projekt má 0.184 > 0.176 — three je v tomto rozsahu API-stabilní, ověřit funkčně při smoke testu).
⚠️ Zbývá ověřit při implementaci: velikost JS+assetů na mobilu; funkčnost three 0.184 vs testovaný 0.176.

## 3. Architektura integrace

### 3.1 Nový render engine, stávající orchestrace zůstává

`DicePayload` (z [dicePayload.ts](../../../src/features/world/chat/dice/lib/dicePayload.ts)) + triggery zůstávají:
- chat: `DiceRollOverlayProvider.trigger(payload, skinId, rollerName)`
- mapa: `useMapDiceRoll`

Mění se **jen render uvnitř overlay**: místo CSS modelů poběží dice-box v transparentním canvasu přes celou plochu.

### 3.2 payload → dice notace (s předurčením)

Mapper `payloadToNotation(payload)`:

| payload.type | notace | pozn. |
|---|---|---|
| `d4/d6/d8/d10/d12/d20` | `1dN@<face>` | přímo |
| `pool-dN` (k kostek) | `kdN@f1,f2,…` | pořadí = `faces` |
| `d100` | `1d100@<tens+ones>` | ověřit, že engine d100 (desítky+jednotky) bere `@87` |
| `mixed` | `1dA+1dB@…` | hodnoty v pořadí `faces`/`faceTypes` |
| `fate` | **speciál** — viz 3.5 | engine nemá dF |

### 3.3 životní cyklus enginu

- Lazy init dice-boxu při prvním hodu (async — načte scénu, fyziku, assety). Singleton instance napříč overlay (ne re-init na každý hod).
- Po `onRollComplete` → držet finální stav `SHOW_TIME`, pak overlay schovat (zachovat stávající `onDone` smyčku + readout total/jméno).
- Cleanup canvasu při unmountu světa.

### 3.4 Skiny → témata ⚠️ KOMPROMIS (nutný souhlas)

Reálná kostka si stěny **renderuje sama** (geometrie + číslo). Bespoke per-číslo obrázky (`d20_13Img`…) **na 3D kostce nebudou**. Skin degraduje z „art na každé tváři" na **barvu + materiál**:

- Tabulka `skinId → { colorset, material, texture, numberColor }` (odvodit z `bgGradient`/`coreColor`/`symbolColor`/`borderColor`).
- Příklad: `obsidian → {material:'glass', barva černá, čísla cyan}`, `ivory → plastic bílá`, `wood → wood`, `crystal → glass`.
- Identita palety zůstane; konkrétní kresba čísel ne.

📚 *Dopad:* per-číslo cloudinary textury (stovky webp) se na kostce přestanou používat. **Zůstanou** ale potřeba pro picker/skin náhledy a 2D historii v chatu (`DiceMessage`/`SettledDieFace`) — ty se nemění, řeší jen render hozené kostky v overlay.

### 3.5 Fate (speciál)

dice-box nemá Fudge kostku. Volby (rozhodne impl. plán):
- (a) Mapovat fate na d6 s tématem, kde stěny = +/−/0 (vyžaduje custom face texturu enginu) — složitější.
- (b) **Fate ponechat na stávajícím renderu** (2D `<img>` tváře, co overlay už má) — pragmatické, fate je „odhalení", ne kutálení. Doporučuji (b) pro v1.

### 3.6 Fallback (mobil / bez WebGL / reduced-motion)

base.md vyžaduje funkci na mobilu. Když WebGL chybí / `prefers-reduced-motion` / nízký výkon:
- fallback = okamžitý výsledek bez 3D (jednoduchá karta s číslem + readout). Žádné selhání naprázdno.
- Mobile perf 3D ověřit přes `mobil-desktop`; když bude těžké, fallback i pro malé viewporty.

### 3.7 Assety

dice-box vyžaduje zkopírovat assety (modely/textury/zvuky) do statického adresáře. → do `public/dice-box/`, `assetPath` v configu. Verzovat s libem.

## 4. Mimo rozsah

| Položka | Důvod |
|---|---|
| Per-číslo skin art na 3D kostce | Technicky nejde bez custom UV pipeline; vědomý kompromis 3.4. |
| Změna BE/WS kontraktu | Výsledek už chodí v payloadu; engine ho jen vizualizuje. |
| Chat rolling fáze (malá kostka u zprávy) | Zůstává stávající (2D snapshot historie). Mění se fullscreen overlay (+ mapa overlay). |
| Zvuky kostek | Volitelné (`sounds`), default off; doladit zvlášť. |

## 5. Akceptační kritéria

- [ ] Hod k4/k6/k8/k10/k12/k20/k100 = reálná 3D kostka, realisticky se zakutálí a **dopadne na hodnotu z payloadu** (ověřeno: payload face == zobrazená tvář).
- [ ] Dva prohlížeči (WS) vidí **stejný výsledek** (předurčení funguje).
- [ ] Readout (total, jméno) zůstává.
- [ ] Fate hod funguje (dle 3.5).
- [ ] Bez WebGL / reduced-motion → fallback, nikdy prázdno.
- [ ] `mobil-desktop` audit (3D na mobilu i desktopu, nebo fallback).
- [ ] `npm run build` (tsc -b) zelený; dice testy zelené.
- [ ] Licence libu ověřena (MIT/kompatibilní).

## 6. Otevřené otázky pro PJ

1. **Souhlas s kompromisem skinů (3.4)** — per-číslo art zmizí z kutálené kostky, skin = barva/materiál. ✅/❌?
2. **Fate** — ok ponechat na 2D (doporučení 3.5b), nebo trváš i na 3D fate?
3. **Mapování skin→materiál** — udělám návrh tabulky sám (znám tvé skiny), nebo to chceš odsouhlasit po jednom?

---

**Po schválení:** gate (licence/three verze) → `npm i` → `plan-6.3-fix4-real-3d-dice.md` (komponenta wrapperu, mapper, témata, fallback) → potvrzení → kód → `mobil-desktop`.
