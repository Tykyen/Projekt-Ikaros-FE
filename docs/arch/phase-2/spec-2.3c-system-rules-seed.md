# Spec 2.3c — Seed stránky „Pravidla" podle herního systému

**Rozšiřuje:** [spec-2.3b-dice-presets.md](spec-2.3b-dice-presets.md) — pokračování linie
„zvolený systém → přednastavený obsah".
**Důvod:** Zpětná vazba testerů — při prvním založení světa má dotyčný rovnou
dostat orientační soupis, jak pravidla zvoleného systému fungují.

---

## Cíl

Při vytvoření světa (`world.created`) se referenční stránka **Pravidla**
předvyplní orientačním textem pravidel pro zvolený `world.system`. Obsah je
plně editovatelný (běžná wiki stránka).

## Stav v kódu

- [pages-world-seed.listener.ts](../../../../Projekt-ikaros/backend/src/modules/pages/pages-world-seed.listener.ts)
  — `@OnEvent('world.created')` seeduje 5 prázdných stránek (`pravidla`,
  `magicky-system`, `technologie`, `faq`, `videa`). `world.system` je dostupný,
  ale dnes se nepoužívá.
- [page.schema.ts](../../../../Projekt-ikaros/backend/src/modules/pages/schemas/page.schema.ts)
  — `content: string` (TipTap **HTML**), `plainText: string` (search index).
- Sanitizér [sanitize-rich-text.ts](../../../../Projekt-ikaros/backend/src/common/utils/sanitize-rich-text.ts)
  pouští `h2, h3, p, ul, ol, li, strong, em, blockquote, a, table…` (ne h1/h4).
- `TipTapExtractor.extract(html)` → plainText (strip tagů).

## Návrh

- Nová BE konstanta `SYSTEM_RULES_TEMPLATES: Record<string, string>`
  (`system-rules-templates.ts` v pages modulu) — systemId → HTML pravidel.
  Obsah z dodaného PDF (`rychly_soupis_pravidel_rpg.pdf`), učesaný do sekcí
  přes builder (jednotný markup):
  - úvodní `<p>` (vysvětlení systému),
  - `<h2>Kostky</h2>`, `<h2>Základní hod</h2>` (`<ul>`),
  - `<h2>Postava</h2>` (`<ul>`), `<h2>Konflikt a souboj</h2>` (`<ul>`),
  - `<h2>Co hlídat u stolu</h2>`,
  - `<blockquote>` disclaimer („orientační tahák, ne plná pravidla").
- Listener: pro slug `pravidla` vezme `SYSTEM_RULES_TEMPLATES[world.system]`,
  prožene `sanitizeRichText`, dopočítá `plainText` přes injectnutý
  `TipTapExtractor`. Ostatní stránky beze změny (prázdné).

### Pokrytí systémů

Zpracováno 11 systémů: `dnd5e`, `jad`, `draci-hlidka`, `drd16`, `drd-plus`,
`drd2`, `gurps`, `shadowrun`, `pi`, `call-of-cthulhu`, `fate`.

> ⚠️ **`matrix` ZÁMĚRNĚ vynechán** — uživatel dodá vlastní text později.
> Matrix (default systém) tak prozatím dostane prázdná Pravidla, stejně jako
> `vlastni` / neznámý systém. Doplnit po dodání dat.

## Chování / hranice

- Seed běží **jen při založení světa** → pozdější změna systému v nastavení
  Pravidla **nepřepíše** (žádná destrukce ručních úprav).
- `vlastni` / neznámý / `matrix` → `content: ''` (PJ napíše vlastní).
- Magický systém + Technologie zatím prázdné (samostatná část, „později").

## Mimo rozsah

- Tlačítko „Vložit doporučený text pro systém" (re-apply po změně systému) —
  navrženo jako budoucí rozšíření, ne součást MVP.
- FE změny — stránka se renderuje existujícím PageViewer/RichTextEditor beze změn.

## Definition of done

1. 11 systémů má neprázdný validní HTML obsah (jen povolené tagy).
2. Listener plní `pravidla` dle systému + `plainText` (search-ready).
3. `matrix` / `vlastni` / neznámý → prázdná Pravidla.
4. Jest test listeneru (systém s textem vs. bez textu).
5. BE: `jest` zelené, `prettier --write`, typecheck + lint čisté. Po nasazení
   restart BE (jinak starý bundle).
