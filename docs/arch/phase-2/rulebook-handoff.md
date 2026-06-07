# Pravidlová kniha (spec 2.3f) — HANDOFF / stav práce

> Souhrn pro navázání v jiné konverzaci. Stav k **2026-06-07**.
> V nové konverzaci stačí říct: *„načti `docs/arch/phase-2/rulebook-handoff.md`
> a navaž na Pravidlové knize"*.

## Co to je

Svět se systémem **„Ikaros pravidla" (matrix)** dostává vlastní **Pravidlovou
knihu** — vícestránkovou, učesanou a graficky přetvořenou („výkladní skříň").
Zdroj = stará Matrix DB. NE raw klon: texty učesané, graficky přetvořené.

## Klíčová pravidla / rozhodnutí (NEMĚNIT bez PJ)

- ⚠️ **Čísla jsou posvátná.** Mechaniky/hodnoty 1:1 se zdrojem. Učesání =
  jen formulace + struktura + představitelnost, NIKDY ne změna čísel.
  (Ověřeno skriptem — viz „Pomocné skripty".)
- **Magie:** každý stupeň popsaný „co dokážeš" + barevná **tepelná škála**
  (barva dle čísla stupně, nepukládá se — počítá komponenta).
- **Magie v seznamu = ABECEDNĚ.**
- **Architektura (F1):** rulebook = normální `Page` dokumenty. Zdroj = verzovaná
  TS data v repu → idempotentní seed do matrix světů. Matrix singleton svět
  (`MATRIX_WORLD_ID`) = master (Superadmin/PJ edituje stávajícím editorem).
  Žádná nová kolekce. Propagace edits do nových světů (klon) = F6.
- **Design jazyk = „arkánní terminál / kodex":** ikaros tokeny (fialová
  `#a96cff`), fonty Orbitron (číslice/UI) + Rajdhani + Crimson Pro (próza),
  Matrix rain. Signature: kodex hub, **QuickRef HUD**, **LevelSpine** (F2).
- Git: commit přímo na **main**, oba repo zvlášť (FE + BE), PJ řekne kdy.

## STAV FÁZÍ

- **F0 — HOTOVO.** Extrakce + učesání všech 13 kapitol + soupis obrázků.
- **F1a (BE) — HOTOVO, commitnuto** (`Projekt-ikaros` main `40a9c04`).
- **F1b (FE) — HOTOVO, commitnuto** (`Projekt-ikaros-FE` main `5059261c`).
- **F2 — TODO:** Magická pravidla (21 typů) + `LevelSpine` (barevná páteř) +
  magie sub-hub `magicka-pravidla` + obrázky (webp hotové).
- **F3 — TODO:** Programování (8 mechanik z `matrix-informace`).
- **F4 — TODO:** Jazyková politika (bez států) + Jazykové rodiny.
- **F5 — TODO:** Přenosnost mezi světy (per-PJ knihovna).
- **F6 — TODO:** Superadmin editace masteru + propagace (klon do nových světů)
  + UI pro editaci `quickRef` (přidat do CreatePageDto + PageEditor).
- **F7 — ODLOŽENO:** Katalog 68 programů (sbalovací záznamy).

## Dokumenty (v repu, `docs/arch/phase-2/`)

- `spec-2.3f-ikaros-rulebook.md` — spec, fázování, vyřešené otázky.
- `rulebook-content.md` — **učesaný obsah všech 13 kapitol** (zdroj pravdy textu;
  čísla 1:1). Z něj se generuje BE seed.
- `rulebook-inventory.md` — inventář staré DB (strom, slugy, kvalit. nálezy).
- `rulebook-obrazky.md` — soupis obrázků (slug ↔ co zobrazit).
- `rulebook-design-plan.md` — design jazyk + plán F1.
- `rulebook-handoff.md` — tento soubor.

## Kód — co kde leží

**BE (`Projekt-ikaros/backend/src/modules/pages/`):**
- `rulebook/rulebook-seed-data.ts` — AUTOGEN seed data (hub + kap. 1–9).
- `rulebook/rulebook-matrix-seed.ts` — bootstrap do matrix singletonu.
- `pages-world-seed.listener.ts` — gate matrix (vypne generický
  pravidla/magicky-system/technologie) + `seedRulebook()`.
- `schemas/page.schema.ts`, `interfaces/page.interface.ts`,
  `repositories/pages.repository.ts` — přidáno pole **`quickRef`**.

**FE (`Projekt-ikaros-FE/src/features/world/pages/PageViewer/`):**
- `layouts/RulebookHub.tsx` (+`.module.css`) — kodex index hubu Pravidla.
- `components/QuickRef.tsx` (+`.module.css`) — HUD „Rychlý přehled".
- `layouts/OstatniLayout.tsx` — renderuje QuickRef v aside (kapitoly).
- `PageViewer.tsx` — dispatch RulebookHub pro matrix `pravidla`.
- `api/pages.types.ts` — Page type + `quickRef`.
- `public/rulebook/<slug>.webp` — 34 obrázků (kapitoly + magie + programování).

## Pomocné skripty (LOKÁLNĚ v `C:\tmp\`, NEverzované)

> ⚠️ Pro F2+ a regeneraci dat budou potřeba. Zvážit přesun do repo `scripts/`.

- `matrix-pages-raw.json` — celý raw export staré Matrix DB (3540 stránek).
- `rulebook-source.md` — strukturovaný zdroj (TipTap→md) všech kapitol+magie.
- `build-rulebook-data.js` — konvertor `rulebook-content.md` → BE seed data
  (zatím jen kap. 1–9 + hub; pro F2 rozšířit o magii + `levels`).
- `convert-rulebook-images.js` — PNG (`C:\tmp\rulebook-images\`) → webp do
  `FE/public/rulebook/` (mapování názvy→slugy).
- `verify-numbers.js` — kontrola čísel zdroj vs učesaný obsah (per typ magie).
- `rulebook-prototype.html` — klikací prototyp vzhledu (kodex/HUD/LevelSpine).

## Jak navázat / ověřit

1. **Vidět F1:** restartovat BE (`Projekt-ikaros/backend`) → seed se dosází →
   FE `npm run dev` → svět **matrix → Informace → Pravidla**.
2. Build: BE `npm run typecheck`, FE `npm run build` (oba zelené k 2026-06-07).
3. **F2 start:** rozšířit `build-rulebook-data.js` o kapitolu 10 (magie) — přidat
   pole `levels: {stupen,text}[]` na Page (BE schema/interface/repo + FE type),
   postavit `LevelSpine` komponentu (barva dle stupně), magie sub-hub.

## Otevřené drobnosti

- `napoveda` skill — spustit, až bude víc fází viditelných.
- `quickRef` editace přes editor — chybí UI (CreatePageDto + PageEditor); zatím
  jen seedované (editace stránky ho ale nesmaže — `$set` partial).
- `programovani-hub.webp` (Matrix rain) připraven pro F3 hub.
- Cloudinary re-host obrázků — neřešen, statika v `public/` zatím stačí.
