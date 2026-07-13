# Spec 21.5b — Lektvary (komunitní katalog) — šablony per systém + suroviny + obchod

> Roadmap: [docs/roadmap2.md](../../roadmap2.md) krok **21.5b**. Navazuje na: [spec-21.5](spec-21.5-spolecna-tvorba.md) (hub + stub `/ikaros/lektvary`), **dědí model** [spec-21.5c](spec-21.5c-kouzla.md) (kouzla — jádro + statblocky per systém + schvalování „balancnuté") a [spec-21.5a](spec-21.5a-herbar.md) (herbář — suggestedPrice + vklad do obchodu single/bulk).
> **Stav:** 🟢 IMPLEMENTOVÁNO (2026-07-13) — BE modul `potions` i FE `/ikaros/lektvary` (knihovny, detail s kartou surovin, editor, statblocky, vklad do obchodu single/bulk). Ověřeno: BE typecheck+lint ✓ · FE build ✓ · vitest (cílené 45 + plná suita). Zbývá: skiny · propojení surovin na herbář · seed z uživatelova dokumentu (dodá později). Schváleno uživatelem 2026-07-13 („Jo šlo by to dej se do toho") + požadavek: **suroviny vždy strukturovaně (co + kolik)**.

---

## 1. Účel

Komunitní katalog **vlastních lektvarů** pod Společnou tvorbou (`/ikaros/lektvary`). Lektvar = spotřební zboží: recept (suroviny + množství), účinek, per-systém výrobní/mechanický statblok, a **vklad do obchodu světa** (lektvar je to, co si hráč kupuje).

## 2. Klíčová rozhodnutí (diskuze 2026-07-13)

- **R1 — Hybrid kouzla × herbář.** Statblocky per systém + per-statblok schvalování (balanc) + dvouúrovňová diskuse = z kouzel (21.5c). `suggestedPrice` + vklad do obchodu (single z detailu + bulk z listu, reuse `POST /campaign/shopitems/bulk`) = z herbáře (21.5a Etapa B).
- **R2 — Druh lektvaru v JÁDRU.** Na rozdíl od školy magie (per-systém taxonomie) je druh lektvaru systémově neutrální → společné pole + filtr: *léčivý · posilující · ochranný · jed · proměnový · iluzorní · poznávací · očarovací* + vlastní text (combo).
- **R3 — Suroviny strukturovaně a povinně (zadání uživatele).** Jádro nese `ingredients: [{ name, amount? }]` — seznam surovin s volitelným množstvím („2× květ anděliky", „1 dram lučebnin"), **min. 1 položka**. Volný text nestačí — připravuje budoucí propojení na rostliny herbáře (odkaz surovina → karta rostliny; odloženo, §8).
- **R4 — Žádný přepis příruček** (copyright, jako 21.5c). Seed: uživatel možná dodá VLASTNÍ dokument lektvarů (jeho tvorba = OK) — otevřená otázka §8, katalog startuje prázdný.
- **R5 — Šablony statbloků ve FE, BE schema-less** (spec 21.5c R6). Reuse typů a form/view komponent z kouzel (`SpellFieldDef`, `SpellStatsFields`, `SpellStatblockView` — zobecněné), vzor BE: plants importuje `isBestieCurator` z bestiae.
- **R6 — Hodnoty polí = text** (vzorce), enum jen uzavřené množiny (vzácnost, forma, spouštěč…).

## 3. Datový model — `Potion` (kolekce `potions`, mirror `spells` + jádro navíc)

```
Potion {
  scope: 'community', systemId (primární)
  name, aliases?
  imageUrl?, imageBytes?, imageFocalX/Y?, imageZoom?, imageFit?
  kind                                     // R2 — druh lektvaru (string, povinné)
  ingredients: [{ name, amount? }]         // R3 — suroviny (min. 1)
  description                              // „oznámení" — popis účinku / lore
  tags[]?
  suggestedPrice?: number|null             // R1 — předvyplní vklad do obchodu
  status: 'draft'|'approved', authorId, approvedAt?, approvedBy?
  moderationHidden?, moderationHiddenReason?
  statblocks: Record<systemId, { systemStats, status, authorId, createdAt }>
}
```

Komentáře `potion_comments` (targetType `'potion'|'statblock'`), pending `community_potion_pending_review`, moderace `ReportTargetType.Potion` — vše mirror 21.5c.

## 4. Šablony statbloků per systém (⭐ = povinné)

Zdroje: oficiální DrD formát (david-zbiral.cz/altar FAQ), deník DrDH (recepty mana/suroviny/základ/obtížnost), JaD SRD (vzácnosti kouzelných předmětů), GURPS Magic (elixíry), SR6 (preparáty). DrD+ alchymistu nemá (6 profesí) → volná šablona.

- **drd16** *(oficiální formát alchymisty)*: ⭐ Magenergie („7 magů") · ⭐ Suroviny („30 zl") · Základ (co + hmotnost v mincích) · ⭐ Výroba („1 směna") · ⭐ Trvání · Past · Zdroj/kniha
- **drdh** *(superset deníkových receptů)*: ⭐ Mana · ⭐ Suroviny · Základ · ⭐ Obtížnost · Výroba · Trvání
- **dnd5e / jad**: ⭐ Vzácnost (enum: *běžný · neobvyklý · vzácný · velmi vzácný · legendární*) · ⭐ Účinek (mechanika, textarea) · Trvání · Výroba (cena/čas)
- **gurps**: ⭐ Forma (*lektvar · mast · prášek · pastilka*) · ⭐ Cena surovin · ⭐ Doba výroby · ⭐ Trvání · Dovednost/předpoklad
- **shadowrun**: ⭐ Spouštěč (*kontaktní · povelový · časový*) · ⭐ Síla (potency) · Založeno na kouzle · Odliv · Trvání (CZ termíny doladit)
- **matrix**: Cena/náročnost · Účinek (textarea) · Trvání — pole potvrdit s autorem systému
- **Volná šablona** (páry popisek:hodnota): **drdplus** (bez alchymisty) · **drd2** (mastičkář — improvizace) · **coc** (mýtické odvary; nabídka: náklady příčetnost/magie) · **pi/fate/fae** · **generic**

Pozn.: statblok NEMÁ druh (ten je v jádru R2) — první pole šablony je systémové (magenergie/vzácnost/forma…), invariant „druh všude" plní jádro.

## 5. Vklad do obchodu (reuse herbář Etapa B)

- **Po jedné:** detail → „＋ Vlož do obchodu": výběr světa (PomocnyPJ+, `useMyWorlds`) + skupina (`useShopGroups`) + cena/měna předvyplněná `suggestedPrice ?? 0`. ShopItem: name, description = účinek + suroviny, imageUrl+výřez.
- **Hromadně:** z listu „🛒 Vlož vše do obchodu" — bulk po dávkách ≤200 (`POST /campaign/shopitems/bulk`, gate PomocnyPJ+ hotový z 21.5a). BE beze změn.

## 6. FE kostra

Route `/ikaros/lektvary` (+ `/:id`) nahrazuje stub; dlaždice active. Knihovny/filtry (systém · druh · štítek), detail „karta lektvaru" (jádro + **tabulka surovin s množstvím** + statblok taby + diskuse 2 úrovně), editor (jádro vč. dynamických řádků surovin + první statblok), návrh statbloku. Data-atributy `data-potion-*` (skiny později).

## 7. Pořadí stavby

1) BE modul `potions` (mirror spells + kind/ingredients/suggestedPrice + filtr kind) + enumy + app.module → typecheck+lint
2) FE: potionTemplates (reuse typů z kouzel) + zobecnění `SpellStatblockView` (template prop) + typy/api/hooky + stránky + editor + vklad do obchodu → build+vitest+eslint
3) Docs: funkce + napoveda + roadmap2 + errorCodes regen

## 8. Mimo scope / otevřené otázky

- **Seed z uživatelova dokumentu lektvarů** — dodá později (vlastní tvorba, copyright OK); katalog startuje prázdný.
- **Propojení surovin na herbář** (ingredience → odkaz na rostlinu) — model připraven (strukturované suroviny), UI odloženo.
- Skiny · klon do světa mimo obchod · import do deníku — odloženo (jako 21.5c).
