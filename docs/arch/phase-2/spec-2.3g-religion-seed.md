# Spec 2.3g — Náboženství: sekce ve wizardu + seedovaná stránka

**Status:** 🚧 Schváleno (návrh 2026-07-15), implementace
**Rozsah:** FE (nová sekce + konstanta + payload) + BE (2 pole DTO/schema/interface + 1 template + seed listener)
**Autor:** PJ + Claude
**Datum:** 2026-07-15
**Souvisí:** [spec-2.3.md](./spec-2.3.md) (wizard), [spec-2.3d-technology-seed.md](./spec-2.3d-technology-seed.md), [spec-2.3e-magic-seed.md](./spec-2.3e-magic-seed.md) — přímé vzory
**Podnět:** Připomínka testera — „při tvorbě se stvoří Magický systém a Technologie, přidejte i Náboženství s tím, co vše se u náboženství řeší."
**Rešerše:** 8+ zdrojů (Inkwell Ideas, World Anvil Academy, Springhole, D&D *divine rank* 0–21, Pathfinder edikty/anathema, Ars Magica sféry moci, religionistická typologie theism/church-sect). Podklad v konverzaci 2026-07-15.

---

## 1. Cíl

Při tvorbě světa přibude sekce **Náboženství** (analogicky k Technologii a Magii). PJ zvolí **roli náboženství** (škála 0–14) a **typy náboženství** (multi-select). Volby se při založení vypíšou na novou seedovanou referenční stránku **Náboženství** (menu Informace), jejíž hlavní hodnotou je **osnova „co vše u náboženství vyřešit"**. Po založení se v Nastavení nemění (jako TÚ/tradice magie) — PJ upravuje přímo obsah stránky.

---

## 2. Datový model

Dvě nová pole světa (vzor `techLevelMin/Max` + `magicTraditions`):

| Pole | Typ | Rozsah | Default | Formulářový prvek |
|---|---|---|---|---|
| `religionInfluence` | `number \| null` | 0–14 | `6` (organizovaná církev) | single `<select>` |
| `religionTypes` | `string[]` | volný string | `[]` | multi-select `PillChips` |

- **BE drží volný string** u `religionTypes` (jako `genre`/`magicTraditions`) — FE konstanty řídí UX, žádná enum validace.
- `religionInfluence` validace `@IsInt @Min(0) @Max(14)`.
- Propagace: `worlds.service.create` spreaduje `...worldDtoFields` → pole projdou do `worldsRepo.save` bez zásahu do service (ověřeno).

---

## 3. Škála „Role a přítomnost božského" (0–14)

Dolní půle = sociální vliv (sekulární → teokracie), horní = reálná přítomnost božského. Zdroj: De Gruyter „5 modelů stát–náboženství", Wikipedie „State religion" tiers, D&D divine rank, TV Tropes Physical God / Deist.

```
 0  Bez náboženství / militantní ateismus
 1  Sekulární — víra osobní, oddělená od státu
 2  Pověra a folklor
 3  Animismus / kult předků
 4  Lidový polyteismus
 5  Městské / státní kulty
 6  Organizovaná církev   ← default
 7  Mocná církev
 8  Státní náboženství
 9  Teokratické prvky
10  Teokracie
11  Prokázané zázraky
12  Přítomní poslové (andělé/avataři/proroci)
13  Chodící bohové
14  Živá božská realita
```
Každá úroveň nese `name` + jednovětný `core` popis (viz `religion-template.ts`).

---

## 4. Typy náboženství (multi-select, 14 + Vlastní)

Monoteismus · Polyteismus · Henoteismus · Dualismus · Panteismus · Animismus · Kult předků · Kult přírody · Šamanismus · Mystika · Kult smrti · Vládní / císařský kult · Non-teismus (filozofie) · Temné kulty. Každý s jednovětným popiskem (tooltip). Zdroj: religionistická typologie (theism spektrum + spirit/nature systémy + kulty).

---

## 5. Seedovaná stránka „Náboženství"

`buildReligionPage(influence, types)` → HTML (TipTap, **bez `<table>`**). Struktura (vzor magic/technology template):

1. Úvod.
2. **Náboženství tohoto světa** — z voleb (role + typy); vynechá se, když nic nezvoleno.
3. Jak škálu používat (osa je herní pomůcka; rozlišuj svět/region/frakci/postavu).
4. Přehled úrovní 0–14.
5. **✦ Osnova: co u náboženství vyřešit** (15 bodů — hlavní deliverable):
   Panteon a domény · Stvořitelský mýtus · Kněžstvo a hierarchie · Chrámy a svatá místa · Rituály a obřady (narození/svatba/pohřeb) · Svátky a posvátný kalendář · Písmo a nauka · Morálka, přikázání, hřích · Posmrtný život a pohřby · Vztah k magii · Tolerance, hereze, schizma · Relikvie, symboly, ikonografie · Tabu · Církev a světská moc · Misie a konverze.
6. Typy náboženství (výčet s popisy).
7. Kombinace s magií a technologií (příklady BÚ×MÚ×TÚ).
8. Disclaimer (orientační worldbuilding nástroj).

---

## 6. Dotčené soubory

### BE (`Projekt-ikaros`)
- `worlds/interfaces/world.interface.ts` — `religionInfluence?`, `religionTypes?`.
- `worlds/schemas/world.schema.ts` — `@Prop` obě pole.
- `worlds/dto/create-world.dto.ts` — validace.
- **nový** `pages/religion-template.ts` — `buildReligionPage` + `RELIGION_LEVELS` + `RELIGION_TYPES`.
- `pages/pages-world-seed.listener.ts` — `PAGE_TEMPLATES` (+ `nabozenstvi`, order 3; faq→4, videa→5), `seedContent` case, import.
  - **Matrix svět seeduje Náboženství taky** (NENÍ v `MATRIX_RULEBOOK_REPLACES` — Pravidlová kniha náboženství neřeší).

### FE (`Projekt-ikaros-FE`)
- **nový** `CreateWorldPage/constants/religion.ts` — `RELIGION_TYPES` + descriptions + `RELIGION_LEVELS` (duplikace s BE, jako magie/technologie).
- **nový** `CreateWorldPage/components/ReligionSection.tsx` — single select osy + `PillChips` typů.
- `CreateWorldPage/CreateWorldPage.tsx` — state `religionInfluence`/`religionTypes`, render (za Magií), payload, přečíslování `SectionCard` index (Náboženství 8, Motiv 9, Kalendáře 10).
- `world/api/useCreateWorld.ts` — `CreateWorldInput` pole.

### Docs
- `funkce/03-uvodnik-objevovani-svetu.md` — seed list + sekce formuláře.
- `HelpPage/sections/WorldSection.tsx` — „Pravidla, Magický systém, Technologie" → + Náboženství; CalloutBox „Předvyplněno při založení".

---

## 7. Acceptance

1. Formulář tvorby má sekci Náboženství: single select role (default „Organizovaná církev") + multi-select typů.
2. Submit pošle `religionInfluence` + `religionTypes` do `POST /worlds`.
3. Nový svět (i Matrix) dostane stránku `nabozenstvi` v menu Informace, obsah odpovídá volbám.
4. `nabozenstvi` má unikátní `order`, faq/videa se neposunou na kolizní číslo.
5. `tsc -b` (FE) + `npm run build` ✓, BE `typecheck` + `lint:check` ✓.
6. Responsivita staticky OK (mobil-desktop).

---

## 8. Out of scope

- Editace `religionInfluence`/`religionTypes` v Nastavení světa (jako TÚ/magie — jen při tvorbě).
- Strukturovaný editor panteonu / božstev (stránka je volný text, PJ píše ručně).
- Napojení na kalendář světa (svátky) — jen zmínka v osnově, žádná automatika.
