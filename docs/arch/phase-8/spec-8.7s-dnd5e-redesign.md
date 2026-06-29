# Spec 8.7s — D&D 5e = úplné dvojče JaD (deník + mapa + chat + bestie + skiny)

**Status:** ✅ implementováno (2026-06-29) — build čistý, testy zelené (deník 21 + bestie schéma 9 + combat/bestie panely + skiny). Čeká: živý mobil-desktop na zařízení + `funkce`/`napoveda` + BE deploy.
**Vzor:** JaD — 8.7p (deník), 8.7q (combat panel), 8.7r (bestie). Viz [spec-8.7p](spec-8.7p-jad-redesign.md), [spec-8.7q](spec-8.7q-jad-combat-panel.md).

## 1. Cíl a princip

Uživatel: *„celý systém JaD je to samé jako D&D 5e, jediný rozdíl je v zázemí a povolání."*
→ dnd5e je **úplný klon JaD** napříč všemi plochami (deník, taktická mapa PC, chat PC, bestie na mapě i v chatu, 8 skinů). **Jediný rozdíl proti JaD:** povolání (`DND_CLASSES`) a zázemí (`DND_BACKGROUNDS`). Vše ostatní (layout, datový model `dnd_*`, k20 mechanika, fatální hody, mixed zásah, pergamen + 8 skinů) je 1:1 přejmenovaný JaD (`jad_`→`dnd_`, `.jad-`→`.dnd-`, `[data-diary-system='jad']`→`'dnd5e'`).

## 2. Povolání + zázemí (jediný rozdíl)

**`DND_CLASSES`** (12, `sheets/dnd5e/constants.ts`) — práh oboru + obory:

| Povolání | sub | obory |
|---|---|---|
| Barbar | 3 | Berserkr · Totemový — Medvěd/Vlk/Orel/Los/Tygr · Bojechtivec |
| Bard | 3 | Bojový · Znalostní |
| Bojovník | 3 | Čaroknecht · Šampión · Taktik · Rytíř |
| Čaroděj | 1 | Divoká magie · Démoní rod · Bouřný čaroděj |
| Černokněžník | 1 / **3** | **Patron** (Arcivíla/Běs/Prastarý/Nehynoucí) + **Pakt** (čepele/rukověti/řetězu) |
| Druid | 2 | Kruh měsíce · Kruh země — 8 terénů |
| Hraničář | 3 | Lovec · Pán zvířat |
| Klerik | 1 | Bouře · Příroda · Světlo · Šalba · Válka · Znalost · Život · Mystika |
| Kouzelník | 2 | 7 škol + Zpěv meče |
| Mnich | 3 | Cesta čtyř živlů / otevřené ruky / stínů / dlouhé smrti · Sluneční duše |
| Paladin | 3 | Oddanost · Pomsta · Starověku · Koruny |
| Tulák | 3 | Mystický šejdíř · Vrah · Lupič · Šibal · Švihák |

**Černokněžník = jediná strukturní odchylka:** 2 osy (patron od 1. úr + pakt od 3. úr) přes optional `DndClassDef.sub2/list2/label2` a pole `DndClassRow.s2`. Spadá pod „povolání a jeho věci" (odsouhlaseno). Ostatní povolání = jeden select jako JaD.

**`DND_BACKGROUNDS`** = 25 zázemí (`Agent frakce … Žoldnéř`). **Casteři** (auto-tab kouzel) = Bard/Čaroděj/Černokněžník/Druid/Klerik/Kouzelník/Paladin/Hraničář.

## 3. Klonované soubory (jad → dnd5e)

- **Deník:** `sheets/dnd5e/{DndSheet.tsx, constants.ts, formulas.ts}` + spec; `styles/dnd5e.css`.
- **Skiny:** `styles/dnd5e-skins/*.css` (8) + `@import` v `diary-skins.css` + `DEFAULT_SKIN_BY_SYSTEM.dnd5e='fantasy'`.
- **Combat panel PC (mapa+chat):** `system-panels/DndCombatPanel.tsx` + `.module.css` + spec (registr `combatPanels.ts['dnd5e']`).
- **Bestie:** `schemas/dnd5e/{bestie.json, token.json}` (systemId `dnd5e`, jinak = JaD) + `system-panels/DndBestiePanel.tsx` + `.module.css` + `DndBestieCombatActions.tsx` + spec; chat `rail/DndChatBestiePanel.tsx`; test `schemas/__tests__/dnd5e-bestie.test.ts`.
- **Routing:** `TokenSystemSheet.tsx` (dnd5e bestie větev), `BestieInstancePanel.tsx` + `BestieRollPanel.tsx` (dnd5e chat bestie větev). Bootstrap už `dnd5eSchemas` registroval.

## 4. Sdílený datový kontrakt

Deník i combat/bestie panely čtou stejná `dnd_*` data (`abi_*`, `save_*`, `skill_*`, `classes`, `weapons`, `spl_*`, `hpCur/hpMax`, `ds_s/ds_f`, `qc_ss_dc`, …). Proto byl combat panel přepsán z JaD modelu (ne ponechán starý dnd `attacks`/`deathSuccess`), aby nevznikl desync. Migrace legacy 8.7d polí (`classLevel`, `otherProf`, `features`) read-only přes JaD-style derive (jiné klíče → no-op, data v DB nedotčená).

## 5. Akceptační kritéria (DoD)

1. Deník = JaD layout (multipovolání+obory, zázemí select, auto úroveň, přidávatelné sekce, kouzla tab); Černokněžník 2 osy.
2. Mapa PC + chat PC = DndCombatPanel (k20, fatální, mixed zásah, iniciativa).
3. Bestie mapa + chat = pergamen statblok (k20, HP±, edit).
4. 8 skinů (fantasy default) přes `data-diary-skin`.
5. Build čistý, testy zelené, ESLint čistý, `export-schemas` proběhl (BE deploy nutný).
6. `funkce` + `napoveda` po živé kontrole.
